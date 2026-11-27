-- 0006 · El rol de admin sale del último envío que declara rol (0.5.0+). Un cliente 0.3.x de la misma persona,
-- que no manda rol, ya no le apaga la vista de admin.

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
  from x100_masters.envios e where e.persona = v_persona and e.empresa = v_empresa and e.rol is not null order by e.recibido desc limit 1;
  v_admin := coalesce(v_admin, false);

  with ultimo as (
    select distinct on (e.persona) e.persona, e.nombre, e.puntaje, e.nivel, e.categorias, e.paquete, e.enviado, e.licencia, e.talento, e.consumo
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
             'consumo', u.consumo,
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
