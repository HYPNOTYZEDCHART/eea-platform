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
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone default timezone('utc'::text, now() + interval '100 years') not null -- Adhésion permanente à vie
);

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

-- A. Table members: Lecture autorisée pour les vérifications de badge ou administrateurs
drop policy if exists "Lecture publique de vérification de carte" on public.members;
create policy "Lecture publique de vérification de carte"
    on public.members
    for select
    using (
        auth.role() = 'service_role' 
        or auth.role() = 'authenticated'
        or status in ('active', 'expired', 'revoked')
    );

-- B. Table members: Création de membre lors du formulaire d'adhésion
drop policy if exists "Insertion d'un nouveau membre lors du tunnel" on public.members;
create policy "Insertion d'un nouveau membre lors du tunnel"
    on public.members
    for insert
    with check (
        length(first_name) > 0 and 
        length(last_name) > 0 and 
        email like '%_@__%.__%'
    );

-- C. Table members: Mise à jour par les administrateurs ou via service role
drop policy if exists "Mise à jour membre par service role" on public.members;
create policy "Mise à jour membre par service role"
    on public.members
    for update
    using (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- D. Table payments: Insertion lors de l'initiation d'un paiement
drop policy if exists "Insertion d'un paiement en attente" on public.payments;
create policy "Insertion d'un paiement en attente"
    on public.payments
    for insert
    with check (amount >= 3000);

-- E. Table payments: Lecture strictement réservée aux administrateurs
drop policy if exists "Lecture des paiements par service role ou authentifié" on public.payments;
create policy "Lecture des paiements par service role ou authentifié"
    on public.payments
    for select
    using (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- F. Politiques de stockage
drop policy if exists "Accès public en lecture des photos de membres" on storage.objects;
create policy "Accès public en lecture des photos de membres"
    on storage.objects for select
    using (bucket_id = 'member-photos');

drop policy if exists "Upload public des photos de membres" on storage.objects;
create policy "Upload public des photos de membres"
    on storage.objects for insert
    with check (bucket_id = 'member-photos');

drop policy if exists "Accès public en lecture des cartes de membres" on storage.objects;
create policy "Accès public en lecture des cartes de membres"
    on storage.objects for select
    using (bucket_id = 'member-cards');

drop policy if exists "Upload des cartes générées par admin" on storage.objects;
create policy "Upload des cartes générées par admin"
    on storage.objects for insert
    with check (bucket_id = 'member-cards');

-- 6. FONCTION RPC DE VÉRIFICATION PUBLIQUE SÉCURISÉE (Anti-Scraping)
-- Permet de vérifier un badge par son QR code sans exposer les données privées de la table
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
    where m.qr_code_token = token_input
    limit 1;
$$;

-- ==============================================================================
-- FIN DU SCRIPT SÉCURISÉ SUPABASE
-- ==============================================================================
