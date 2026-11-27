# Instalar «Tu Claude Score» en otra empresa

English: [0C_INSTALAR_X100_MASTERS_OTRA_EMPRESA_EN.md](0C_INSTALAR_X100_MASTERS_OTRA_EMPRESA_EN.md)

Un solo mod sirve a todas las empresas. La base reconoce a cada empresa por su organización de Claude y sus dominios de correo. Cada empresa ve solo su ranking.

## Qué hace 100x (una vez por empresa)

- Recibe tres datos: nombre de la empresa, id de organización de Claude, dominios de correo.
- Da de alta la fila en `x100_masters.empresas` (un agente con el MCP de Supabase lo hace en 1 minuto):

```sql
insert into x100_masters.empresas (nombre, organizacion, dominios)
values ('<Nombre>', '<uuid de la organización>', array['<dominio1.com>', '<dominio2.com>']);
```

- Para agregar un dominio después: `update x100_masters.empresas set dominios = dominios || array['nuevo.com'] where nombre = '<Nombre>';`

## Dos formas de instalar

- **Solo en mi computadora:** cualquier persona. Une el JSON de `deploy/managed-settings.ism-mods.json` dentro de su `~/.claude/settings.json` (llaves `extraKnownMarketplaces` y `enabledPlugins`) y reinicia Claude Code.
- **En todo el equipo:** solo Owner o Primary owner de un plan Team o Enterprise. Pega el mismo JSON en claude.ai › Admin settings › Claude Code › Managed settings › Manage › Update settings, uniendo llaves si ya hay contenido. Cada persona reinicia Claude Code.
- En los dos casos el puntaje, los Spiderweb Charts y la radiografía funcionan desde el primer día. El ranking del equipo aparece cuando 100x da de alta la empresa.
- Owners y admins ven el Spiderweb y la campana del equipo después de su primer envío desde la 0.5.0, que es el que declara su rol. Ese envío llega al terminar el barrido del historial o al cerrar la sesión.

## Prompt para enviar (lo pega la persona en su Claude Code)

```text
Quiero instalar el mod «Tu Claude Score by The 100x Co» (x100-masters). Haz esto en orden, no inventes datos y espera mi OK antes de cada cambio:

1. Lee ~/.claude.json y dime solo estos valores de oauthAccount: organizationName, organizationUuid y organizationRole. No me muestres el correo.
2. Pregúntame cómo lo quiero instalar:
   A) Solo en mi computadora.
   B) En todos los Claude de mi equipo. Solo es posible si organizationRole es owner o primary_owner; si no lo es, dime que lo debe hacer un owner y ofréceme la opción A.
3. Descarga https://raw.githubusercontent.com/The-100x-Company/ISM_APP_CLAUDEMODS/main/deploy/managed-settings.ism-mods.json y muéstrame su contenido.
4. Si elegí A: respalda ~/.claude/settings.json (copia con fecha), une en él las llaves extraKnownMarketplaces y enabledPlugins del archivo descargado sin borrar nada de lo que ya hay, muéstrame la diferencia y guarda solo con mi OK.
5. Si elegí B: abre https://claude.ai/admin-settings/claude-code en el navegador, entra a Managed settings › Manage. Si ya hay contenido, une las llaves extraKnownMarketplaces y enabledPlugins con las del archivo, sin borrar nada. Muéstrame el JSON final y guarda con Update settings solo con mi OK.
6. Dime que reinicie Claude Code (o escriba /reload-plugins) y que verá «↗ Tu Claude Score» arriba del cuadro de texto. En la opción B, cada persona del equipo debe reiniciar.
7. Para el ranking del equipo: pregúntame los dominios de correo de la empresa (por ejemplo empresa.com, filial.com) y arma este mensaje para que yo lo mande a mi contacto de The 100x Company: «Alta Tu Claude Score · Empresa: <organizationName> · Organización: <organizationUuid> · Dominios: <dominios>». No lo envíes tú. Si mi empresa ya está dada de alta, sáltate este paso.

Privacidad: el mod nunca envía prompts ni correos. Envía puntajes, el nombre («Ana Pérez»), un código (hash) del correo, el nombre del par de talento con el puntaje de cada arquetipo y los tokens que el propio mod gastó. La evidencia de la radiografía (frases de los prompts) se queda en la computadora de cada persona.
```

## Qué protege la base

- Sin correos: la base guarda el hash sha256 del correo, el nombre y el dominio.
- El consumo de tokens del mod solo lo reciben owners y admins (columna oculta del ranking).
- Llave por instalación: el mod la pide en su primer envío. Sin llave no hay envío ni ranking. La base guarda solo el hash de la llave.
- Tablas cerradas: solo se entra por 3 funciones revisadas (`registro`, `ingest`, `equipo`), con límites de 30 envíos por 10 min, 120 lecturas por hora y 60 registros por hora por empresa.
- Una empresa nunca ve a otra.

## Límites conocidos

- Quien conoce un correo puede calcular su hash. El hash evita que alguien saque la lista de correos; no oculta si una persona concreta participa.
- La llave real de una empresa es su id de organización: quien lo tenga puede registrar una instalación falsa y leer nombres y puntajes de esa empresa.
- El rol (owner o admin) lo declara el mod. No hay forma de verificarlo contra Anthropic desde la base.
