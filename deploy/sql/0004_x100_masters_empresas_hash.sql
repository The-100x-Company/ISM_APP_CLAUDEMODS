-- 0.5.0 · Multiempresa, correos en hash y llave por instalación.
-- Aplicada con GO de Tomás (2026-11-26): «GO 0.5.0 con máximo recurrente y hash de correos».
--
-- Qué cambia:
--   · empresas: una fila por empresa (nombre, organización de Claude, dominios). El ranking toma su nombre de aquí.
--   · envios: sin correo. Queda `persona` = sha256('x100-masters:' || correo en minúsculas), un nombre corto
--     («Marta R.») y la empresa. El paquete guardado ya no lleva el correo.
--   · llaves: el mod pide una llave en su primer envío (registro) y la usa para enviar y para leer el ranking.
--     La base guarda solo el sha256 de la llave.
--   · ingest acepta el esquema /2 (mods 0.3.x y 0.4.0, que aún mandan el correo: se convierte aquí y no se guarda)
--     y el /3 (0.5.0: persona en hash, llave, nombre corto).
--   · equipo(p_llave) reemplaza a equipo(p_correo): sin llave no hay ranking.
--   · rol (owner, primary_owner, admin, user) y licencia (premium, estandar) llegan en el paquete /3. Los owners y
--     admins reciben además recomendaciones y resumen de cada miembro (vista por persona y Spiderweb del equipo).
--     Límite: el rol lo declara el mod; no hay forma de verificarlo contra Anthropic desde aquí.
--   · consumo: tokens que el propio mod gastó en sus evaluaciones (columna oculta: el ranking no la devuelve).
--   · talento: arquetipos de la radiografía (par y puntajes) para el ranking, compañeros y maestros ideales.

-- Nombre a partir de la parte local del correo: «marta.ruiz» → «Marta Ruiz»; «marta.r» → «Marta R.»;
-- «mruiz» → «Mruiz» (no se puede deducir el apellido).
create or replace function x100_masters.nombre_corto(p text) returns text
language sql immutable set search_path = '' as $$
  select case
    when length(split_part(w, ' ', 2)) > 1 then initcap(split_part(w, ' ', 1)) || ' ' || initcap(split_part(w, ' ', 2))
    when length(split_part(w, ' ', 2)) = 1 then initcap(split_part(w, ' ', 1)) || ' ' || upper(split_part(w, ' ', 2)) || '.'
    else initcap(split_part(w, ' ', 1)) end
  from (select trim(regexp_replace(regexp_replace(lower(p), '[0-9]+', '', 'g'), '[._-]+', ' ', 'g')) w) x
$$;

create table if not exists x100_masters.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  organizacion text not null unique,
  dominios text[] not null,
  creada timestamptz not null default now()
);
alter table x100_masters.empresas enable row level security;

insert into x100_masters.empresas (nombre, organizacion, dominios)
values ('ISMO Motors', '<uuid de la organización de Claude de ISMO>', array['ismomotors.com', 'grupoislo.com'])
on conflict (organizacion) do nothing;

create table if not exists x100_masters.llaves (
  llave text primary key,               -- sha256 de la llave; la llave solo vive en la máquina de la persona
  persona text not null,
  empresa uuid not null references x100_masters.empresas(id),
  creada timestamptz not null default now(),
  usada timestamptz,
  usos integer not null default 0,      -- lecturas del ranking en la ventana actual
  ventana timestamptz not null default now(),
  revocada boolean not null default false
);
alter table x100_masters.llaves enable row level security;
create index if not exists llaves_persona on x100_masters.llaves (persona, creada desc);
create index if not exists llaves_empresa on x100_masters.llaves (empresa, creada desc);

-- envios: del correo al hash.
alter table x100_masters.envios
  add column if not exists persona text,
  add column if not exists nombre text,
  add column if not exists empresa uuid references x100_masters.empresas(id),
  add column if not exists dominio_txt text,
  add column if not exists rol text,
  add column if not exists licencia text,
  add column if not exists consumo jsonb,
  add column if not exists talento jsonb;

update x100_masters.envios set
  persona = encode(extensions.digest('x100-masters:' || lower(trim(correo)), 'sha256'), 'hex'),
  nombre = x100_masters.nombre_corto(split_part(lower(trim(correo)), '@', 1)),
  dominio_txt = split_part(lower(trim(correo)), '@', 2),
  paquete = paquete - 'correo';

update x100_masters.envios v set empresa = e.id
from x100_masters.empresas e
where v.dominio_txt = any(e.dominios);

drop view if exists x100_masters.ranking;
drop index if exists x100_masters.envios_correo_enviado;
alter table x100_masters.envios drop column dominio;
alter table x100_masters.envios drop column correo;
alter table x100_masters.envios rename column dominio_txt to dominio;
alter table x100_masters.envios alter column persona set not null, alter column nombre set not null, alter column dominio set not null, alter column empresa set not null;
create index if not exists envios_persona_enviado on x100_masters.envios (persona, enviado desc);
create index if not exists envios_empresa_enviado on x100_masters.envios (empresa, enviado desc);

create view x100_masters.ranking with (security_invoker = true) as
select distinct on (persona) persona, nombre, empresa, dominio, puntaje, nivel, categorias, enviado
from x100_masters.envios
where disparador <> 'prueba'
order by persona, enviado desc;

-- Registro: entrega una llave si la organización y el dominio son de una empresa dada de alta.
create or replace function public.x100_masters_registro(p_persona text, p_dominio text, p_organizacion text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_empresa uuid;
  v_nombre text;
  v_token text;
begin
  if coalesce(p_persona, '') !~ '^[0-9a-f]{64}$' then raise exception 'persona no válida'; end if;
  select e.id, e.nombre into v_empresa, v_nombre
  from x100_masters.empresas e
  where e.organizacion = p_organizacion and lower(trim(p_dominio)) = any(e.dominios);
  if v_empresa is null then return jsonb_build_object('empresa', null); end if;
  if (select count(*) from x100_masters.llaves l where l.empresa = v_empresa and l.creada > now() - interval '1 hour') >= 60 then
    raise exception 'demasiados registros';
  end if;
  -- Hasta cinco equipos por persona: el sexto retira el más viejo.
  update x100_masters.llaves set revocada = true
  where llave in (select l.llave from x100_masters.llaves l where l.persona = p_persona and not l.revocada order by l.creada desc offset 4);
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into x100_masters.llaves (llave, persona, empresa) values (encode(extensions.digest(v_token, 'sha256'), 'hex'), p_persona, v_empresa);
  return jsonb_build_object('empresa', v_nombre, 'ranking', 'Ranking ' || v_nombre, 'llave', v_token);
end;
$$;

create or replace function public.x100_masters_ingest(paquete jsonb)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_esquema text := paquete->>'esquema';
  v_correo text;
  v_llave text;
  v_persona text;
  v_nombre text;
  v_dominio text;
  v_empresa uuid;
  v_id text;
begin
  if octet_length(paquete::text) > 200000 then raise exception 'paquete demasiado grande'; end if;

  if v_esquema = 'x100-masters/2' then
    -- Mods 0.3.x y 0.4.0: el correo llega en claro; se convierte aquí y no se guarda.
    v_correo := lower(trim(paquete->>'correo'));
    if coalesce(v_correo, '') !~ '^[^@\s]+@[^@\s]+$' then raise exception 'correo no válido'; end if;
    v_dominio := split_part(v_correo, '@', 2);
    select e.id into v_empresa from x100_masters.empresas e
    where e.organizacion = paquete->>'organizacion' and v_dominio = any(e.dominios);
    if v_empresa is null then raise exception 'empresa no registrada'; end if;
    v_persona := encode(extensions.digest('x100-masters:' || v_correo, 'sha256'), 'hex');
    v_nombre := x100_masters.nombre_corto(split_part(v_correo, '@', 1));
  elsif v_esquema = 'x100-masters/3' then
    v_llave := encode(extensions.digest(coalesce(paquete->>'llave', ''), 'sha256'), 'hex');
    select l.persona, l.empresa into v_persona, v_empresa from x100_masters.llaves l where l.llave = v_llave and not l.revocada;
    if v_persona is null or v_persona is distinct from paquete->>'persona' then raise exception 'llave no válida'; end if;
    v_dominio := lower(trim(paquete->>'dominio'));
    if not exists (select 1 from x100_masters.empresas e where e.id = v_empresa and v_dominio = any(e.dominios)) then
      raise exception 'dominio no permitido';
    end if;
    v_nombre := left(trim(regexp_replace(coalesce(paquete->>'nombre', ''), '[^[:alpha:] .''-]', '', 'g')), 60);
    if v_nombre = '' then v_nombre := 'Sin nombre'; end if;
    update x100_masters.llaves set usada = now() where llave = v_llave;
  else
    raise exception 'esquema no soportado';
  end if;

  if (select count(*) from x100_masters.envios e where e.persona = v_persona and e.recibido > now() - interval '10 minutes') >= 30 then
    raise exception 'demasiados envíos';
  end if;

  insert into x100_masters.envios (persona, nombre, empresa, dominio, rol, licencia, consumo, talento, organizacion, superficie, disparador, version, puntaje, nivel, categorias, uso, resumen, enviado, paquete)
  values (
    v_persona, v_nombre, v_empresa, v_dominio,
    case when paquete->>'rol' in ('owner', 'primary_owner', 'admin', 'user', 'membership_admin') then paquete->>'rol' end,
    case when paquete->>'licencia' in ('premium', 'estandar') then paquete->>'licencia' end,
    case when jsonb_typeof(paquete->'consumo') = 'object' then paquete->'consumo' end,
    case when jsonb_typeof(paquete->'talento') = 'object' then paquete->'talento' end,
    paquete->>'organizacion', paquete->>'superficie', paquete->>'disparador', paquete->>'version',
    (paquete->>'puntaje')::integer, paquete->>'nivel', coalesce(paquete->'categorias', '{}'::jsonb), coalesce(paquete->'uso', '{}'::jsonb),
    paquete->>'resumen', coalesce((paquete->>'enviado')::timestamptz, now()), paquete - 'correo' - 'llave' - 'consumo'
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

drop function if exists public.x100_masters_equipo(text);

-- El ranking de la empresa de la llave: nombres cortos y puntajes, nunca correos ni hashes.
create or replace function public.x100_masters_equipo(p_llave text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_llave text := encode(extensions.digest(coalesce(p_llave, ''), 'sha256'), 'hex');
  v_persona text;
  v_empresa uuid;
  v_usos integer;
  v_ventana timestamptz;
  v_nombre text;
  v_admin boolean;
  v_out jsonb;
begin
  select l.persona, l.empresa, l.usos, l.ventana into v_persona, v_empresa, v_usos, v_ventana
  from x100_masters.llaves l where l.llave = v_llave and not l.revocada;
  if v_persona is null then raise exception 'llave no válida'; end if;
  if v_ventana > now() - interval '1 hour' and v_usos >= 120 then raise exception 'demasiadas consultas'; end if;
  update x100_masters.llaves set
    usos = case when ventana > now() - interval '1 hour' then usos + 1 else 1 end,
    ventana = case when ventana > now() - interval '1 hour' then ventana else now() end,
    usada = now()
  where llave = v_llave;
  select e.nombre into v_nombre from x100_masters.empresas e where e.id = v_empresa;
  select coalesce(e.rol in ('owner', 'primary_owner', 'admin'), false) into v_admin
  from x100_masters.envios e where e.persona = v_persona and e.empresa = v_empresa order by e.enviado desc limit 1;
  v_admin := coalesce(v_admin, false);

  with ultimo as (
    select distinct on (e.persona) e.persona, e.nombre, e.puntaje, e.nivel, e.categorias, e.paquete, e.enviado, e.licencia, e.talento
    from x100_masters.envios e
    where e.empresa = v_empresa and e.disparador <> 'prueba'
    order by e.persona, e.enviado desc
  ), met as (
    select u.persona, u.nombre, m->>'id' id, (m->>'nivel')::numeric nivel,
      coalesce((m->>'potencial')::numeric, (m->>'nivel')::numeric) potencial
    from ultimo u, jsonb_array_elements(coalesce(u.paquete->'metricas', '[]'::jsonb)) m
    where m->>'nivel' is not null
  ), detalle as (
    select persona, jsonb_object_agg(id, jsonb_build_array(nivel, potencial)) d from met group by persona
  ), por_metrica as (
    select id, round(avg(nivel), 1) media,
      (array_agg(nombre order by potencial desc, nivel desc))[1] master,
      max(potencial) master_nivel
    from met group by id
  ), por_categoria as (
    select c.cat, round(avg((u.categorias->>c.cat)::numeric)) media,
      (array_agg(u.nombre order by coalesce((u.paquete->'potencial'->'categorias'->>c.cat)::numeric, (u.categorias->>c.cat)::numeric) desc nulls last))[1] master,
      max(coalesce((u.paquete->'potencial'->'categorias'->>c.cat)::numeric, (u.categorias->>c.cat)::numeric)) master_nivel
    from ultimo u cross join (values ('herramienta'), ('estructura'), ('sistema'), ('valor')) c(cat)
    where u.categorias->>c.cat is not null
    group by c.cat
  )
  select jsonb_build_object(
    'empresa', v_nombre,
    'ranking', 'Ranking ' || v_nombre,
    'admin', v_admin,
    'corte', now(),
    'personas', (select coalesce(jsonb_agg(jsonb_build_object(
        'nombre', u.nombre, 'puntaje', u.puntaje, 'nivel', u.nivel, 'categorias', u.categorias,
        'potencial', u.paquete->'potencial', 'dias', coalesce((u.paquete->'uso'->>'dias_promedio')::int, 0),
        'yo', u.persona = v_persona, 'metricas', coalesce(d.d, '{}'::jsonb), 'licencia', u.licencia, 'talento', u.talento)
        || case when v_admin then jsonb_build_object('resumen', u.paquete->>'resumen',
             'recomendaciones', (select coalesce(jsonb_agg(jsonb_build_object('categoria', r->>'categoria', 'texto', r->>'texto')), '[]'::jsonb) from jsonb_array_elements(coalesce(u.paquete->'recomendaciones', '[]'::jsonb)) r))
           else '{}'::jsonb end
        order by coalesce((u.paquete->'potencial'->>'puntaje')::int, u.puntaje) desc, u.puntaje desc), '[]'::jsonb)
      from ultimo u left join detalle d using (persona)),
    'metricas', (select coalesce(jsonb_object_agg(id, jsonb_build_object('media', media, 'master', master, 'master_nivel', master_nivel)), '{}'::jsonb) from por_metrica),
    'categorias', (select coalesce(jsonb_object_agg(cat, jsonb_build_object('media', media, 'master', master, 'master_nivel', master_nivel)), '{}'::jsonb) from por_categoria)
  ) into v_out;

  return v_out;
end;
$$;

revoke all on function public.x100_masters_registro(text, text, text) from public;
revoke all on function public.x100_masters_equipo(text) from public;
grant execute on function public.x100_masters_registro(text, text, text) to anon, authenticated;
grant execute on function public.x100_masters_equipo(text) to anon, authenticated;
revoke all on function x100_masters.nombre_corto(text) from public;
