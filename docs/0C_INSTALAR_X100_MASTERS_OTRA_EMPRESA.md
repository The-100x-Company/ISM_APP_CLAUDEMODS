# Instalar «Tu Claude Score» en otra empresa

Un solo mod sirve a todas las empresas. La base reconoce a cada empresa por su organización de Claude y sus dominios de correo. Cada empresa ve solo su ranking.

## Qué hace 100x (una vez por empresa)

- Recibe tres datos: nombre de la empresa, id de organización de Claude, dominios de correo.
- Da de alta la fila en `x100_masters.empresas` (un agente con el MCP de Supabase lo hace en 1 minuto):

```sql
insert into x100_masters.empresas (nombre, organizacion, dominios)
values ('<Nombre>', '<uuid de la organización>', array['<dominio1.com>', '<dominio2.com>']);
```

- Para agregar un dominio después: `update x100_masters.empresas set dominios = dominios || array['nuevo.com'] where nombre = '<Nombre>';`

## Qué hace el owner o admin de la otra empresa

- Requisito: plan Team o Enterprise de Claude y rol Owner o Primary owner.
- Pega el JSON de `deploy/managed-settings.ism-mods.json` en claude.ai › Admin settings › Claude Code › Managed settings › Manage › Update settings.
- Si ya tiene managed settings, une las llaves `extraKnownMarketplaces` y `enabledPlugins`; no las reemplaza.
- Cada persona reinicia Claude Code. El mod aparece arriba del prompt: «↗ Tu Claude Score».

## Prompt para enviar (lo pega el admin en su Claude Code)

```text
Instala en mi organización el mod «Tu Claude Score by The 100x Co» (x100-masters). Haz esto en orden y no inventes datos:

1. Lee ~/.claude.json y dime solo estos tres valores de oauthAccount: organizationUuid, organizationName y organizationRole. Si organizationRole no es owner ni primary_owner, detente y dime que lo debe correr un owner.
2. Pregúntame los dominios de correo de mi empresa (por ejemplo empresa.com, filial.com). Arma este mensaje para que yo se lo mande a tu contacto de The 100x Company: «Alta Tu Claude Score · Empresa: <organizationName> · Organización: <organizationUuid> · Dominios: <dominios>». No lo envíes tú.
3. Espera a que yo te confirme que 100x dio de alta la empresa.
4. Descarga https://raw.githubusercontent.com/The-100x-Company/ISM_APP_CLAUDEMODS/main/deploy/managed-settings.ism-mods.json y muéstrame su contenido.
5. Abre https://claude.ai/admin-settings/claude-code en el navegador, entra a Managed settings › Manage. Si ya hay contenido, une las llaves extraKnownMarketplaces y enabledPlugins con las del archivo, sin borrar nada. Muéstrame el JSON final y espera mi OK antes de guardar con Update settings.
6. Dime que cada persona debe reiniciar Claude Code y que verá «↗ Tu Claude Score» arriba del cuadro de texto.

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
- La llave real de una empresa es su id de organización: quien lo tenga puede registrar una instalación falsa y leer nombres cortos y puntajes de esa empresa.
- El rol (owner o admin) lo declara el mod. No hay forma de verificarlo contra Anthropic desde la base.
