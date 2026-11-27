# Instrucciones para el agente: instalar «Tu Claude Score»

English: [0D_AGENTE_INSTALAR_X100_MASTERS_EN.md](0D_AGENTE_INSTALAR_X100_MASTERS_EN.md)

Estas instrucciones las sigue Claude Code cuando una persona pega el prompt corto de la guía [0C_INSTALAR_X100_MASTERS_OTRA_EMPRESA.md](0C_INSTALAR_X100_MASTERS_OTRA_EMPRESA.md). La persona da dos datos: **Modo** (A o B) y **Dominios**. Si falta uno, pregúntalo.

## Reglas

- No inventes datos. Espera el OK de la persona antes de cada cambio.
- Nunca muestres el correo de la persona.
- No envíes mensajes a nombre de la persona.

## Pasos

1. Lee `~/.claude.json` y muestra solo estos valores de `oauthAccount`: `organizationName`, `organizationUuid` y `organizationRole`.
2. Revisa el modo:
   - **A — solo mi computadora:** cualquier persona.
   - **B — todo mi equipo:** solo si `organizationRole` es `owner` o `primary_owner`. Si no, dile que lo debe hacer un owner y ofrécele el modo A.
3. Descarga https://raw.githubusercontent.com/The-100x-Company/ISM_APP_CLAUDEMODS/main/deploy/managed-settings.ism-mods.json y muestra su contenido.
4. **Modo A:** respalda `~/.claude/settings.json` (copia con fecha). Une en él las llaves `extraKnownMarketplaces` y `enabledPlugins` del archivo descargado, sin borrar nada de lo que ya hay. Muestra la diferencia y guarda solo con su OK.
5. **Modo B:** abre https://claude.ai/admin-settings/claude-code en el navegador y entra a Managed settings › Manage. Si ya hay contenido, une las llaves `extraKnownMarketplaces` y `enabledPlugins` con las del archivo, sin borrar nada. Muestra el JSON final y guarda con Update settings solo con su OK.
6. Dile que reinicie Claude Code o escriba `/reload-plugins`. Arriba del cuadro de texto verá «Mi Claude Score ↗». En el modo B, cada persona del equipo debe reiniciar.
7. Ranking del equipo: arma este mensaje para que la persona lo mande a su contacto de The 100x Company. No lo envíes tú. Si la empresa ya está dada de alta, sáltate este paso.

   «Alta Tu Claude Score · Empresa: <organizationName> · Organización: <organizationUuid> · Dominios: <Dominios>»

## Privacidad (dísela a la persona en una línea)

El mod nunca envía prompts ni correos. Envía puntajes, el nombre, un código (hash) del correo, el par de talento con sus puntajes y los tokens que gastó el propio mod. Las frases de la radiografía se quedan en la computadora de cada persona.
