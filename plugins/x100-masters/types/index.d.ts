export type Category = 'herramienta' | 'estructura' | 'sistema' | 'valor'
export type Evaluator = 'codigo' | 'haiku' | 'sonnet'
export type MetricResult = { id: string; category: Category; level: number | null; value?: number; evaluator: Evaluator; model: string; at: string; potential?: number | null }
export type Recommendation = { category: Category; text: string; evaluator: Evaluator; model: string; at: string }
// The person's real level: what they have shown they can do on their good days, not today's average.
export type Potential = {
  score: number
  tier: string
  categories: Record<Category, number | null>
  // 0 to 1: how much evidence stands behind it (substantive days seen in 45).
  confidence: number
  // Score 80+ with confidence 0.75+.
  crack: boolean
  // Metrics whose level met the recurrence rule today (4 times in 45 days, 2 of them within 10 days).
  recurrent: number
}
export type MastersProfile = {
  email: string
  score: number
  tier: string
  categories: Record<Category, number | null>
  metrics: MetricResult[]
  recommendations: Recommendation[]
  summary: string
  // Prompts and active days behind the averages (the last 10 days of use).
  prompts: number
  days: number
  // Each category's score on each of those days, oldest first.
  trend: Record<Category, (number | null)[]>
  potential: Potential | null
  // Today's recurrent maximum per metric, for the 120-day memory.
  realToday: Record<string, number>
  updatedAt: string
}
// Tokens the mod itself spent on its evaluations (Haiku, Sonnet), last 30 days. Admins see it as a hidden column.
export type Consumo = { entrada: number; salida: number; cache_leida: number; cache_escrita: number; llamadas: number; dias: number }
// What leaves the machine from the talent X-ray: the pair's name, the two top archetypes and the 0-100 score per archetype.
// Never the evidence nor any prompt. listo = enough points and days to show it.
export type TeamTalent = { listo: boolean; par: string | null; top: string[]; puntajes: Record<string, number> }
// The group's view, from Supabase: names only, never emails.
// metricas: every metric of the person as [momento actual, nivel real].
export type TeamPerson = { nombre: string; puntaje: number; nivel: string; categorias: Record<Category, number | null>; potencial: { puntaje?: number; nivel?: string; categorias?: Record<Category, number | null>; confianza?: number; crack?: boolean } | null; dias: number; yo: boolean; metricas?: Record<string, [number | null, number | null]>; licencia?: string | null; recomendaciones?: { categoria: Category; texto: string }[]; resumen?: string | null; talento?: TeamTalent | null; consumo?: Consumo | null }
export type Team = {
  // The company's name and its ranking's name, both from the server: «ISMO Motors», «Ranking ISMO Motors».
  empresa?: string
  ranking?: string
  // True for owners and admins of the Claude organization: the ranking opens each member's full view.
  admin?: boolean
  corte: string
  personas: TeamPerson[]
  metricas: Record<string, { media: number | null; master: string | null; master_nivel: number | null }>
  categorias: Record<Category, { media: number | null; master: string | null; master_nivel?: number | null }>
}
// The band's nudge: a celebration or one thing to try.
// tip: a piece of advice (shown as «Tip: …»); otherwise a celebration with its icon.
export type BandNudge = { icon: string; text: string; tip?: boolean }
declare module 'claude-code' { interface PluginState { 'x100-masters': { profile: MastersProfile | null; nudge: BandNudge | null } } }
