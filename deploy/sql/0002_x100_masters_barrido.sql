-- Applied 2026-11-25: the first-run sweep sends as 'barrido'.
alter table x100_masters.envios drop constraint envios_disparador_check;
alter table x100_masters.envios add constraint envios_disparador_check check (disparador in ('ventana', 'diaria', 'cierre', 'barrido', 'prueba'));
