# Publica un mod de ism-mods para todo ISMO. Windows PowerShell 5.1.
# Uso:  .\scripts\0A_PUBLICAR.ps1 -Mod x100-masters
# Antes: subir "version" en plugins\<mod>\.claude-plugin\plugin.json (cada update necesita version nueva).
param([Parameter(Mandatory = $true)][string]$Mod)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$repo = 'The-100x-Company/ISM_APP_CLAUDEMODS'

# 1. Zip determinista + JSON de Managed settings.
python -I scripts/build.py "https://github.com/$repo/releases/download" $Mod
$version = (Get-Content "plugins\$Mod\.claude-plugin\plugin.json" -Raw | ConvertFrom-Json).version
$tag = "$Mod-v$version"

# 2. Codigo a GitHub (la primera vez crea el repo publico).
git add -A
git commit -m "$Mod $version"
gh repo view $repo 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { gh repo create $repo --public --source . --remote origin --push } else { git push origin HEAD }

# 3. El zip como asset del release.
gh release create $tag "dist\$Mod-$version.zip" --repo $repo --title $tag --notes "$Mod $version"

# 4. JSON al portapapeles y panel de la organizacion abierto.
Get-Content 'deploy\managed-settings.ism-mods.json' -Raw | Set-Clipboard
Start-Process 'https://claude.ai/admin-settings/claude-code'
Write-Host "Listo: $tag publicado. El JSON esta en el portapapeles: pegalo en Managed settings y guarda."
