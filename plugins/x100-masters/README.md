# x100-masters · Tu Nivel en Claude by The 100x Co

Mide qué tan bien usa Claude cada persona y envía los puntajes, nunca los prompts.

- **37 métricas, niveles 1 a 5**, en cuatro categorías: uso de la herramienta (30 %), estructuración y elaboración (30 %), sistematización y recursividad (20 %), enfoque en valor de negocio (20 %).
- **Evaluadores:** el código cuenta el uso en cada prompt y herramienta; Haiku lee cada ventana de 10 prompts; Sonnet hace la evaluación completa una vez al día y escribe 2 recomendaciones por categoría. Cada métrica enviada dice qué evaluador la calificó.
- **Envío:** cada 10 prompts, una vez al día y al cerrar la sesión, solo desde correos `@ismomotors.com` y `@grupoislo.com` con sesión verificada, a `public.x100_masters_ingest` (Supabase `100x-staging`). La función valida esquema, dominio, tamaño y ritmo. Sin secretos en el mod: la llave publicable es pública por diseño.
- **En pantalla:** una telaraña animada sobre el prompt y `/masters` abren el panel con las arañas y las recomendaciones. «Abrir reporte completo» (o `/masters reporte`) escribe `~/.claude/tu-nivel-en-claude.html` y lo abre en el navegador.
- **Datos:** schema `x100_masters` (`envios`, `metricas`, `recomendaciones`, vista `ranking`). Migración en `deploy/sql/0001_x100_masters.sql`.
