-- =============================================================================
-- DIGITAL PEAK — Database Schema per Supabase
-- Tabella: leads (Salvataggio richieste dal form contatti del sito)
-- v2: aggiunta colonna page_url (URL della pagina in cui il lead ha compilato il form)
-- =============================================================================

-- 1. Creazione tabella leads
create table if not exists public.leads (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    email text not null,
    phone text,
    message text not null,
    lang text default 'it' not null,
    page_url text,              -- URL della pagina sorgente da cui il form è stato inviato
    status text default 'new' not null check (status in ('new', 'contacted', 'qualified', 'closed', 'archived')),
    notes text,
    source text default 'website_contact_form'
);

-- 2. Indici per performance e query rapide
create index if not exists idx_leads_created_at on public.leads (created_at desc);
create index if not exists idx_leads_status on public.leads (status);
create index if not exists idx_leads_email on public.leads (email);

-- 3. Abilitazione Row Level Security (RLS)
alter table public.leads enable row level security;

-- 4. Policy: Consenti inserimenti anonimi dall'API del sito (Serverless / Frontend)
create policy "Consenti inserimento lead da sito"
    on public.leads
    for insert
    to anon, authenticated, service_role
    with check (true);

-- 5. Policy: Lettura e modifica consentite solo agli utenti autenticati (Dashboard Supabase / Admin)
create policy "Accesso completo ai lead solo per amministratori autenticati"
    on public.leads
    for all
    to authenticated, service_role
    using (true)
    with check (true);

-- Commenti informativi sulla tabella
comment on table public.leads is 'Lead commerciali e richieste di contatto acquisite dal sito Digital Peak';
comment on column public.leads.status is 'Stato del lead: new (nuovo), contacted (contattato), qualified (qualificato), closed (chiuso), archived (archiviato)';
