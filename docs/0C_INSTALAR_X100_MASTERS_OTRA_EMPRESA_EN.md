# Install «Tu Claude Score» in another company

Español: [0C_INSTALAR_X100_MASTERS_OTRA_EMPRESA.md](0C_INSTALAR_X100_MASTERS_OTRA_EMPRESA.md)

One mod serves every company. The database tells companies apart by their Claude organization and their email domains. Each company sees only its own ranking. The interface of the mod is in Spanish.

## What 100x does (once per company)

- Receives three facts: company name, Claude organization id, email domains.
- Adds the row to `x100_masters.empresas` (an agent with the Supabase MCP does it in 1 minute):

```sql
insert into x100_masters.empresas (nombre, organizacion, dominios)
values ('<Name>', '<organization uuid>', array['<domain1.com>', '<domain2.com>']);
```

- To add a domain later: `update x100_masters.empresas set dominios = dominios || array['new.com'] where nombre = '<Name>';`

## Two ways to install

- **Only on my computer:** anyone. Merge the JSON of `deploy/managed-settings.ism-mods.json` into `~/.claude/settings.json` (keys `extraKnownMarketplaces` and `enabledPlugins`) and restart Claude Code.
- **For the whole team:** only an Owner or Primary owner of a Team or Enterprise plan. Paste the same JSON in claude.ai › Admin settings › Claude Code › Managed settings › Manage › Update settings, merging keys if there is content already. Each person restarts Claude Code.
- In both cases the score, the Spiderweb Charts and the talent X-ray work from day one. The team ranking appears when 100x registers the company.
- Owners and admins see the team Spiderweb and bell curve after their first send from 0.5.0, which is the one that declares their role. That send arrives when the history sweep ends or when the session closes.

## Prompt to share (the person pastes it in Claude Code)

```text
I want to install the mod «Tu Claude Score by The 100x Co» (x100-masters). Do this in order, do not make up data, and wait for my OK before each change:

1. Read ~/.claude.json and tell me only these oauthAccount values: organizationName, organizationUuid and organizationRole. Do not show me the email.
2. Ask me how I want to install it:
   A) Only on my computer.
   B) On every Claude of my team. Only possible if organizationRole is owner or primary_owner; if not, tell me an owner must do it and offer option A.
3. Download https://raw.githubusercontent.com/The-100x-Company/ISM_APP_CLAUDEMODS/main/deploy/managed-settings.ism-mods.json and show me its content.
4. If I chose A: back up ~/.claude/settings.json (dated copy), merge into it the keys extraKnownMarketplaces and enabledPlugins of the downloaded file without deleting anything already there, show me the diff and save only with my OK.
5. If I chose B: open https://claude.ai/admin-settings/claude-code in the browser and go to Managed settings › Manage. If there is content already, merge the keys extraKnownMarketplaces and enabledPlugins with those of the file, without deleting anything. Show me the final JSON and save with Update settings only with my OK.
6. Tell me to restart Claude Code (or type /reload-plugins) and that I will see «↗ Tu Claude Score» above the text box. With option B, every person on the team must restart.
7. For the team ranking: ask me the email domains of the company (for example company.com, subsidiary.com) and draft this message for me to send to my contact at The 100x Company: «Alta Tu Claude Score · Company: <organizationName> · Organization: <organizationUuid> · Domains: <domains>». Do not send it yourself. If my company is already registered, skip this step.

Privacy: the mod never sends prompts or emails. It sends scores, the name («Ana Pérez»), a code (hash) of the email, the talent pair name with the score of each archetype, and the tokens the mod itself spent. The X-ray evidence (phrases from prompts) stays on each person's computer.
```

## What the database protects

- No emails: the database keeps the sha256 hash of the email, the name and the domain.
- Only owners and admins receive the mod's token consumption (hidden column of the ranking).
- One key per install: the mod asks for it on its first send. No key, no send and no ranking. The database keeps only the hash of the key.
- Closed tables: the only way in is 3 reviewed functions (`registro`, `ingest`, `equipo`), limited to 30 sends per 10 min, 120 reads per hour and 60 registrations per hour per company.
- A company never sees another.

## Known limits

- Whoever knows an email can compute its hash. The hash keeps anyone from pulling the email list; it does not hide whether a given person takes part.
- A company's real key is its organization id: whoever has it can register a fake install and read that company's names and scores.
- The mod declares the role (owner or admin). The database has no way to check it against Anthropic.
