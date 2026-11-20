-- ==============================================================================
-- SCHÉMA OFFICIEL SUPABASE SÉCURISÉ - ÉTUDIANT ENTREPRENEURIAT AFRIQUE (EEA)
-- Exécutez ce script dans l'éditeur SQL de votre tableau de bord Supabase
-- Prêt pour la production et conforme aux standards de confidentialité
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLE DES MEMBRES
create table if not exists public.members (
    id uuid default gen_random_uuid() primary key,
    membership_id text unique not null,
    first_name text not null,
    last_name text not null,
    email text not null,
    phone text not null,
    country text not null,
    university text not null,
    field_of_study text not null,
    photo_url text,
    card_pdf_url text,
    card_image_url text,
    qr_code_token text unique not null,
    status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'revoked')),
    payment_method text,
    payment_reference text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone default timezone('utc'::text, now() + interval '100 years') not null -- Adhésion permanente à vie
);

-- Colonnes additionnelles rétrocompatibles
alter table public.members add column if not exists payment_method text;
alter table public.members add column if not exists payment_reference text;

-- Index de recherche rapide
create index if not exists idx_members_membership_id on public.members(membership_id);
create index if not exists idx_members_qr_code_token on public.members(qr_code_token);
create index if not exists idx_members_email on public.members(email);
create index if not exists idx_members_status on public.members(status);
create index if not exists idx_members_country on public.members(country);
create index if not exists idx_members_created_at on public.members(created_at desc);

-- 3. TABLE DES PAIEMENTS
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    member_id uuid not null references public.members(id) on delete cascade,
    amount numeric not null default 3000,
    currency text not null default 'XOF',
    provider text not null check (provider in ('wave', 'orange_money', 'stripe', 'cinetpay', 'paydunya', 'whatsapp_manual')),
    transaction_reference text,
    status text not null default 'pending' check (status in ('pending', 'successful', 'failed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    paid_at timestamp with time zone
);

create index if not exists idx_payments_member_id on public.payments(member_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_reference on public.payments(transaction_reference);

-- 3B. TABLES DE SÉCURITÉ SERVEUR (2FA ANTI-REJEU, RÉVOCATION DE SESSION & RATE LIMITING PERSISTANT)
create table if not exists public.admin_otp_challenges (
    jti text primary key,
    email text not null,
    code_hash text not null,
    attempts_left integer not null default 3,
    fingerprint text not null,
    client_ip text not null,
    consumed boolean not null default false,
    issued_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone not null
);

create index if not exists idx_admin_otp_expires_at on public.admin_otp_challenges(expires_at);

create table if not exists public.admin_sessions (
    jti text primary key,
    email text not null,
    fingerprint text not null,
    revoked boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone not null
);

create index if not exists idx_admin_sessions_expires_at on public.admin_sessions(expires_at);

create table if not exists public.rate_limits (
    bucket_key text primary key,
    count integer not null default 1,
    window_start timestamp with time zone default timezone('utc'::text, now()) not null,
    lock_until timestamp with time zone
);

create index if not exists idx_rate_limits_window_start on public.rate_limits(window_start);

-- Fonction atomique de rate limiting distribué (réservée au backend service_role)
create or replace function public.consume_rate_limit_db(
    p_key text,
    p_window_ms integer,
    p_max_requests integer
)
returns table (
    allowed boolean,
    remaining integer,
    retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_now timestamp with time zone := timezone('utc'::text, now());
    v_window interval := (p_window_ms || ' milliseconds')::interval;
    v_count integer;
    v_window_start timestamp with time zone;
    v_retry integer;
begin
    insert into public.rate_limits (bucket_key, count, window_start, lock_until)
    values (p_key, 1, v_now, null)
    on conflict (bucket_key) do update
    set
        count = case
            when public.rate_limits.window_start + v_window <= v_now then 1
            else public.rate_limits.count + 1
        end,
        window_start = case
            when public.rate_limits.window_start + v_window <= v_now then v_now
            else public.rate_limits.window_start
        end
    returning public.rate_limits.count, public.rate_limits.window_start
    into v_count, v_window_start;

    if v_count > p_max_requests then
        v_retry := greatest(1, ceil(extract(epoch from ((v_window_start + v_window) - v_now)))::integer);
        return query select false, 0, v_retry;
    else
        return query select true, greatest(0, p_max_requests - v_count), 0;
    end if;
end;
$$;

revoke all on function public.consume_rate_limit_db(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit_db(text, integer, integer) to service_role;

-- 4. BUCKETS DE STOCKAGE SUPABASE (Storage)
insert into storage.buckets (id, name, public)
values
    ('member-photos', 'member-photos', true),
    ('member-cards', 'member-cards', true)
on conflict (id) do nothing;

-- 5. POLITIQUES DE SÉCURITÉ (Row Level Security - RLS)
alter table public.members enable row level security;
alter table public.payments enable row level security;
alter table public.admin_otp_challenges enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.rate_limits enable row level security;

-- A. Table members: Accès strictement limité au rôle service_role (Zéro exposition anon/authenticated)
drop policy if exists "Lecture publique de vérification de carte" on public.members;
drop policy if exists "Lecture des membres restreinte aux administrateurs" on public.members;
drop policy if exists "Lecture des membres restreinte au service role" on public.members;
create policy "Lecture des membres restreinte au service role"
    on public.members
    for select
    using (auth.role() = 'service_role');

-- B. Table members: Insertion sécurisée réservée au backend applicatif (Service Role uniquement)
drop policy if exists "Insertion d'un nouveau membre lors du tunnel" on public.members;
drop policy if exists "Insertion membre par service role" on public.members;
create policy "Insertion membre par service role"
    on public.members
    for insert
    with check (auth.role() = 'service_role');

-- C. Table members: Mise à jour et suppression réservées au service role
drop policy if exists "Mise à jour membre par service role" on public.members;
create policy "Mise à jour membre par service role"
    on public.members
    for update
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

drop policy if exists "Suppression membre par service role" on public.members;
create policy "Suppression membre par service role"
    on public.members
    for delete
    using (auth.role() = 'service_role');

-- D. Table payments: Accès réservé exclusivement au service role
drop policy if exists "Insertion d'un paiement en attente" on public.payments;
drop policy if exists "Insertion d'un paiement par service role" on public.payments;
create policy "Insertion d'un paiement par service role"
    on public.payments
    for insert
    with check (auth.role() = 'service_role');

drop policy if exists "Lecture des paiements par service role ou authentifié" on public.payments;
drop policy if exists "Lecture des paiements par service role" on public.payments;
create policy "Lecture des paiements par service role"
    on public.payments
    for select
    using (auth.role() = 'service_role');

drop policy if exists "Mise à jour paiements par service role" on public.payments;
create policy "Mise à jour paiements par service role"
    on public.payments
    for update
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

-- E. Tables de sécurité internes: Service role uniquement
drop policy if exists "OTP challenges service role only" on public.admin_otp_challenges;
create policy "OTP challenges service role only"
    on public.admin_otp_challenges
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

drop policy if exists "Admin sessions service role only" on public.admin_sessions;
create policy "Admin sessions service role only"
    on public.admin_sessions
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

drop policy if exists "Rate limits service role only" on public.rate_limits;
create policy "Rate limits service role only"
    on public.rate_limits
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

-- F. Politiques de stockage (Pas de FOR SELECT public sur storage.objects pour empêcher le listing de bucket)
-- Les buckets étant public=true, les fichiers individuels restent accessibles par URL directe CDN sans permettre le listage.
drop policy if exists "Accès public en lecture des photos de membres" on storage.objects;
drop policy if exists "Upload public des photos de membres" on storage.objects;
drop policy if exists "Upload des photos de membres par service role" on storage.objects;
create policy "Upload des photos de membres par service role"
    on storage.objects for insert
    with check (
        bucket_id = 'member-photos'
        and auth.role() = 'service_role'
    );

drop policy if exists "Suppression des photos par service role" on storage.objects;
create policy "Suppression des photos par service role"
    on storage.objects for delete
    using (
        bucket_id = 'member-photos'
        and auth.role() = 'service_role'
    );

drop policy if exists "Accès public en lecture des cartes de membres" on storage.objects;
drop policy if exists "Upload des cartes générées par admin" on storage.objects;
create policy "Upload des cartes générées par admin"
    on storage.objects for insert
    with check (
        bucket_id = 'member-cards'
        and auth.role() = 'service_role'
    );

-- 6. FONCTION RPC DE VÉRIFICATION PUBLIQUE SÉCURISÉE (Anti-Scraping & Zero-Trust)
-- Correspondance stricte par qr_code_token haute entropie (search_path verrouillé).
create or replace function public.get_verified_badge(token_input text)
returns table (
    membership_id text,
    first_name text,
    last_name text,
    country text,
    university text,
    field_of_study text,
    photo_url text,
    status text,
    created_at timestamp with time zone,
    expires_at timestamp with time zone
)
language sql
security definer
set search_path = public
as $$
    select
        m.membership_id,
        m.first_name,
        m.last_name,
        m.country,
        m.university,
        m.field_of_study,
        m.photo_url,
        m.status,
        m.created_at,
        m.expires_at
    from public.members m
    where m.qr_code_token = token_input
    limit 1;
$$;

-- Rechargement immédiat du cache de schéma PostgREST
notify pgrst, 'reload schema';

-- ==============================================================================
-- FIN DU SCRIPT SÉCURISÉ SUPABASE
-- ==============================================================================
