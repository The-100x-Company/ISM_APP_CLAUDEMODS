export type Category = 'herramienta' | 'estructura' | 'sistema' | 'valor'
export type Evaluator = 'codigo' | 'haiku' | 'sonnet'
export type MetricResult = { id: string; category: Category; level: number | null; value?: number; evaluator: Evaluator; model: string; at: string }
export type Recommendation = { category: Category; text: string; evaluator: Evaluator; model: string; at: string }
export type MastersProfile = {
  email: string
  score: number
  tier: string
  categories: Record<Category, number | null>
  metrics: MetricResult[]
  recommendations: Recommendation[]
  summary: string
  prompts: number
  updatedAt: string
}
declare module 'claude-code' { interface PluginState { 'x100-masters': { profile: MastersProfile | null } } }
