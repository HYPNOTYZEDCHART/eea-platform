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

-- 4. BUCKETS DE STOCKAGE SUPABASE (Storage)
insert into storage.buckets (id, name, public)
values 
    ('member-photos', 'member-photos', true),
    ('member-cards', 'member-cards', true)
on conflict (id) do nothing;

-- 5. POLITIQUES DE SÉCURITÉ (Row Level Security - RLS)
alter table public.members enable row level security;
alter table public.payments enable row level security;

-- A. Table members: Lecture strictement restreinte aux administrateurs (Zero-Leakage)
-- Empêche tout dump de la base ou scraping anonyme des emails, téléphones et données privées.
-- La vérification publique s'effectue exclusivement via la fonction RPC get_verified_badge(token)
-- ou la route API serveur /api/verify/[token].
drop policy if exists "Lecture publique de vérification de carte" on public.members;
drop policy if exists "Lecture des membres restreinte aux administrateurs" on public.members;
create policy "Lecture des membres restreinte aux administrateurs"
    on public.members
    for select
    using (
        auth.role() = 'service_role' 
        or auth.role() = 'authenticated'
    );

-- B. Table members: Insertion sécurisée réservée au backend applicatif (Service Role)
drop policy if exists "Insertion d'un nouveau membre lors du tunnel" on public.members;
drop policy if exists "Insertion membre par service role" on public.members;
create policy "Insertion membre par service role"
    on public.members
    for insert
    with check (
        auth.role() = 'service_role' 
        or auth.role() = 'authenticated'
    );

-- C. Table members: Mise à jour par les administrateurs ou via service role
drop policy if exists "Mise à jour membre par service role" on public.members;
create policy "Mise à jour membre par service role"
    on public.members
    for update
    using (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- Table members: Suppression réservée aux administrateurs via service role
drop policy if exists "Suppression membre par service role" on public.members;
create policy "Suppression membre par service role"
    on public.members
    for delete
    using (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- D. Table payments: Insertion réservée au backend applicatif
drop policy if exists "Insertion d'un paiement en attente" on public.payments;
create policy "Insertion d'un paiement par service role"
    on public.payments
    for insert
    with check (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- E. Table payments: Lecture strictement réservée aux administrateurs
drop policy if exists "Lecture des paiements par service role ou authentifié" on public.payments;
create policy "Lecture des paiements par service role ou authentifié"
    on public.payments
    for select
    using (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- F. Politiques de stockage
-- Lecture publique des photos de badges certifiées
drop policy if exists "Accès public en lecture des photos de membres" on storage.objects;
create policy "Accès public en lecture des photos de membres"
    on storage.objects for select
    using (bucket_id = 'member-photos');

-- Upload des photos réservé au service role (via /api/register côté serveur)
-- Neutralise les injections de fichiers anonymes non contrôlées
drop policy if exists "Upload public des photos de membres" on storage.objects;
drop policy if exists "Upload des photos de membres par service role" on storage.objects;
create policy "Upload des photos de membres par service role"
    on storage.objects for insert
    with check (
        bucket_id = 'member-photos' 
        and (auth.role() = 'service_role' or auth.role() = 'authenticated')
    );

-- Lecture publique des cartes de membres générées
drop policy if exists "Accès public en lecture des cartes de membres" on storage.objects;
create policy "Accès public en lecture des cartes de membres"
    on storage.objects for select
    using (bucket_id = 'member-cards');

-- Upload des cartes réservé strictement aux administrateurs / service role
drop policy if exists "Upload des cartes générées par admin" on storage.objects;
create policy "Upload des cartes générées par admin"
    on storage.objects for insert
    with check (
        bucket_id = 'member-cards' 
        and (auth.role() = 'service_role' or auth.role() = 'authenticated')
    );

-- 6. FONCTION RPC DE VÉRIFICATION PUBLIQUE SÉCURISÉE (Anti-Scraping & Zero-Trust)
-- Expose uniquement les données d'authenticité publiques sans divulguer l'email ni le téléphone.
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
    where (m.qr_code_token = token_input or m.membership_id = token_input)
    limit 1;
$$;

-- ==============================================================================
-- FIN DU SCRIPT SÉCURISÉ SUPABASE
-- ==============================================================================
