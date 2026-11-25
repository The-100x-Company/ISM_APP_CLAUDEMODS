# x100-masters · Tu Nivel en Claude by The 100x Co

Mide qué tan bien usa Claude cada persona y envía los puntajes, nunca los prompts.

- **37 métricas, niveles 1 a 5**, en cuatro categorías: uso de la herramienta (30 %), estructuración y elaboración (30 %), sistematización y recursividad (20 %), enfoque en valor de negocio (20 %).
- **Primer uso:** barre los transcripts locales de los últimos 15 días (prompts, sesiones, herramientas, tokens) y Haiku lee una muestra de 10 prompts por día. Corre una vez por persona y equipo, en segundo plano.
- **Promedio:** lo que se ve y se envía es el promedio de los últimos 10 días de uso.
- **Evaluadores:** el código cuenta el uso en cada prompt y herramienta; Haiku lee cada ventana de 10 prompts; Sonnet hace la evaluación completa una vez al día y escribe 2 recomendaciones por categoría. Cada métrica enviada dice qué evaluador la calificó.
- **Envío:** cada 10 prompts, una vez al día y al cerrar la sesión, solo desde correos `@ismomotors.com` y `@grupoislo.com` con sesión verificada, a `public.x100_masters_ingest` (Supabase `100x-staging`). La función valida esquema, dominio, tamaño y ritmo. Sin secretos en el mod: la llave publicable es pública por diseño.
- **En pantalla:** una línea sobre el prompt con la telaraña animada y el botón «Tu nivel». El panel muestra solo el título, las arañas y hasta 5 formas de subir por categoría; el detalle (qué se evaluó, buena práctica, ejemplo, siguiente nivel) aparece al pasar el cursor. `↗` o `/masters portal` abre el portal visual en el navegador (`~/.claude/tu-nivel-en-claude.html`, privado de cada persona).
- **Datos:** schema `x100_masters` (`envios`, `metricas`, `recomendaciones`, vista `ranking`). Migración en `deploy/sql/0001_x100_masters.sql`.
