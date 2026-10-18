create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  crm text,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin','physician','nutritionist','assistant')),
  active boolean not null default true,
  primary key (organization_id,user_id)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_patient_id text,
  full_name text not null,
  birth_date date not null,
  sex text not null check (sex in ('male','female')),
  email text,
  phone text,
  height_cm numeric(6,2),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patients_org_name_idx on public.patients(organization_id,lower(full_name));
create unique index if not exists patients_org_external_idx on public.patients(organization_id,external_patient_id) where external_patient_id is not null;

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  assessment_date date not null,
  clinician_id uuid not null references public.profiles(id),
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(patient_id,assessment_date)
);

create table if not exists public.bioimpedance (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  weight_kg numeric(7,2),
  bmi numeric(6,2),
  body_fat_pct numeric(6,2),
  fat_mass_kg numeric(7,2),
  muscle_mass_kg numeric(7,2),
  lean_mass_kg numeric(7,2),
  visceral_fat numeric(7,2),
  bmr_kcal numeric(8,2)
);

create table if not exists public.skinfolds (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  protocol text not null default 'jackson_pollock_7',
  chest_mm numeric(6,2),
  axillary_mm numeric(6,2),
  triceps_mm numeric(6,2),
  subscapular_mm numeric(6,2),
  abdomen_mm numeric(6,2),
  suprailiac_mm numeric(6,2),
  thigh_mm numeric(6,2),
  biceps_mm numeric(6,2),
  medial_calf_mm numeric(6,2),
  sum_mm numeric(7,2),
  density numeric(8,5),
  body_fat_pct numeric(6,2)
);

create table if not exists public.anthropometry (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  waist_cm numeric(7,2),
  hip_cm numeric(7,2),
  calf_cm numeric(7,2),
  arm_cm numeric(7,2),
  neck_cm numeric(7,2),
  abdomen_cm numeric(7,2),
  thigh_cm numeric(7,2)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  version integer not null default 1,
  storage_path text,
  chart_text text,
  recipient_email text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid,
  user_id uuid,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.patients enable row level security;
alter table public.assessments enable row level security;
alter table public.bioimpedance enable row level security;
alter table public.skinfolds enable row level security;
alter table public.anthropometry enable row level security;
alter table public.reports enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id=org_id and m.user_id=auth.uid() and m.active=true
  );
$$;

create policy patients_member_select on public.patients for select using (public.is_org_member(organization_id));
create policy patients_member_insert on public.patients for insert with check (public.is_org_member(organization_id));
create policy patients_member_update on public.patients for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

create policy assessments_member_all on public.assessments
for all using (
  exists (
    select 1 from public.patients p
    where p.id=patient_id and public.is_org_member(p.organization_id)
  )
) with check (
  exists (
    select 1 from public.patients p
    where p.id=patient_id and public.is_org_member(p.organization_id)
  )
);

create policy bio_member_all on public.bioimpedance for all using (
  exists (
    select 1 from public.assessments a join public.patients p on p.id=a.patient_id
    where a.id=assessment_id and public.is_org_member(p.organization_id)
  )
) with check (
  exists (
    select 1 from public.assessments a join public.patients p on p.id=a.patient_id
    where a.id=assessment_id and public.is_org_member(p.organization_id)
  )
);

create policy skin_member_all on public.skinfolds for all using (
  exists (
    select 1 from public.assessments a join public.patients p on p.id=a.patient_id
    where a.id=assessment_id and public.is_org_member(p.organization_id)
  )
) with check (
  exists (
    select 1 from public.assessments a join public.patients p on p.id=a.patient_id
    where a.id=assessment_id and public.is_org_member(p.organization_id)
  )
);

create policy anthropometry_member_all on public.anthropometry for all using (
  exists (
    select 1 from public.assessments a join public.patients p on p.id=a.patient_id
    where a.id=assessment_id and public.is_org_member(p.organization_id)
  )
) with check (
  exists (
    select 1 from public.assessments a join public.patients p on p.id=a.patient_id
    where a.id=assessment_id and public.is_org_member(p.organization_id)
  )
);

create policy reports_member_select on public.reports for select using (
  exists (
    select 1 from public.assessments a join public.patients p on p.id=a.patient_id
    where a.id=assessment_id and public.is_org_member(p.organization_id)
  )
);

-- As políticas de profiles, organizations, organization_members e audit_log
-- devem ser ajustadas ao modelo administrativo definitivo antes da produção.
