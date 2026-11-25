// The rubric of «Tu Nivel en Claude» (The 100x Co): 37 metrics in four categories, each scored 1 (Inicial) to 5 (Experto).
// Code scores what can be counted; Haiku reads each 10-prompt window; Sonnet calibrates once a day.
import type { Category, Evaluator } from '../types'

export type Metric = { id: string; category: Category; name: string; about: string; evaluator: Evaluator; levels?: readonly [string, string, string, string, string] }

export const WEIGHTS: Record<Category, number> = { herramienta: 0.3, estructura: 0.3, sistema: 0.2, valor: 0.2 }

export const CATEGORIES: readonly Category[] = ['herramienta', 'estructura', 'sistema', 'valor']

export const CATEGORY_NAMES: Record<Category, string> = {
  herramienta: 'Uso de la herramienta',
  estructura: 'Estructuración y elaboración',
  sistema: 'Sistematización y recursividad',
  valor: 'Enfoque en valor de negocio',
}

export const CATEGORY_ABOUT: Record<Category, string> = {
  herramienta: 'Cuánto y qué tan a fondo usa Claude: frecuencia, jornada, profundidad y variedad.',
  estructura: 'Qué tan bien plantea el trabajo: objetivo, contexto, criterios, casos borde y verificación.',
  sistema: 'Si convierte lo que hace en sistema: SOPs, comandos, loops, automatizaciones y agentes.',
  valor: 'Si trabaja sobre el valor de la compañía: conoce sus KPIs, mide, analiza retorno y prioriza por impacto.',
}

export const TIERS = ['Inicial', 'Básico', 'Competente', 'Avanzado', 'Experto'] as const

type Cuts = readonly [number, number, number, number]

// Code metrics: the value is computed over the last 30 days and cut by the four thresholds into a level.
export const CODE_METRICS: readonly (Metric & { cuts: Cuts; unit: string })[] = [
  { id: 'adopcion', category: 'herramienta', name: 'Adopción', about: 'Días con uso real en los últimos 30', evaluator: 'codigo', unit: 'días', cuts: [3, 8, 15, 22] },
  { id: 'frecuencia', category: 'herramienta', name: 'Frecuencia', about: 'Parte de los prompts que llegan a menos de 10 min del anterior', evaluator: 'codigo', unit: 'proporción', cuts: [0.1, 0.3, 0.5, 0.7] },
  { id: 'jornada', category: 'herramienta', name: 'Jornada', about: 'Horas por día con Claude en uso', evaluator: 'codigo', unit: 'h/día', cuts: [0.5, 1, 3, 6] },
  { id: 'sesiones', category: 'herramienta', name: 'Sesiones por día', about: 'Sesiones nuevas por día activo', evaluator: 'codigo', unit: 'sesiones/día', cuts: [1.5, 3, 5, 8] },
  { id: 'profundidad', category: 'herramienta', name: 'Profundidad', about: 'Prompts por sesión', evaluator: 'codigo', unit: 'prompts/sesión', cuts: [3, 6, 16, 41] },
  { id: 'consumo', category: 'herramienta', name: 'Consumo', about: 'Tokens nuevos por día activo (sin lecturas de caché)', evaluator: 'codigo', unit: 'tokens/día', cuts: [50_000, 250_000, 1_000_000, 5_000_000] },
  { id: 'variedad', category: 'herramienta', name: 'Variedad', about: 'Herramientas distintas que Claude usa por ti', evaluator: 'codigo', unit: 'herramientas', cuts: [3, 6, 10, 15] },
  { id: 'contexto', category: 'herramienta', name: 'Contexto', about: 'Prompts que señalan archivos o rutas concretas', evaluator: 'codigo', unit: 'proporción', cuts: [0.02, 0.1, 0.25, 0.5] },
  { id: 'planificacion', category: 'herramienta', name: 'Planificación', about: 'Plan mode, planes o specs antes de construir, por cada 100 prompts', evaluator: 'codigo', unit: 'por 100', cuts: [0.5, 1, 3, 8] },
  { id: 'skills', category: 'herramienta', name: 'Skills', about: 'Skills usadas por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.1, 0.5, 2, 5] },
  { id: 'conectores', category: 'herramienta', name: 'Conectores', about: 'Llamadas a sistemas conectados (MCP) por día activo', evaluator: 'codigo', unit: 'por día', cuts: [1, 2, 10, 50] },
  { id: 'conduccion', category: 'herramienta', name: 'Conducción', about: 'Interrupciones y correcciones de rumbo por cada 100 prompts', evaluator: 'codigo', unit: 'por 100', cuts: [0.5, 1, 3, 8] },
  { id: 'escritorio', category: 'herramienta', name: 'App de escritorio', about: 'Parte del trabajo hecho en la app de escritorio', evaluator: 'codigo', unit: 'proporción', cuts: [0.25, 0.5, 0.75, 0.95] },
  { id: 'delegacion', category: 'sistema', name: 'Delegación', about: 'Subagentes y workflows lanzados por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.1, 0.5, 2, 8] },
  { id: 'automatizacion', category: 'sistema', name: 'Automatización', about: 'Loops, tareas programadas, monitores y disparadores por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.05, 0.2, 0.5, 2] },
  { id: 'comandos', category: 'sistema', name: 'Comandos', about: 'Parte de los prompts que arrancan un comando o skill guardado (/algo)', evaluator: 'codigo', unit: 'proporción', cuts: [0.01, 0.03, 0.08, 0.15] },
  { id: 'construccion', category: 'sistema', name: 'Construye sistema', about: 'Ediciones a skills, reglas, CLAUDE.md, hooks o mods por día activo', evaluator: 'codigo', unit: 'por día', cuts: [0.05, 0.2, 1, 3] },
]

// Text metrics: Haiku scores each 10-prompt window against these anchors; Sonnet recalibrates daily.
export const TEXT_METRICS: readonly (Metric & { levels: readonly [string, string, string, string, string] })[] = [
  { id: 'objetivo', category: 'estructura', name: 'Objetivo', about: 'Dice qué quiere lograr y para qué', evaluator: 'haiku', levels: ['Orden suelta sin fin', 'Tarea sin propósito', 'Tarea con propósito', 'Propósito y resultado esperado', 'Propósito, resultado y quién lo usa'] },
  { id: 'contexto_negocio', category: 'estructura', name: 'Contexto de negocio', about: 'Da el contexto que Claude no puede adivinar', evaluator: 'haiku', levels: ['Ninguno', 'Una pista', 'Contexto básico', 'Contexto, restricciones y fuentes', 'Todo lo anterior y lo que ya se intentó'] },
  { id: 'criterios', category: 'estructura', name: 'Criterios de aceptación', about: 'Define cómo se ve un trabajo terminado', evaluator: 'haiku', levels: ['Ninguno', 'Vago («que quede bien»)', 'Uno verificable', 'Varios verificables', 'Pasa o falla con prueba concreta'] },
  { id: 'edge_cases', category: 'estructura', name: 'Casos borde', about: 'Anticipa excepciones y datos raros', evaluator: 'haiku', levels: ['Nunca', 'Reacciona cuando fallan', 'Menciona alguno', 'Los enumera antes', 'Los pide probar uno por uno'] },
  { id: 'exploracion', category: 'estructura', name: 'Exploración', about: 'Hace preguntas abiertas antes de decidir', evaluator: 'haiku', levels: ['Solo órdenes', 'Preguntas cerradas', 'Alguna pregunta abierta', 'Explora opciones antes de decidir', 'Contrasta alternativas y supuestos'] },
  { id: 'verificacion', category: 'estructura', name: 'Verificación', about: 'Pide evidencia, no la palabra de Claude', evaluator: 'haiku', levels: ['Acepta todo', 'Pregunta si quedó', 'Pide revisar', 'Pide evidencia (salida, captura, cifra)', 'Exige prueba reproducible y la revisa'] },
  { id: 'iteracion', category: 'estructura', name: 'Iteración crítica', about: 'Cuestiona la respuesta y la mejora', evaluator: 'haiku', levels: ['Acepta la primera', 'Repite la misma orden', 'Corrige un detalle', 'Señala el error y por qué', 'Reencuadra el problema cuando hace falta'] },
  { id: 'descomposicion', category: 'estructura', name: 'Descomposición', about: 'Parte un problema grande en pasos', evaluator: 'haiku', levels: ['Todo en una orden', 'Pasos implícitos', 'Algunos pasos', 'Pasos ordenados', 'Fases con entregables y dependencias'] },
  { id: 'precision', category: 'estructura', name: 'Precisión', about: 'Nombra el archivo, el dato o el síntoma exacto', evaluator: 'haiku', levels: ['Ambiguo', 'General', 'Concreto en parte', 'Concreto', 'Exacto: dónde, qué y cuánto'] },
  { id: 'documentacion', category: 'sistema', name: 'Documentación', about: 'Deja registro reutilizable: handover, reglas, skills', evaluator: 'haiku', levels: ['Nunca', 'Rara vez', 'A veces pide resumen', 'Pide dejar registro', 'Convierte lo aprendido en reglas o skills'] },
  { id: 'sops', category: 'sistema', name: 'SOPs', about: 'Repite procesos con un procedimiento estándar, no improvisa cada vez', evaluator: 'haiku', levels: ['Improvisa cada vez', 'Copia un prompt viejo', 'Usa una plantilla propia', 'Sigue un SOP o skill con pasos fijos', 'Mantiene y versiona sus SOPs como skills o comandos'] },
  { id: 'loops', category: 'sistema', name: 'Loops', about: 'Diseña ciclos de hacer, verificar y corregir hasta cumplir un criterio', evaluator: 'haiku', levels: ['Un intento y ya', 'Repite a mano cuando falla', 'Pide revisar y corregir una vez', 'Pide iterar hasta pasar una prueba', 'Programa loops con criterio de salida, monitores o tareas recurrentes'] },
  { id: 'recursividad', category: 'sistema', name: 'Recursividad', about: 'Usa a Claude para mejorar su propio trabajo con Claude: prompts que generan prompts, agentes que revisan agentes', evaluator: 'haiku', levels: ['Nunca', 'Pide mejorar un prompt', 'Pide a Claude que critique su respuesta', 'Usa un agente revisor o un evaluador', 'Cadenas de agentes que se generan, revisan y mejoran entre sí'] },
  { id: 'generalizacion', category: 'sistema', name: 'Generalización', about: 'Convierte un caso en regla reutilizable para otros casos, áreas o clientes', evaluator: 'haiku', levels: ['Resuelve solo el caso', 'Nota que se repite', 'Reusa la solución en otro caso', 'Pide la versión general', 'Diseña la solución agnóstica desde el inicio'] },
  { id: 'kpis', category: 'valor', name: 'Conoce sus KPIs', about: 'Nombra los indicadores que mueven su área', evaluator: 'haiku', levels: ['No menciona ninguno', 'Habla de «que mejore»', 'Nombra un indicador', 'Nombra los indicadores de su área y su estado', 'Conecta sus indicadores con los de la empresa'] },
  { id: 'metrica_exito', category: 'valor', name: 'Métrica de éxito', about: 'Define qué indicador debe moverse con el trabajo', evaluator: 'haiku', levels: ['Ninguna', 'Intuición', 'Un indicador sin meta', 'Indicador con meta', 'Indicador, meta y plazo'] },
  { id: 'linea_base', category: 'valor', name: 'Línea base', about: 'Sabe cómo está hoy antes de cambiar algo', evaluator: 'haiku', levels: ['Ninguna', 'Impresión', 'Dato aproximado', 'Dato medido', 'Dato medido con fuente'] },
  { id: 'roi', category: 'valor', name: 'Análisis de retorno', about: 'Compara esfuerzo contra beneficio en la unidad que aplique: horas, conversión, errores, tiempo de ciclo o dinero', evaluator: 'haiku', levels: ['Nunca', 'Dice que «vale la pena»', 'Piensa en el beneficio o en el esfuerzo', 'Compara esfuerzo y beneficio', 'Compara opciones por retorno con supuestos explícitos'] },
  { id: 'prioridad', category: 'valor', name: 'Prioridad por impacto', about: 'Elige qué hacer primero por impacto en el negocio', evaluator: 'haiku', levels: ['Lo que llega', 'Lo urgente', 'Algo de criterio', 'Ordena por impacto', 'Ordena por impacto y esfuerzo y descarta'] },
  { id: 'cierre', category: 'valor', name: 'Cierre del ciclo', about: 'Vuelve a medir el resultado real', evaluator: 'haiku', levels: ['Nunca', 'Supone que funcionó', 'Lo revisa a ojo', 'Mide el resultado', 'Mide, compara con la línea base y ajusta'] },
]

export const ALL_METRICS: readonly Metric[] = [...CODE_METRICS, ...TEXT_METRICS]

// A value cut by four ascending thresholds: under the first is 1, at or past the last is 5.
export const levelOf = (value: number, cuts: readonly number[]) => 1 + cuts.filter(cut => value >= cut).length

const anchors = (metric: (typeof TEXT_METRICS)[number]) => metric.levels.map((text, at) => `${at + 1}=${text}`).join('; ')

const RULES = [
  'Califica la sustancia, no palabras clave: decir «ROI», «KPI», «criterios» o «loop» sin un indicador, una condición o un ejemplo concreto vale 1 o 2.',
  'Valor no exige dinero: un indicador operativo (tiempo de respuesta, conversión, errores, entregas a tiempo, satisfacción) cuenta igual que pesos.',
  'Sistematización premia convertir el trabajo en sistema: comandos, skills, SOPs, loops con criterio de salida, tareas programadas, agentes que revisan a otros agentes.',
  'Un prompt corto y exacto puede valer más que uno largo y vago. El idioma coloquial no resta.',
]

// The stable prefix of every Haiku call: rubric and rules first, so the prompt cache holds it.
export const HAIKU_SYSTEM = [
  'Eres un evaluador estricto de cómo una persona usa Claude en su trabajo. Recibes una ventana de sus prompts.',
  'Califica cada métrica de 1 a 5 según su anclaje. Si la ventana no da evidencia para una métrica, usa null.',
  ...RULES,
  'Responde SOLO un JSON: {"niveles":{"<id>":1-5|null,...},"consejos":{"herramienta":"<una frase>","estructura":"<una frase>","sistema":"<una frase>","valor":"<una frase>"}}',
  '',
  'Métricas:',
  ...TEXT_METRICS.map(metric => `- ${metric.id} [${metric.category}] (${metric.name}): ${metric.about}. Niveles: ${anchors(metric)}`),
].join('\n')

export const SONNET_SYSTEM = [
  'Eres el evaluador senior de «Tu Nivel en Claude» (The 100x Co). Una vez al día haces la evaluación completa de una persona.',
  'Recibes sus niveles actuales (código y Haiku), sus cifras de uso y extractos de sus prompts recientes.',
  'Recalibra solo las métricas de texto: confirma o corrige cada nivel con base en la evidencia. No toques las de código.',
  ...RULES,
  'Escribe 3 recomendaciones por categoría (herramienta, estructura, sistema, valor): una frase cada una, concretas, accionables mañana, con un ejemplo de prompt mejor.',
  'Responde SOLO un JSON: {"niveles":{"<id>":1-5,...},"recomendaciones":[{"categoria":"herramienta|estructura|sistema|valor","texto":"..."}],"resumen":"<2 frases>"}',
  '',
  'Métricas de texto:',
  ...TEXT_METRICS.map(metric => `- ${metric.id} [${metric.category}] (${metric.name}): ${anchors(metric)}`),
].join('\n')
