// The rubric of «Tu Nivel en Claude» (The 100x Co): 41 metrics in four categories, each scored 1 (Inicial) to 5 (Experto).
// Code scores what can be counted; Haiku reads each 10-prompt window; Sonnet calibrates once a day.
import type { Category, Evaluator } from '../types'

export type Metric = { id: string; category: Category; name: string; about: string; evaluator: Evaluator; levels?: readonly [string, string, string, string, string] }
// A fused metric: its level is the mean of its own cut and a second value's cut (Jornada = hours and sessions).
export type Also = { key: string; cuts: readonly [number, number, number, number] }

export const WEIGHTS: Record<Category, number> = { herramienta: 0.3, estructura: 0.3, sistema: 0.2, valor: 0.2 }

export const CATEGORIES: readonly Category[] = ['herramienta', 'estructura', 'sistema', 'valor']

export const CATEGORY_NAMES: Record<Category, string> = {
  herramienta: 'Uso de la herramienta',
  estructura: 'Estructuración y elaboración',
  sistema: 'Sistematización y recursividad',
  valor: 'Enfoque en valor de negocio',
}

export const CATEGORY_ABOUT: Record<Category, string> = {
  herramienta: 'Cuánto y qué tan a fondo usa Claude: frecuencia, jornada, profundidad, variedad, skills, conectores, escritorio, móvil, artefactos y nube.',
  estructura: 'Qué tan bien plantea y conduce el trabajo: especificación, objetivo, contexto, criterios, casos borde, preguntas, verificación y conducción.',
  sistema: 'Si convierte lo que hace en sistema: memoria, SOPs, comandos, loops, automatizaciones y agentes.',
  valor: 'Si trabaja sobre el valor de la compañía: conoce sus KPIs, mide, analiza retorno y prioriza por impacto.',
}

export const TIERS = ['Inicial', 'Básico', 'Competente', 'Avanzado', 'Experto'] as const

type Cuts = readonly [number, number, number, number]

// Code metrics: the value is computed over the last 30 days and cut by the four thresholds into a level.
export const CODE_METRICS: readonly (Metric & { cuts: Cuts; unit: string; also?: Also })[] = [
  { id: 'adopcion', category: 'herramienta', name: 'Adopción', about: 'Días con uso real en los últimos 30', evaluator: 'codigo', unit: 'días', cuts: [3, 8, 15, 22] },
  { id: 'frecuencia', category: 'herramienta', name: 'Frecuencia', about: 'Parte de los prompts que llegan a menos de 10 min del anterior', evaluator: 'codigo', unit: 'proporción', cuts: [0.1, 0.3, 0.5, 0.7] },
  // 0.5.0: «Sesiones por día» fused into Jornada: hours with Claude and the sessions opened in them.
  { id: 'jornada', category: 'herramienta', name: 'Jornada', about: 'Horas por día con Claude en uso y sesiones que abres en ese tiempo', evaluator: 'codigo', unit: 'h/día', cuts: [0.5, 1, 3, 6], also: { key: 'sesiones', cuts: [1.5, 3, 5, 8] } },
  { id: 'profundidad', category: 'herramienta', name: 'Profundidad', about: 'Prompts por sesión', evaluator: 'codigo', unit: 'prompts/sesión', cuts: [3, 6, 16, 41] },
  { id: 'consumo', category: 'herramienta', name: 'Consumo', about: 'Tokens nuevos por día activo (sin lecturas de caché)', evaluator: 'codigo', unit: 'tokens/día', cuts: [50_000, 250_000, 1_000_000, 5_000_000] },
  { id: 'variedad', category: 'herramienta', name: 'Variedad', about: 'Herramientas distintas que Claude usa por ti', evaluator: 'codigo', unit: 'herramientas', cuts: [3, 6, 10, 15] },
  { id: 'contexto', category: 'estructura', name: 'Referencias', about: 'Prompts que entregan el archivo o la ruta exacta (con @ o adjunto) en vez de describirlo', evaluator: 'codigo', unit: 'proporción', cuts: [0.02, 0.1, 0.25, 0.5] },
  // Same id as before; since 2026 the official guidance is spec first (interview → written spec → check), with plan mode as one way to do it.
  { id: 'planificacion', category: 'estructura', name: 'Especificación', about: 'Veces que acuerda qué se va a hacer antes de construir (spec, plan o entrevista previa), por cada 100 prompts', evaluator: 'codigo', unit: 'por 100', cuts: [0.5, 1, 3, 8] },
  { id: 'skills', category: 'herramienta', name: 'Skills', about: 'Skills (recetas guardadas) usadas por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.1, 0.5, 2, 5] },
  { id: 'conectores', category: 'herramienta', name: 'Conectores', about: 'Llamadas a apps conectadas (conectores MCP) por día activo', evaluator: 'codigo', unit: 'por día', cuts: [1, 2, 10, 50] },
  { id: 'conduccion', category: 'estructura', name: 'Conducción', about: 'Veces que detiene a Claude para corregir el rumbo, por cada 100 prompts', evaluator: 'codigo', unit: 'por 100', cuts: [0.5, 1, 3, 8] },
  { id: 'escritorio', category: 'herramienta', name: 'Escritorio', about: 'Parte del trabajo hecho en la app de escritorio', evaluator: 'codigo', unit: 'proporción', cuts: [0.25, 0.5, 0.75, 0.95] },
  { id: 'movil', category: 'herramienta', name: 'Móvil', about: 'Días en que manejas tus sesiones desde el teléfono o la web (Remote Control)', evaluator: 'codigo', unit: 'proporción de días', cuts: [0.05, 0.15, 0.3, 0.5] },
  { id: 'artefactos', category: 'herramienta', name: 'Artefactos', about: 'Páginas, tableros y apps que publicas o fijas como artefactos, por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.05, 0.2, 0.5, 2] },
  { id: 'nube', category: 'herramienta', name: 'Nube', about: 'Trabajo que mandas a correr en la nube: sesiones cloud, rutinas y disparadores remotos, por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.05, 0.2, 0.5, 2] },
  { id: 'delegacion', category: 'sistema', name: 'Delegación', about: 'Subagentes y workflows lanzados por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.1, 0.5, 2, 8] },
  { id: 'automatizacion', category: 'sistema', name: 'Automatización', about: 'Loops, tareas programadas, monitores y disparadores por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.05, 0.2, 0.5, 2] },
  { id: 'comandos', category: 'sistema', name: 'Comandos', about: 'Parte de los prompts que arrancan un comando o skill guardado (/algo)', evaluator: 'codigo', unit: 'proporción', cuts: [0.01, 0.03, 0.08, 0.15] },
  { id: 'construccion', category: 'sistema', name: 'Sistematiza', about: 'Ediciones a skills, reglas, CLAUDE.md, hooks o mods por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.05, 0.2, 1, 3] },
  { id: 'memoria', category: 'sistema', name: 'Memoria', about: 'Veces que guardas algo en la memoria de Claude (archivos de memoria, MEMORY.md, CLAUDE.md) por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.05, 0.2, 0.5, 1.5] },
]

// Text metrics: Haiku scores each 10-prompt window against these anchors; Sonnet recalibrates daily.
export const TEXT_METRICS: readonly (Metric & { levels: readonly [string, string, string, string, string] })[] = [
  { id: 'objetivo', category: 'estructura', name: 'Objetivo', about: 'Dice qué quiere lograr y para qué', evaluator: 'haiku', levels: ['Orden suelta sin fin', 'Tarea sin propósito', 'Tarea con propósito', 'Propósito y resultado esperado', 'Propósito, resultado y quién lo usa'] },
  { id: 'contexto_negocio', category: 'estructura', name: 'Contexto', about: 'Da el contexto que Claude no puede adivinar', evaluator: 'haiku', levels: ['Ninguno', 'Una pista', 'Contexto básico', 'Contexto, restricciones y fuentes', 'Todo lo anterior y lo que ya se intentó'] },
  { id: 'criterios', category: 'estructura', name: 'Criterios', about: 'Define cómo se ve un trabajo terminado', evaluator: 'haiku', levels: ['Ninguno', 'Vago («que quede bien»)', 'Uno verificable', 'Varios verificables', 'Da una prueba de pasa o falla que Claude puede correr solo'] },
  { id: 'edge_cases', category: 'estructura', name: 'Excepciones', about: 'Anticipa excepciones y datos raros', evaluator: 'haiku', levels: ['Nunca', 'Reacciona cuando fallan', 'Menciona alguno', 'Los enumera antes', 'Los pide probar uno por uno'] },
  { id: 'exploracion', category: 'estructura', name: 'Exploración', about: 'Hace preguntas abiertas antes de decidir', evaluator: 'haiku', levels: ['Solo órdenes', 'Preguntas cerradas', 'Alguna pregunta abierta', 'Explora opciones antes de decidir', 'Contrasta alternativas y supuestos'] },
  { id: 'descubrimiento', category: 'estructura', name: 'Descubrimiento', about: 'Reconoce lo que no sabe y le pide a Claude preguntar, explicar o mostrar lo que falta antes de actuar', evaluator: 'haiku', levels: ['Ordena sin admitir dudas ni pedir preguntas', 'Pide una explicación suelta sin decir qué no entiende', 'Dice qué no entiende o no sabe y pide que se lo expliquen o le den opciones', 'Pide que Claude le pregunte antes de actuar, o pros y contras para decidir algo que no domina', 'Pide que lo entreviste hasta tener todo claro, pregunta qué le falta considerar y usa las respuestas para decidir'] },
  { id: 'verificacion', category: 'estructura', name: 'Verificación', about: 'Pide evidencia, no la palabra de Claude', evaluator: 'haiku', levels: ['Acepta todo', 'Pregunta si quedó', 'Pide revisar', 'Pide evidencia (salida, captura, cifra)', 'Exige prueba reproducible y la revisa'] },
  { id: 'iteracion', category: 'estructura', name: 'Iteración', about: 'Cuestiona la respuesta y la mejora', evaluator: 'haiku', levels: ['Acepta la primera', 'Repite la misma orden', 'Corrige un detalle', 'Señala el error y por qué', 'Tras dos correcciones fallidas, replantea el problema con lo aprendido'] },
  { id: 'descomposicion', category: 'estructura', name: 'Descomposición', about: 'Parte un problema grande en pasos', evaluator: 'haiku', levels: ['Todo en una orden', 'Pasos implícitos', 'Algunos pasos', 'Pasos ordenados', 'Fases con entregables y dependencias'] },
  { id: 'precision', category: 'estructura', name: 'Precisión', about: 'Nombra el archivo, el dato o el síntoma exacto', evaluator: 'haiku', levels: ['Ambiguo', 'General', 'Concreto en parte', 'Concreto', 'Exacto: dónde, qué y cuánto'] },
  { id: 'documentacion', category: 'sistema', name: 'Documentación', about: 'Deja registro reutilizable: handover, reglas, skills', evaluator: 'haiku', levels: ['Nunca', 'Rara vez', 'A veces pide resumen', 'Pide dejar registro', 'Convierte lo aprendido en reglas o skills'] },
  { id: 'sops', category: 'sistema', name: 'SOPs', about: 'Repite procesos con un procedimiento estándar, no improvisa cada vez', evaluator: 'haiku', levels: ['Improvisa cada vez', 'Copia un prompt viejo', 'Usa una plantilla propia', 'Sigue un SOP o skill con pasos fijos', 'Mantiene y versiona sus SOPs como skills o comandos'] },
  { id: 'loops', category: 'sistema', name: 'Loops', about: 'Diseña ciclos de hacer, verificar y corregir hasta cumplir un criterio', evaluator: 'haiku', levels: ['Un intento y ya', 'Repite a mano cuando falla', 'Pide revisar y corregir una vez', 'Pide iterar hasta pasar una prueba', 'Programa loops con criterio de salida, monitores o tareas recurrentes'] },
  { id: 'recursividad', category: 'sistema', name: 'Recursividad', about: 'Usa a Claude para mejorar su propio trabajo con Claude: prompts que generan prompts, agentes que revisan agentes', evaluator: 'haiku', levels: ['Nunca', 'Pide mejorar un prompt', 'Pide a Claude que critique su respuesta', 'Usa un agente revisor o un evaluador', 'Cadenas de agentes que se generan, revisan y mejoran entre sí'] },
  { id: 'generalizacion', category: 'sistema', name: 'Generalización', about: 'Convierte un caso en regla reutilizable para otros casos, áreas o clientes', evaluator: 'haiku', levels: ['Resuelve solo el caso', 'Nota que se repite', 'Reusa la solución en otro caso', 'Pide la versión general', 'Diseña la solución agnóstica desde el inicio'] },
  { id: 'kpis', category: 'valor', name: 'KPIs', about: 'Nombra los indicadores que mueven su área', evaluator: 'haiku', levels: ['No menciona ninguno', 'Habla de «que mejore»', 'Nombra un indicador', 'Nombra los indicadores de su área y su estado', 'Conecta sus indicadores con los de la empresa'] },
  { id: 'metrica_exito', category: 'valor', name: 'Meta', about: 'Define qué indicador debe moverse con el trabajo', evaluator: 'haiku', levels: ['Ninguna', 'Intuición', 'Un indicador sin meta', 'Indicador con meta', 'Indicador, meta y plazo'] },
  { id: 'linea_base', category: 'valor', name: 'Base', about: 'Sabe cómo está hoy antes de cambiar algo', evaluator: 'haiku', levels: ['Ninguna', 'Impresión', 'Dato aproximado', 'Dato medido', 'Dato medido con fuente'] },
  { id: 'roi', category: 'valor', name: 'Retorno', about: 'Compara esfuerzo contra beneficio en la unidad que aplique: horas, conversión, errores, tiempo de ciclo o dinero', evaluator: 'haiku', levels: ['Nunca', 'Dice que «vale la pena»', 'Piensa en el beneficio o en el esfuerzo', 'Compara esfuerzo y beneficio', 'Compara opciones por retorno con supuestos explícitos'] },
  { id: 'prioridad', category: 'valor', name: 'Prioridad', about: 'Elige qué hacer primero por impacto en el negocio', evaluator: 'haiku', levels: ['Lo que llega', 'Lo urgente', 'Algo de criterio', 'Ordena por impacto', 'Ordena por impacto y esfuerzo y descarta'] },
  { id: 'cierre', category: 'valor', name: 'Cierre', about: 'Vuelve a medir el resultado real', evaluator: 'haiku', levels: ['Nunca', 'Supone que funcionó', 'Lo revisa a ojo', 'Mide el resultado', 'Mide, compara con la línea base y ajusta'] },
]

export const ALL_METRICS: readonly Metric[] = [...CODE_METRICS, ...TEXT_METRICS]

// A value cut by four ascending thresholds: under the first is 1, at or past the last is 5.
export const levelOf = (value: number, cuts: readonly number[]) => 1 + cuts.filter(cut => value >= cut).length

// A code metric's level from the raw values; a fused metric averages its two cuts.
export const codeLevel = (metric: (typeof CODE_METRICS)[number], values: Record<string, number>) => {
  const own = levelOf(values[metric.id] ?? 0, metric.cuts)
  return metric.also === undefined ? own : (own + levelOf(values[metric.also.key] ?? 0, metric.also.cuts)) / 2
}

// The talent labels (Fable, docs/0B): per prompt, hygiene / delegation / co-creation and up to two archetypes.
export const TALENT_RULES = `TALENTO. Etiqueta cada prompt. Son consecutivos y de una sola persona.
t (tipo):
"h" higiene: corregir ortografía, traducir, resumir, dar formato, «sí», «continúa».
"d" delegación: encarga un resultado sin criterio propio. Ejemplo: «hazme esta tabla».
"c" co-creación: el texto muestra criterio propio. Basta una señal: corrige o cuestiona un resultado; aporta datos o restricciones propias; explica su razonamiento; elige una opción y dice por qué; pide que la reten. Si dudas entre "d" y "c", usa "d".
a (arquetipos): máximo 2 ids, el dominante primero. Vacío si t es "h" o nada encaja.
builder: quiere algo que funcione solo: herramienta, plantilla, automatización.
data: razona con cifras: cruza, mide, modela.
investigator: busca el porqué de un tema externo; contrasta fuentes y causas.
governance: ataca un trabajo ya hecho: fallos, riesgos, sesgos.
architect: vuelve el desorden estructura repetible: pasos, reglas, estándar.
planner: ordena en el tiempo: prioridades, hitos, recursos, fechas.
strategist: decide el rumbo: opciones y consecuencias a largo plazo.
catalyst: quiere que otra persona actúe o acepte: argumentos, negociación.
creative: busca novedad: ideas, metáforas, historias.
connector: quiere que otra persona entienda o se sienta atendida: tono, audiencia, mediación.
learner: quiere entender, no el entregable: pide que le enseñen o que cuestionen lo que cree.
Reglas:
- Etiqueta lo que la persona hace, no sus palabras. Una palabra clave sola («estrategia») no cuenta.
- Fechas = planner; proceso = architect. Entender un tema = investigator; aprender o revisar lo que cree = learner. Números = data; riesgo = governance. Convencer = catalyst; aclarar = connector.
- Código pedido sin prueba ni ajuste es "d".
Por prompt: {"t":"h"|"d"|"c","a":["id","id"],"e":"<solo si t es c: qué hizo, 12 palabras máximo, sin nombres, cifras ni datos de clientes>"}`

const anchors = (metric: (typeof TEXT_METRICS)[number]) => metric.levels.map((text, at) => `${at + 1}=${text}`).join('; ')

const RULES = [
  'Califica la sustancia, no palabras clave: decir «ROI», «KPI», «criterios» o «loop» sin un indicador, una condición o un ejemplo concreto vale 1 o 2.',
  'Valor no exige dinero: un indicador operativo (tiempo de respuesta, conversión, errores, entregas a tiempo, satisfacción) cuenta igual que pesos.',
  'Sistematización premia convertir el trabajo en sistema: comandos, skills, SOPs, loops con criterio de salida, tareas programadas, agentes que revisan a otros agentes.',
  'Un prompt corto y exacto puede valer más que uno largo y vago. El idioma coloquial no resta.',
  'No suman las frases de relleno ni el énfasis: «piensa bien», «sé exhaustivo», «no te detengas», MAYÚSCULAS o «IMPORTANTE». Cuenta la información, el criterio o la prueba que la persona entrega.',
  'Descubrimiento exige que la persona reconozca una duda propia y use a Claude para resolverla: que le pregunte, le explique o le muestre lo que no vio. Pedir opciones sin admitir duda cuenta en exploracion, no aquí. «Pregúntame» como muletilla repetida, sin contestar ni usar las preguntas, vale 2. Preguntar un dato («¿cuánto es?») no es descubrimiento.',
]

// The stable prefix of every Haiku call: rubric and rules first, so the prompt cache holds it.
export const HAIKU_SYSTEM = [
  'Eres un evaluador estricto de cómo una persona usa Claude en su trabajo. Recibes una ventana de sus prompts.',
  'Califica cada métrica de 1 a 5 según su anclaje. Si la ventana no da evidencia para una métrica, usa null.',
  ...RULES,
  'Responde SOLO un JSON: {"niveles":{"<id>":1-5|null,...},"consejos":{"herramienta":"<una frase>","estructura":"<una frase>","sistema":"<una frase>","valor":"<una frase>"},"talento":[<una etiqueta por prompt, en orden>]}',
  '',
  'Métricas:',
  ...TEXT_METRICS.map(metric => `- ${metric.id} [${metric.category}] (${metric.name}): ${metric.about}. Niveles: ${anchors(metric)}`),
  '',
  TALENT_RULES,
].join('\n')

export const SONNET_SYSTEM = [
  'Eres el evaluador senior de «Tu Nivel en Claude» (The 100x Co). Una vez al día haces la evaluación completa de una persona.',
  'Recibes sus niveles actuales (código y Haiku), sus cifras de uso y extractos de sus prompts recientes.',
  'Recalibra solo las métricas de texto: confirma o corrige cada nivel con base en la evidencia. No toques las de código.',
  ...RULES,
  'Escribe 3 recomendaciones por categoría (herramienta, estructura, sistema, valor): una frase cada una, concretas, accionables mañana, con un ejemplo de prompt mejor.',
  'Cada recomendación pertenece a la categoría donde la archivas: herramienta = funciones del producto (skills, conectores o MCP, artefactos, tareas programadas, escritorio, móvil, nube, funciones de memoria); estructura = cómo pedir (objetivo, contexto, criterios, definición de terminado, casos borde, verificación); sistema = memoria, automatización, comandos, SOPs, loops y reutilización; valor = KPIs, línea base, retorno, prioridad y cierre del ciclo. Nunca pongas un consejo de una categoría en otra.',
  'Prioridad de todo consejo: (1) que la persona defina criterios verificables y su definición de terminado antes de pedir, y pida evidencia al final; (2) que use artefactos (tableros, páginas, apps) para lo que comparte o consulta seguido; (3) que programe tareas y automatice lo que repite (tareas programadas, loops, /goal, rutinas en la nube).',
  'Escribe también 4 empujones para hoy con base en lo que hizo AYER: frases de máximo 70 caracteres, en «tú», cada una con un emoji. Tipos: «Intenta esto: …» con un prompt o comando concreto, o «Debes mejorar …» con la métrica más baja. Al menos 2 de los 4 van sobre criterios de terminado, artefactos, tareas programadas o automatización.',
  'Responde SOLO un JSON: {"niveles":{"<id>":1-5,...},"recomendaciones":[{"categoria":"herramienta|estructura|sistema|valor","texto":"..."}],"resumen":"<2 frases>","empujones":[{"icono":"<emoji>","texto":"..."}]}',
  '',
  'Métricas de texto:',
  ...TEXT_METRICS.map(metric => `- ${metric.id} [${metric.category}] (${metric.name}): ${anchors(metric)}`),
].join('\n')
