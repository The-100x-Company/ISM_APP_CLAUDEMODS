-- «Tu Nivel en Claude» (The 100x Co): the telemetry the x100-masters mod sends.
-- Applied 2026-11-25 to 100x-staging (production) with Tomás's approval in chat.
-- The mod has no secret: it calls public.x100_masters_ingest with the project's publishable key.
-- The function checks schema, domain, size and rate; the tables stay closed (RLS on, no policies).
create schema if not exists x100_masters;

create table x100_masters.envios (
  id            text primary key default gen_random_uuid()::text,
  correo        text not null,
  dominio       text generated always as (split_part(correo, '@', 2)) stored,
  organizacion  text,
  superficie    text,
  disparador    text not null check (disparador in ('ventana', 'diaria', 'cierre', 'prueba')),
  version       text not null,
  puntaje       integer not null check (puntaje between 0 and 100),
  nivel         text not null,
  categorias    jsonb not null,
  uso           jsonb not null,
  resumen       text,
  enviado       timestamptz not null,
  recibido      timestamptz not null default now(),
  paquete       jsonb not null
);
create index envios_correo_enviado on x100_masters.envios (correo, enviado desc);

create table x100_masters.metricas (
  envio_id   text not null references x100_masters.envios(id) on delete cascade,
  metrica    text not null,
  categoria  text not null check (categoria in ('herramienta', 'estructura', 'sistema', 'valor')),
  nivel      integer check (nivel between 1 and 5),
  valor      numeric,
  evaluador  text not null check (evaluador in ('codigo', 'haiku', 'sonnet')),
  modelo     text,
  evaluado   timestamptz,
  primary key (envio_id, metrica)
);

create table x100_masters.recomendaciones (
  envio_id   text not null references x100_masters.envios(id) on delete cascade,
  orden      integer not null,
  categoria  text not null check (categoria in ('herramienta', 'estructura', 'sistema', 'valor')),
  texto      text not null,
  evaluador  text not null check (evaluador in ('codigo', 'haiku', 'sonnet')),
  modelo     text,
  evaluado   timestamptz,
  primary key (envio_id, orden)
);

-- The latest package per person, best first: the ranking.
create view x100_masters.ranking with (security_invoker = true) as
select * from (
  select distinct on (correo) correo, dominio, puntaje, nivel, categorias, enviado
  from x100_masters.envios where disparador <> 'prueba' order by correo, enviado desc
) ultimo order by puntaje desc;

alter table x100_masters.envios enable row level security;
alter table x100_masters.metricas enable row level security;
alter table x100_masters.recomendaciones enable row level security;
revoke all on schema x100_masters from anon, authenticated;

-- The only door in: one package, checked, split into the three tables.
create or replace function public.x100_masters_ingest(paquete jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_correo text := lower(trim(paquete->>'correo'));
  v_id text;
begin
  if octet_length(paquete::text) > 200000 then raise exception 'paquete demasiado grande'; end if;
  if paquete->>'esquema' is distinct from 'x100-masters/2' then raise exception 'esquema no soportado'; end if;
  if v_correo !~ '^[^@\s]+@(ismomotors\.com|grupoislo\.com)$' then raise exception 'dominio no permitido'; end if;
  if (select count(*) from x100_masters.envios e where e.correo = v_correo and e.recibido > now() - interval '10 minutes') >= 30 then
    raise exception 'demasiados envíos';
  end if;

  insert into x100_masters.envios (correo, organizacion, superficie, disparador, version, puntaje, nivel, categorias, uso, resumen, enviado, paquete)
  values (
    v_correo, paquete->>'organizacion', paquete->>'superficie', paquete->>'disparador', paquete->>'version',
    (paquete->>'puntaje')::integer, paquete->>'nivel', coalesce(paquete->'categorias', '{}'::jsonb), coalesce(paquete->'uso', '{}'::jsonb),
    paquete->>'resumen', coalesce((paquete->>'enviado')::timestamptz, now()), paquete
  )
  returning id into v_id;

  insert into x100_masters.metricas (envio_id, metrica, categoria, nivel, valor, evaluador, modelo, evaluado)
  select v_id, m->>'id', m->>'categoria', (m->>'nivel')::integer, (m->>'valor')::numeric, m->>'evaluador', m->>'modelo', (m->>'evaluado')::timestamptz
  from jsonb_array_elements(coalesce(paquete->'metricas', '[]'::jsonb)) m;

  insert into x100_masters.recomendaciones (envio_id, orden, categoria, texto, evaluador, modelo, evaluado)
  select v_id, (r.ord)::integer, r.value->>'categoria', r.value->>'texto', r.value->>'evaluador', r.value->>'modelo', (r.value->>'evaluado')::timestamptz
  from jsonb_array_elements(coalesce(paquete->'recomendaciones', '[]'::jsonb)) with ordinality as r(value, ord);

  return v_id;
end;
$$;

revoke all on function public.x100_masters_ingest(jsonb) from public;
grant execute on function public.x100_masters_ingest(jsonb) to anon, authenticated;
