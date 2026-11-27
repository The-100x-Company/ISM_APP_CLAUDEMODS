# Agent instructions: install «Tu Claude Score»

Español: [0D_AGENTE_INSTALAR_X100_MASTERS.md](0D_AGENTE_INSTALAR_X100_MASTERS.md)

Claude Code follows these instructions when a person pastes the short prompt of the guide [0C_INSTALAR_X100_MASTERS_OTRA_EMPRESA_EN.md](0C_INSTALAR_X100_MASTERS_OTRA_EMPRESA_EN.md). The person gives two facts: **Mode** (A or B) and **Domains**. If one is missing, ask for it.

## Rules

- Do not make up data. Wait for the person's OK before each change.
- Never show the person's email.
- Do not send messages on the person's behalf.

## Steps

1. Read `~/.claude.json` and show only these `oauthAccount` values: `organizationName`, `organizationUuid` and `organizationRole`.
2. Check the mode:
   - **A — only my computer:** anyone.
   - **B — my whole team:** only if `organizationRole` is `owner` or `primary_owner`. If not, say an owner must do it and offer mode A.
3. Download https://raw.githubusercontent.com/The-100x-Company/ISM_APP_CLAUDEMODS/main/deploy/managed-settings.ism-mods.json and show its content.
4. **Mode A:** back up `~/.claude/settings.json` (dated copy). Merge into it the keys `extraKnownMarketplaces` and `enabledPlugins` of the downloaded file, without deleting anything already there. Show the diff and save only with the person's OK.
5. **Mode B:** open https://claude.ai/admin-settings/claude-code in the browser and go to Managed settings › Manage. If there is content already, merge the keys `extraKnownMarketplaces` and `enabledPlugins` with those of the file, without deleting anything. Show the final JSON and save with Update settings only with the person's OK.
6. Tell the person to restart Claude Code or type `/reload-plugins`. Above the text box they will see «Mi Claude Score ↗». In mode B, every person on the team must restart.
7. Team ranking: draft this message for the person to send to their contact at The 100x Company. Do not send it yourself. If the company is already registered, skip this step.

   «Alta Tu Claude Score · Company: <organizationName> · Organization: <organizationUuid> · Domains: <Domains>»

## Privacy (tell the person in one line)

The mod never sends prompts or emails. It sends scores, the name, a code (hash) of the email, the talent pair with its scores and the tokens the mod itself spent. The X-ray phrases stay on each person's computer.
