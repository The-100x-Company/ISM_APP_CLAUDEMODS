# Diseño · Nivel real y rúbrica 2026 · x100-masters

Fecha: 2026-11-26 (hora de México). Mod: `x100-masters` («Tu Nivel en Claude by The 100x Co»).
Fuente del mod: `C:\Users\TomasMorenoPlese\.claude\dev-mods\175c2dee-4cab-4a32-a0db-24aa008f6253\x100-masters\hooks\`.

## 0. Cambios de id y de categoría

| Id | Categoría | Cambio |
|---|---|---|
| `descubrimiento` | estructura | Nuevo. Métrica de texto (Haiku, Sonnet). La rúbrica pasa de 37 a 38 métricas. |
| `planificacion` | herramienta | Id igual. Nombre nuevo: «Especificación». Significado ampliado: spec, plan o entrevista previa. |

Ningún id se eliminó. Ninguna métrica cambió de categoría.

Archivos escritos:

- `hooks\rubric.ts`: `descubrimiento`, `planificacion` renombrada, textos `about` de `contexto`, `skills`, `conectores` y `conduccion`, nivel 5 de `criterios` e `iteracion`, dos RULES nuevas. Exports y formas sin cambio.
- `hooks\guide.ts`: forma nueva `{ measure, how[4], examples[4] }` para las 38 métricas.
- Este documento.

No se tocó `score.ts`, `backfill.ts`, `visuals.ts` ni `register.tsx`.

## A. Nivel real y momento actual

### A.1 Problema

El perfil actual promedia los últimos 10 días activos. Un día de consultas básicas baja el promedio de una persona fuerte. El promedio no distingue «no sabe» de «hoy no lo necesitó».

### A.2 Fórmula elegida

Nombre técnico: media de los mejores días sustantivos, encogida por evidencia.

1. **Día sustantivo.** Un día cuenta solo si tiene `prompts >= 8` y `tokens >= 50,000`. Un día con menos es un día ligero. Un día ligero no suma ni resta.
2. **Nivel por día.** Cada día sustantivo se califica solo. Código: `codeValues` sobre ese único día. Texto: la lectura de ese día en `dayText` (Sonnet gana a Haiku). Una lectura `null` no es evidencia.
3. **Mejores días.** Por métrica, se ordenan los niveles de mayor a menor. Se promedian los primeros `k`.
   - Métricas de código: `k = max(3, ceil(0.5 × n))`.
   - Métricas de texto: `k = max(3, ceil(0.3 × n))`.
4. **Confianza por métrica.** `c = clamp((n − 2) / 4, 0, 1)`. `n` = días sustantivos con evidencia de esa métrica. Con 2 días o menos, `c = 0`. Con 6 días o más, `c = 1`.
5. **Nivel real.** `real = actual + c × max(0, mejores − actual)`. `actual` es el nivel de la telaraña «momento actual».
6. **Métricas de periodo.** `adopcion` y `variedad` se cuentan sobre los 30 días completos. Un día solo no dice nada de ellas.
7. **Confianza global.** Promedio de `c` sobre las 38 métricas. Va de 0 a 1.
8. **Crack.** `puntaje real >= 80` y `confianza >= 0.75`.

### A.3 Por qué esta fórmula

| Alternativa | Motivo del descarte |
|---|---|
| Máximo por métrica | Un solo día bueno hace un experto. Es fácil de manipular. |
| Máximo con decaimiento | La ventana ya es de 30 días. El decaimiento agrega un parámetro y casi no cambia el resultado. |
| Percentil alto (P90) | Con 6 a 20 días, el P90 es el máximo o el segundo mejor día. Mismo defecto. |
| Solo filtrar días ligeros | Quita la inactividad. No quita el día de consultas básicas con muchos prompts. |
| Promedio de los mejores `k` días, sin confianza | Con 3 días da un nivel alto sin evidencia. |

La fórmula elegida usa las cuatro ideas útiles: filtro de días ligeros, mejores `k` días, evidencia mínima y encogimiento hacia el nivel actual.

Por qué la mitad para código y tres de diez para texto: los contadores de eventos raros (`automatizacion`, `construccion`, `delegacion`) se inflan si se toma un solo día. Los cortes están calibrados para un promedio por día activo. La mitad de los días evita la inflación. La lectura de texto depende de la tarea del día y su ruido es hacia abajo; por eso su ventana es más angosta.

### A.4 Protección contra manipulación

- Un día excelente no mueve el nivel real: `c = 0` hasta 3 días con evidencia.
- La evidencia se cuenta en días distintos. Una ráfaga en un solo día vale un día.
- El umbral de día sustantivo es binario y bajo. Inflar tokens no da puntos.
- Se usa la media de los mejores días, nunca el máximo.
- El texto se califica por sustancia (RULES). Sonnet corrige a Haiku una vez al día.
- La telaraña real nunca queda dentro de la actual. La brecha entre ambas es visible.
- Brecha grande con confianza baja = promesa, no crack.

### A.5 Prueba con datos simulados (30 días)

| Caso | Momento | Real | Confianza | Crack |
|---|---|---|---|---|
| Fuerte y constante, 20 días | 85 Experto | 85 Experto | 1.00 | sí |
| Fuerte, con 10 días ligeros recientes | 76 Avanzado | 85 Experto | 1.00 | sí |
| Fuerte, con 10 días de consultas básicas recientes | 45 Competente | 85 Experto | 1.00 | sí |
| Básico, con 1 día excelente | 34 Básico | 39 Básico | 1.00 | no |
| Básico, con 2 días excelentes | 43 Competente | 53 Competente | 1.00 | no |
| Básico, con 3 días excelentes | 52 Competente | 67 Avanzado | 1.00 | no |
| Básico y constante | 25 Básico | 25 Básico | 1.00 | no |
| Solo días ligeros | 15 Inicial | 15 Inicial | 0.00 | no |

Prueba corrida con Node 24 sobre una copia de `score.ts` + el código de A.7. Chequeo estricto de TypeScript 5.6: sin errores en el código nuevo.

### A.6 Nombre y explicación para la persona

| Telaraña | Nombre | Una línea |
|---|---|---|
| 1 | Momento actual | Cómo usaste Claude en tus últimos 10 días de trabajo. |
| 2 | Nivel real | Lo que ya demostraste en tus mejores días del último mes. |

Texto con confianza menor a 0.5: «Aún faltan días de trabajo para confirmar tu nivel real.» En ese caso, dibujar la telaraña real con línea punteada.

### A.7 TypeScript para `score.ts`

Pegar al final de `score.ts`. Agregar `Potential` al import de `../types`. Usa `prune`, `codeValues`, `readingOf`, `mean`, `round1`, `toPercent`, `levelOf`, `CODE_METRICS`, `TEXT_METRICS`, `ALL_METRICS`, `CATEGORIES`, `WEIGHTS` y `TIERS`, que ya existen en el archivo.

```ts
// ── Nivel real ────────────────────────────────────────────────────────────────────────────────────────
// The level a person has shown on their good working days of the last 30, next to the «momento actual»
// (the plain average of the last 10 active days). Light days never count against it; one great day never makes it.
export const REAL = {
  minPrompts: 8, // a day with fewer prompts is a light day
  minTokens: 50_000, // …and so is one under the first «consumo» cut
  rampFrom: 2, // days of evidence that still prove nothing
  rampTo: 6, // days of evidence for full confidence
  topCode: 0.5, // counted metrics: the better half of the days
  topText: 0.3, // read metrics: the best three in ten days
  minTop: 3, // never fewer than three days in the top
  crackScore: 80,
  crackConfidence: 0.75,
} as const

// Counted over the whole period: one day alone says nothing about them.
const PERIOD_METRICS = new Set(['adopcion', 'variedad'])

export const isSubstantive = (day: Day | undefined): day is Day => day !== undefined && day.prompts >= REAL.minPrompts && day.tokens >= REAL.minTokens

// The Potential of types/index.d.ts (score, tier, categories, confidence) plus what the spider and the audit need.
export type PotentialLevels = Potential & {
  // Level 1-5 per metric, never under the current one; null when nothing was ever seen. Goes to MetricResult.potential.
  levels: Record<string, number | null>
  // Substantive days with evidence behind each metric.
  evidence: Record<string, number>
  // Substantive days in the window.
  days: number
  crack: boolean
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const sureOf = (days: number) => clamp01((days - REAL.rampFrom) / (REAL.rampTo - REAL.rampFrom))

// `current` is the level of each metric in the «momento actual» web (profile.metrics), so the real web never falls inside it.
export const potentialLevels = (usage: Usage, dayText: DayText, now: number, current: Record<string, number | null | undefined> = {}): PotentialLevels => {
  const kept = prune(usage, now)
  const keys = Object.keys(kept).filter(key => isSubstantive(kept[key])).sort()
  const period = codeValues(kept)
  // Each substantive day on its own: code from that day's counters alone, text from that day's readings.
  const perDay = keys.map(key => {
    const values = codeValues({ [key]: kept[key] as Day })
    const levels: Record<string, number | undefined> = {}
    for (const metric of CODE_METRICS) if (!PERIOD_METRICS.has(metric.id)) levels[metric.id] = levelOf(values[metric.id] ?? 0, metric.cuts)
    for (const metric of TEXT_METRICS) levels[metric.id] = readingOf(dayText[key]?.[metric.id])
    return levels
  })
  const levels: Record<string, number | null> = {}
  const evidence: Record<string, number> = {}
  const trust: number[] = []

  for (const metric of ALL_METRICS) {
    const shown = current[metric.id] ?? null
    if (PERIOD_METRICS.has(metric.id)) {
      const cuts = CODE_METRICS.find(item => item.id === metric.id)?.cuts ?? []
      const whole = Object.keys(kept).length === 0 ? null : levelOf(period[metric.id] ?? 0, cuts)
      levels[metric.id] = whole === null ? shown : round1(Math.max(whole, shown ?? 1))
      evidence[metric.id] = keys.length
      trust.push(sureOf(keys.length))
      continue
    }
    const seen = perDay
      .map(day => day[metric.id])
      .filter((level): level is number => level !== undefined)
      .sort((a, b) => b - a)
    const share = metric.evaluator === 'codigo' ? REAL.topCode : REAL.topText
    const top = mean(seen.slice(0, Math.max(REAL.minTop, Math.ceil(seen.length * share))))
    const base = shown ?? mean(seen)
    const sure = sureOf(seen.length)
    evidence[metric.id] = seen.length
    trust.push(sure)
    levels[metric.id] = base === null || top === null ? base : round1(base + sure * Math.max(0, top - base))
  }

  const inCategory = (category: Category) =>
    ALL_METRICS.filter(metric => metric.category === category)
      .map(metric => levels[metric.id])
      .filter((level): level is number => typeof level === 'number')
  const categories = Object.fromEntries(CATEGORIES.map(category => [category, toPercent(inCategory(category))])) as Record<Category, number | null>
  const scored = CATEGORIES.filter(category => categories[category] !== null)
  const weight = scored.reduce((total, category) => total + WEIGHTS[category], 0)
  const score = weight === 0 ? 0 : Math.round(scored.reduce((total, category) => total + WEIGHTS[category] * (categories[category] as number), 0) / weight)
  const confidence = Math.round((mean(trust) ?? 0) * 100) / 100

  return {
    levels,
    evidence,
    confidence,
    days: keys.length,
    categories,
    score,
    tier: TIERS[Math.min(4, Math.floor(score / 20))] ?? 'Inicial',
    crack: score >= REAL.crackScore && confidence >= REAL.crackConfidence,
  }
}
```

Integración en `buildProfile`, después de armar `metrics`:

```ts
const real = potentialLevels(kept, dayText, now, Object.fromEntries(metrics.map(metric => [metric.id, metric.level])))
for (const metric of metrics) metric.potential = real.levels[metric.id] ?? null
const potential: Potential | null = real.days === 0 ? null : { score: real.score, tier: real.tier, categories: real.categories, confidence: real.confidence }
```

Límites conocidos:

- `Day` no guarda el largo de los prompts. El filtro usa `prompts` y `tokens`. Mejora opcional: campo `chars?: number` en `Day`.
- El barrido inicial ve 15 días. La confianza llega a 1 con 6 días sustantivos; el barrido alcanza.
- `descubrimiento` no tiene historia. Queda en `null` hasta su primera lectura.
- Tras 3 semanas sin uso quedan menos de 3 días sustantivos. El nivel real cae al nivel actual. Solución futura: guardar el último nivel real con su fecha.

## B. Métrica nueva: `descubrimiento`

### B.1 Definición

La persona reconoce lo que no sabe y usa a Claude para descubrirlo: pide que le pregunte, que le explique o que le muestre lo que no vio.

Entrada en `TEXT_METRICS` (ya escrita en `rubric.ts`):

```ts
{ id: 'descubrimiento', category: 'estructura', name: 'Descubrimiento', about: 'Reconoce lo que no sabe y le pide a Claude preguntar, explicar o mostrar lo que falta antes de actuar', evaluator: 'haiku', levels: [
  'Ordena sin admitir dudas ni pedir preguntas',
  'Pide una explicación suelta sin decir qué no entiende',
  'Dice qué no entiende o no sabe y pide que se lo expliquen o le den opciones',
  'Pide que Claude le pregunte antes de actuar, o pros y contras para decidir algo que no domina',
  'Pide que lo entreviste hasta tener todo claro, pregunta qué le falta considerar y usa las respuestas para decidir',
] },
```

Regla nueva en RULES: exige una duda propia; «pregúntame» como muletilla vale 2; preguntar un dato no cuenta; pedir opciones sin admitir duda cuenta en `exploracion`.

### B.2 Criterios usados

| Criterio | Fuente | Uso en los niveles |
|---|---|---|
| Pedir a Claude que entreviste cuando la idea no está clara | Anthropic, Best practices for Claude Code, sección «Brainstorm with Claude first» | Nivel 5 |
| En modo Auto, Claude evita preguntas aclaratorias salvo que el prompt las pida | Anthropic, Permission modes | Justifica medir que la persona pida las preguntas |
| Conductas observables de fluidez: identificar contexto faltante, cuestionar el razonamiento | Anthropic, AI Fluency Index (2026-02-23), marco 4D | Nivel 5: «qué le falta considerar» |
| Ayuda instrumental (pide entender) contra ayuda ejecutiva (pide que se lo hagan) | Nelson-Le Gall 1981; Newman 2002 | Niveles 1 a 3: ordenar es ayuda ejecutiva; decir qué no entiende es ayuda instrumental |
| Búsqueda de ayuda adaptativa: reconocer la duda, decir qué falta, usar la respuesta | Newman 2002; Karabenick y Berger 2013 | Niveles 3 y 5 |
| Tipos de pregunta socrática: aclaración, supuestos, alternativas, consecuencias | Paul y Elder 2006 | Niveles 4 y 5 |
| Preguntas aclaratorias mejoran el resultado cuando la petición es ambigua | Aliannejadi y otros 2019 (SIGIR) | Nivel 4 |

Diferencia con `exploracion`: `exploracion` mide las preguntas abiertas de la persona sobre el problema. `descubrimiento` mide que la persona admita una duda y le pase las preguntas a Claude.

## C. Buenas prácticas vigentes en 2026

### C.1 Veredicto sobre plan mode

**No confirmado como retirado. Confirmado que ya no es la práctica central.**

- Plan mode sigue soportado y documentado. Fuente: `permission-modes`, sección «Analyze before you edit with plan mode»; `common-workflows`, sección «Plan before editing»; selector de modo de la app de escritorio con la opción «Plan».
- La página oficial de buenas prácticas ya no menciona plan mode. La sección antigua «Explore first, then plan, then code» no existe.
- La recomendación actual antes de construir tiene tres partes: «Write a specific prompt», «Brainstorm with Claude first» (entrevista → `SPEC.md` → sesión nueva) y «Give Claude a check to run» (prueba de pasa o falla, evidencia).
- Las sesiones nuevas de terminal y VS Code arrancan en modo Auto.

Decisión: `planificacion` conserva el id, se llama «Especificación» y cuenta spec, plan o entrevista previa. Plan mode es una de las señales, no la única.

### C.2 Detección de «Especificación» en transcripts (para `score.ts` y `backfill.ts`)

Hallazgo en los 40 transcripts locales más recientes: `EnterPlanMode` aparece 0 veces, `ExitPlanMode` 114 veces, `AskUserQuestion` 922 veces. La detección actual (`name === 'EnterPlanMode'`) cuenta cero. El plan mode elegido en la interfaz no emite `EnterPlanMode`.

Señales propuestas, una cuenta por evento:

- Herramienta `ExitPlanMode` (un plan presentado). Quitar `EnterPlanMode` o contar solo una de las dos.
- Herramienta `AskUserQuestion` (Claude entrevista). En modo Auto solo ocurre si el prompt lo pide.
- `Write` o `Edit` sobre un archivo de spec o plan: `/(^|[\\/])(spec|plan|especificaci[oó]n)[\w .-]*\.md$/i`.
- Línea de usuario con `"permissionMode":"plan"` (el campo existe en los transcripts locales).
- Comando `/plan` o `/goal` al inicio del prompt.
- Texto del prompt. Regex nueva para `PLAN`:

```ts
const PLAN = /\b(dame|arma|haz|escribe|prop[oó]n|pres[eé]ntame|prep[aá]rame)\s+(primero\s+)?(un|el|tu)\s+plan\b|\bantes de (hacer|ejecutar|construir|empezar|tocar|cambiar)\b|\bno (hagas|escribas|cambies|toques) nada\b|\bespera mi (ok|visto bueno|aprobaci[oó]n)\b|\bspec\b|\bespecificaci[oó]n\b|\bentrev[ií]stame\b|\bhazme (las |unas )?preguntas\b|\best[aá] (listo|terminado) cuando\b|^\s*\/(plan|goal)\b/i
```

Motivo: la regex actual marca `\bplan\b` y `fases?`. En una agencia de autos, «plan de financiamiento», «plan de piso» y «plan de pagos» son falsos positivos diarios.

### C.3 Otros ajustes aplicados o recomendados

| Métrica | Estado | Fuente |
|---|---|---|
| `contexto` | `about` actualizado: entregar el archivo con @ o adjunto. | Best practices, «Write a specific prompt» |
| `criterios` | Nivel 5: prueba de pasa o falla que Claude corre solo. | Best practices, «Give Claude a check to run» |
| `verificacion` | Sin cambio. Coincide con «ask Claude for evidence». | Best practices |
| `iteracion` | Nivel 5: tras dos correcciones fallidas, replantear. | Best practices, «Steer the session» |
| `conduccion` | `about` aclarado. Esc y botón de detener; corrección con Enter sin detener. | Best practices; Desktop |
| `skills` y `comandos` | Los comandos personalizados se fusionaron con skills. Sin cambio de id. | Skills |
| `conectores` | `about` usa «apps conectadas». Botón + junto al cuadro de mensaje. | Desktop |
| `delegacion` | Guía advierte: los subagentes cuestan más y no dan mejor respuesta por sí solos. | Best practices, «Know what subagents cost» |
| `consumo` | Sin cambio. Riesgo: premia gasto de tokens; la guía oficial pide bajar costo. Revisar con el dueño. | Best practices, «Keep cost and context down» |
| `loops` (sistema) | Sin cambio. «Sigue hasta terminar» ya no se recomienda; dar una prueba sí. El nivel 4 ya lo pide. | Best practices, «What you can stop doing» |
| RULES | Regla nueva: frases de relleno y MAYÚSCULAS no suman. | Best practices, «What you can stop doing» |

### C.4 Controles reales de la app de escritorio usados en `guide.ts`

Verificados en `code.claude.com/docs/en/desktop` y `desktop-scheduled-tasks` el 2026-11-26:

- Botón **+** junto al cuadro de mensaje: «Add files or photos», «Add connectors» o «Connectors», «Slash commands», «Add plugins».
- **@** + nombre de archivo. Arrastrar y soltar archivos.
- **/** para ver comandos y skills.
- **Esc** o botón de detener. Escribir una corrección y Enter redirige sin detener.
- **+ New** en la barra lateral, Ctrl+N en Windows.
- Selector de modo debajo del cuadro de mensaje: Manual, Accept edits, Plan, Auto, Bypass permissions.
- **Scheduled** (o **Routines**) en la barra lateral → **New task**; botón **Run now**. También se crea pidiéndolo en el chat.
- Barra lateral **Customize** > **Connectors**.

Sin verificar: los nombres de estos controles con la app en español. `guide.ts` usa el nombre en español con el nombre en inglés entre paréntesis en `conectores` y `automatizacion`. Revisar con una captura de la app de ISMO.

## D. `guide.ts`

Forma: `Record<string, { measure: string; how: string[]; examples: string[] }>`. Las 38 métricas tienen 1 `measure`, 4 `how` y 4 `examples`. Validado por script: ningún ejemplo pasa de 25 palabras; ningún `measure` usa niveles ni porcentajes. `visuals.ts` ya lee `measure`, `how` y `examples`.

## Fuentes

Oficiales de Anthropic, consultadas el 2026-11-26:

- Best practices for Claude Code — https://code.claude.com/docs/en/best-practices
- Permission modes — https://code.claude.com/docs/en/permission-modes
- Common workflows — https://code.claude.com/docs/en/common-workflows
- Use Claude Code Desktop — https://code.claude.com/docs/en/desktop
- Schedule recurring tasks in Claude Code Desktop — https://code.claude.com/docs/en/desktop-scheduled-tasks
- Skills — https://code.claude.com/docs/en/skills
- Prompting best practices — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- AI Fluency Index (publicado 2026-02-23) — https://www.anthropic.com/research/AI-fluency-index
- AI Fluency: Framework and Foundations (marco 4D) — https://www.anthropic.com/ai-fluency/overview

Bibliografía académica, citada de memoria y no consultada en línea en esta sesión `[?]`:

- Nelson-Le Gall, S. (1981). Help-seeking: An understudied problem-solving skill in children. *Developmental Review*, 1(3), 224–246.
- Newman, R. S. (2002). How self-regulated learners cope with academic difficulty: The role of adaptive help seeking. *Theory Into Practice*, 41(2), 132–138.
- Karabenick, S. A., y Berger, J.-L. (2013). Help seeking as a self-regulated learning strategy. En *Applications of Self-Regulated Learning across Diverse Disciplines*.
- Paul, R., y Elder, L. (2006). *The Thinker's Guide to the Art of Socratic Questioning*. Foundation for Critical Thinking.
- Aliannejadi, M., Zamani, H., Crestani, F., y Croft, W. B. (2019). Asking Clarifying Questions in Open-Domain Information-Seeking Conversations. SIGIR 2019. arXiv:1907.06554.

Evidencia local: conteo con `grep` sobre los 40 transcripts más recientes de `C:\Users\TomasMorenoPlese\.claude\projects\`, 2026-11-26.
