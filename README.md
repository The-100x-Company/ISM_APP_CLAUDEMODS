# ISM_APP_CLAUDEMODS

Mods de Claude Code para ISMO Motors. Los mantiene The 100x Company.

Un mod es un plugin con un modulo de hooks (`hooks/hooks.json` → `modules`) que corre dentro de
Claude Code: terminal y pestaña **Code** del app de escritorio. **No toca la pestaña Chat, Cowork
ni claude.ai.**

| Mod | Que hace |
|---|---|
| `x100-org-badge` | Muestra `ISMO` en la banda sobre el prompt (`AbovePrompt`) y entre las etiquetas de modo (`SessionMode`) |
| `x100-solo-resultado` | Respuestas en cuatro partes (PASOS EJECUTADOS, RESULTADOS, ALERTAS, TUS PRÓXIMAS ACCIONES) y el hilo sin pasos. No toca `claude -p` ni el SDK. `/solo-resultado` lo apaga por sesión |

## Limite conocido

La barra superior del app (toggle Chat/Code, menu, ventana) es del app de escritorio, no de Claude
Code. Ningun mod puede dibujar ahi: los sitios de render son `AbovePrompt`, `SessionMode`,
`PromptHint`, `Pane` y las filas del transcript.

## Desarrollo

Usar el CLI que trae el app (el `claude` de terminal debe ser 2.1.286 o mas):

```powershell
& "$env:APPDATA\Claude\claude-code\<version>\<hash>\claude.exe" plugin validate .
& "$env:APPDATA\Claude\claude-code\<version>\<hash>\claude.exe" plugin test plugins/x100-org-badge
```

## Instalacion para una persona (sus equipos)

```powershell
$cli = Get-ChildItem "$env:APPDATA\Claude\claude-code" -Recurse -Filter claude.exe | Sort-Object LastWriteTime | Select-Object -Last 1
& $cli.FullName plugin marketplace add C:\100x\01_APPS\ISM_APP_CLAUDEMODS
& $cli.FullName plugin install x100-solo-resultado@ism-mods
```

Carga en las sesiones nuevas, o con `/reload-plugins` en una abierta.

## Despliegue a toda la organizacion (sin GitHub ni git en los equipos)

1. Subir la version en `plugins/<mod>/.claude-plugin/plugin.json`.
2. `python -I scripts/build.py https://github.com/The-100x-Company/ISM_APP_CLAUDEMODS/releases/download <mod>...`
   genera `dist/<mod>-<version>.zip` (determinista) y **un solo** `deploy/managed-settings.ism-mods.json` con
   todos los mods nombrados. `deploy/managed-settings.x100-org-badge.json` es del build anterior: no usarlo.
3. Publicar el zip como asset del release `<mod>-v<version>`.
4. Un Owner de la organizacion de claude.ai pega el JSON en
   **Organization settings > Claude Code > Managed settings**, **fusionado** con lo que ya haya ahi.
   Por defecto gana una sola fuente administrada: una clave servida desde claude.ai anula las del
   archivo o MDM del equipo.
5. Cada usuario lo recibe al iniciar su siguiente sesion. `enabledPlugins: true` administrado no se
   puede desactivar desde el equipo.

El marketplace va en linea dentro del JSON (`"source": "settings"`) y el mod es un `archive`
HTTPS, asi que los equipos no necesitan cuenta de GitHub ni git.

## Huecos

- `claude --safe-mode` apaga todos los mods.
- Un mod descargado (archive, GitHub) cuenta como "de usuario": no corre en `prependPlugins` y
  `allowManagedModsOnly` lo bloquea. Para que cuente como mod de la organizacion, el marketplace
  tiene que ser un directorio local copiado por Intune/MDM (`"source": "directory"`).

Docs: https://code.claude.com/docs/en/plugins/mods/admin · https://code.claude.com/docs/en/plugins/org
