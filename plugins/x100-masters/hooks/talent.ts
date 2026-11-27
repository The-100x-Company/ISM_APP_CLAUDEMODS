// «Radiografía de talento» of «Tu Nivel en Claude» (The 100x Co): 11 talent archetypes and their 55 pairs.
// Informative only: it never changes the score. Pure data, no imports.
// Design, weights and sources: ISM_APP_CLAUDEMODS/docs/0B_DISENO_RADIOGRAFIA_TALENTO_X100_MASTERS.md

export type ArchetypeId = 'builder' | 'data' | 'investigator' | 'governance' | 'architect' | 'planner' | 'strategist' | 'catalyst' | 'creative' | 'connector' | 'learner'

export type Archetype = {
  id: ArchetypeId
  name: string
  alias: string
  talent: string
  signal: string
  cue: string
  xray: string
  genius: string
  kryptonite: string
  habit: string
  gives: string
  roles: string[]
}

export type Pair = {
  name: string
  line: string
  fiction: string
  real: string
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'builder',
    name: 'Builder',
    alias: 'Constructor',
    talent: 'Mentalidad de fabricante: llevas una idea hasta un objeto que funciona.',
    signal: 'Pides código, prototipos, plantillas vivas o automatizaciones para que algo funcione solo.',
    cue: 'Pide algo que funcione (herramienta, plantilla viva, automatización), lo prueba y regresa con el error exacto o el ajuste que quiere.',
    xray: 'Piensas con las manos. Una idea te convence cuando ya la puedes probar.',
    genius: 'Mientras otros siguen discutiendo la idea, tú ya tienes una primera versión que funciona.',
    kryptonite: 'Construyes rápido y a veces resuelves muy bien un problema que nadie tenía.',
    habit: 'Antes de construir, escribe: «Hazme 3 preguntas para confirmar que este es el problema correcto».',
    gives: 'convierten las ideas en herramientas que funcionan',
    roles: ['AI Engineer', 'Software and Applications Developer', 'Forward Deployed Engineer'],
  },
  {
    id: 'data',
    name: 'Data-Centric',
    alias: 'Evidencia y Patrones',
    talent: 'Pensamiento cuantitativo: lógica, medición y rigor con los números.',
    signal: 'Pides cruzar datos, detectar anomalías, modelar escenarios y validar hipótesis con números.',
    cue: 'Trae cifras propias, pide cruzarlas o modelarlas y discute el resultado: duda de un número, pide otro corte o propone su hipótesis.',
    xray: 'No te basta una opinión; quieres ver el número. Mides antes de decidir y desconfías de lo que no se puede contar.',
    genius: 'Mientras otros discuten quién tiene razón, tú ya traes la cifra que cierra la discusión.',
    kryptonite: 'Esperas el dato perfecto y la decisión se pasa de fecha.',
    habit: 'Escribe: «Con estos datos, dime qué decisión tomarías hoy y qué dato faltante la cambiaría».',
    gives: 'aseguran que cada decisión tenga un número detrás',
    roles: ['Big Data Specialist', 'Data Analyst and Scientist', 'Quantitative Researcher'],
  },
  {
    id: 'investigator',
    name: 'Investigator',
    alias: 'Explorador Profundo',
    talent: 'Curiosidad radical: vas a la raíz y conectas puntos que parecen sueltos.',
    signal: 'Pides desmenuzar temas complejos, contrastar fuentes y encontrar el porqué de fondo.',
    cue: 'Pregunta el porqué de fondo de un tema externo, pide contrastar fuentes o causas y repregunta sobre lo que no le cuadra.',
    xray: 'La primera respuesta nunca te alcanza. Sigues preguntando hasta llegar a la causa de fondo.',
    genius: 'Mientras otros se quedan con el titular, tú ya encontraste la causa que nadie había visto.',
    kryptonite: 'Sigues investigando cuando ya tienes suficiente para actuar.',
    habit: 'Al abrir un tema, escribe: «Mi pregunta es X. Avísame cuando ya tenga suficiente para decidir».',
    gives: 'encuentran la causa de fondo antes de que el equipo actúe',
    roles: ['AI Researcher', 'UX Researcher', 'Competitive Intelligence Analyst'],
  },
  {
    id: 'governance',
    name: 'Governance',
    alias: 'Guardián de Calidad',
    talent: 'Criterio crítico: ves riesgos, dilemas éticos y puntos ciegos.',
    signal: 'Pides buscar fallos, auditar sesgos, revisar cumplimiento y cuestionar supuestos.',
    cue: 'Pide atacar un trabajo ya hecho: buscar fallos, riesgos, sesgos o incumplimientos, y decide qué corregir con criterio propio.',
    xray: 'Ves el riesgo antes que los demás. Revisas lo que todos dan por bueno y preguntas qué puede salir mal.',
    genius: 'Mientras otros celebran que ya quedó, tú ya encontraste el error que iba a costar caro.',
    kryptonite: 'Señalas tantos riesgos que el equipo deja de escuchar el que sí importa.',
    habit: 'Escribe: «De estos riesgos, dime cuáles 2 importan de verdad y cómo resolver cada uno».',
    gives: 'evitan que un error llegue al cliente',
    roles: ['AI Governance Lead', 'Security Management Specialist', 'AI Risk and Compliance Manager'],
  },
  {
    id: 'architect',
    name: 'Architect',
    alias: 'Sistémico',
    talent: 'Orden mental: ves los engranajes y diseñas procesos limpios.',
    signal: 'Pides estructurar el caos, crear métodos paso a paso, estandarizar flujos y conectar partes aisladas.',
    cue: 'Describe un proceso desordenado y pide convertirlo en estructura repetible: pasos, reglas, roles o estándar, y corrige el diseño.',
    xray: 'Donde hay desorden, tú ves piezas que encajan. Necesitas entender el sistema completo antes de mover una parte.',
    genius: 'Mientras otros apagan el mismo incendio cada semana, tú diseñas el proceso para que no se repita.',
    kryptonite: 'Diseñas un sistema perfecto para un problema que pedía una solución simple.',
    habit: 'Escribe: «Dame la versión más simple de este proceso que funcione mañana, en máximo 5 pasos».',
    gives: 'dejan procesos claros que cualquiera puede seguir',
    roles: ['AI Solutions Architect', 'Platform Engineer', 'AI Workflow Designer'],
  },
  {
    id: 'planner',
    name: 'Planner',
    alias: 'Orquestador',
    talent: 'Sentido de realidad y de tiempo: sabes qué cabe en una semana.',
    signal: 'Pides priorizar, dividir metas en hitos, asignar recursos y anticipar cuellos de botella.',
    cue: 'Da meta, fecha y recursos reales y pide prioridades, hitos o secuencia; ajusta el plan con restricciones que solo esa persona conoce.',
    xray: 'Tienes los pies en la tierra. Sabes cuánto tarda cada cosa y qué va primero.',
    genius: 'Mientras otros prometen fechas imposibles, tú ya sabes qué día se entrega y qué puede retrasarlo.',
    kryptonite: 'Te aferras al plan cuando la realidad ya cambió.',
    habit: 'Cada lunes, escribe: «Este es mi plan. Dime qué supuesto ya no es cierto y qué debo mover».',
    gives: 'aseguran que el proyecto llegue a tiempo',
    roles: ['Project Manager', 'General and Operations Manager', 'AI Operations Manager'],
  },
  {
    id: 'strategist',
    name: 'Strategist',
    alias: 'Visionario',
    talent: 'Visión panorámica: piensas a largo plazo y en todo el entorno.',
    signal: 'Pides comparar opciones, proyectar consecuencias y analizar decisiones de alto impacto.',
    cue: 'Plantea una decisión grande con opciones, pide ventajas, costos y consecuencias a largo plazo, y toma postura o reta el análisis.',
    xray: 'Miras lejos. Antes de decidir piensas en lo que pasará dentro de un año y en quién más se va a mover.',
    genius: 'Mientras otros resuelven la urgencia de hoy, tú ya viste la jugada que importa el próximo año.',
    kryptonite: 'Te quedas en la visión y el primer paso nunca llega.',
    habit: 'Cierra cada análisis con: «Tradúcelo a 3 acciones para esta semana, con responsable y fecha».',
    gives: 'mantienen al equipo enfocado en lo que importa a largo plazo',
    roles: ['AI Consultant and Strategist', 'Strategic Advisor', 'Chief AI Officer'],
  },
  {
    id: 'catalyst',
    name: 'Catalyst',
    alias: 'Impulsor',
    talent: 'Instinto de tracción: sabes mover a otros a la acción.',
    signal: 'Pides argumentos persuasivos, ángulos de negociación y formas de convencer a un escéptico.',
    cue: 'Nombra a quién quiere convencer y su objeción, pide argumentos o ángulos de negociación y elige o afina el que mejor le sirve.',
    xray: 'Sabes qué mueve a cada persona. Piensas en cómo lograr que una idea se vuelva acción.',
    genius: 'Mientras otros tienen la razón y nadie les hace caso, tú logras que la gente se mueva.',
    kryptonite: 'Convences tan bien que a veces vendes una idea que todavía no está lista.',
    habit: 'Antes de presentar, escribe: «Actúa como el más escéptico de la sala y dime dónde falla mi propuesta».',
    gives: 'logran que una buena idea se convierta en acción',
    roles: ['Sales Executive', 'Founder', 'AI Adoption Lead'],
  },
  {
    id: 'creative',
    name: 'Creative',
    alias: 'Generador Divergente',
    talent: 'Imaginación sin moldes: generas muchas ideas distintas.',
    signal: 'Pides lluvias de ideas, metáforas, conceptos visuales, historias y enfoques fuera de la caja.',
    cue: 'Pide varias ideas o enfoques inusuales, descarta los obvios, mezcla opciones y empuja hacia algo más original.',
    xray: 'Tu cabeza no acepta una sola respuesta. Buscas el ángulo que nadie ha probado.',
    genius: 'Mientras otros se paralizan frente a una hoja en blanco, tú ya tienes diez ideas y tres son buenas.',
    kryptonite: 'Te enamoras de la idea nueva y dejas la anterior a medias.',
    habit: 'Después de la lluvia de ideas, escribe: «Elige conmigo una sola y dame el primer paso para probarla hoy».',
    gives: 'abren opciones que nadie más había considerado',
    roles: ['UI and UX Designer', 'Creative Technologist', 'AI Content Strategist'],
  },
  {
    id: 'connector',
    name: 'Connector',
    alias: 'Empático / Traductor',
    talent: 'Inteligencia relacional: cuidas el tono y la claridad con cada persona.',
    signal: 'Pides adaptar mensajes a cada audiencia, mediar conflictos, dar retroalimentación y enseñar con empatía.',
    cue: 'Describe a la persona o audiencia y la situación, pide ajustar tono, mediar o atender mejor, y corrige el mensaje con lo que sabe de ella.',
    xray: 'Lees a las personas. Antes de hablar piensas en quién escucha y en cómo lo va a recibir.',
    genius: 'Mientras otros mandan el mismo mensaje a todos, tú encuentras las palabras justas para cada persona.',
    kryptonite: 'Cuidas tanto la forma que el mensaje difícil llega suavizado y no se entiende.',
    habit: 'Escribe: «Revisa mi mensaje: ¿queda claro lo que pido o lo suavicé demasiado?».',
    gives: 'logran que el equipo se entienda y trabaje junto',
    roles: ['Change Management Specialist', 'Customer Success Manager', 'Public Affairs Specialist'],
  },
  {
    id: 'learner',
    name: 'Learner',
    alias: 'Aprendiz Perpetuo',
    talent: 'Curiosidad por aprender y valor para cuestionar lo que ya crees saber.',
    signal: 'Pides que Claude te enseñe, te haga preguntas y cuestione lo que crees.',
    cue: 'Pide que le enseñen, no que le resuelvan: explica con sus palabras, pide preguntas de prueba o que cuestionen lo que cree.',
    xray: 'No saber algo no te da pena; te da curiosidad. Prefieres entender a que te lo resuelvan.',
    genius: 'Mientras otros defienden lo que ya saben, tú ya aprendiste lo que sigue.',
    kryptonite: 'Aprendes mucho y aplicas poco; el curso siguiente siempre parece más urgente.',
    habit: 'Al terminar de aprender algo, escribe: «Hazme 5 preguntas para comprobar que lo entendí y dime dónde fallo».',
    gives: 'mantienen al equipo aprendiendo y al día',
    roles: ['Learning and Development Specialist', 'AI Enablement Lead', 'Higher Education Teacher'],
  },
]

// Key: `${a}+${b}` where a comes before b in ARCHETYPES order. All 55 pairs.
export const PAIRS: Record<string, Pair> = {
  // builder
  'builder+data': {
    name: 'El Ingeniero de Evidencia',
    line: 'No construyes a ciegas; mides cada versión y dejas que los números decidan la siguiente.',
    fiction: 'Shuri (Black Panther)',
    real: 'Margaret Hamilton (ingeniera del Apolo)',
  },
  'builder+investigator': {
    name: 'El Científico de Taller',
    line: 'Desarmas un problema hasta entenderlo y luego armas algo para comprobarlo.',
    fiction: 'Dexter (El Laboratorio de Dexter)',
    real: 'Marie Curie (científica pionera)',
  },
  'builder+governance': {
    name: 'El Constructor Confiable',
    line: 'Lo que entregas funciona hoy y sigue funcionando cuando alguien lo usa mal.',
    fiction: 'Lucius Fox (Batman)',
    real: 'Grace Hopper (pionera de la programación)',
  },
  'builder+architect': {
    name: 'El Constructor de Sistemas',
    line: 'No haces una pieza suelta; armas el sistema completo y dejas todo conectado.',
    fiction: 'Bulma (Dragon Ball)',
    real: 'Tim Berners-Lee (creador de la Web)',
  },
  'builder+planner': {
    name: 'El Ejecutor Imparable',
    line: 'Divides la obra en entregas y no sueltas hasta que la última funciona.',
    fiction: 'Andy Dufresne (Sueño de Fuga)',
    real: 'Gwynne Shotwell (presidenta de SpaceX)',
  },
  'builder+strategist': {
    name: 'El Fundador Visionario',
    line: 'Ves a dónde va el mercado y construyes hoy lo que se va a necesitar mañana.',
    fiction: 'Tony Stark (Iron Man)',
    real: 'Jeff Bezos (fundador de Amazon)',
  },
  'builder+catalyst': {
    name: 'El Emprendedor Nato',
    line: 'Construyes algo y de inmediato sales a convencer a otros de usarlo.',
    fiction: 'Willy Wonka (Charlie y la Fábrica de Chocolate)',
    real: 'Sara Blakely (fundadora de Spanx)',
  },
  'builder+creative': {
    name: 'El Inventor Pragmático',
    line: 'No te conformas con imaginar cosas nuevas; necesitas construirlas para verlas funcionar.',
    fiction: 'Doc Brown (Volver al Futuro)',
    real: 'Guillermo González Camarena (inventor mexicano)',
  },
  'builder+connector': {
    name: 'El Artesano de Soluciones',
    line: 'Escuchas lo que alguien necesita y le construyes justo esa herramienta.',
    fiction: 'Q (James Bond)',
    real: 'Steve Wozniak (cofundador de Apple)',
  },
  'builder+learner': {
    name: 'El Aprendiz Práctico',
    line: 'Aprendes haciendo; cada cosa que construyes te deja una habilidad nueva.',
    fiction: 'Peter Parker (Spider-Man)',
    real: 'William Kamkwamba (inventor de Malaui)',
  },
  // data
  'data+investigator': {
    name: 'El Detective de Datos',
    line: 'Sigues la pista en los números hasta encontrar la causa que nadie veía.',
    fiction: 'L (Death Note)',
    real: 'Hannah Fry (matemática y divulgadora)',
  },
  'data+governance': {
    name: 'El Arquitecto de la Verdad',
    line: 'No aceptas una cifra hasta saber de dónde salió y qué puede estar ocultando.',
    fiction: 'Lisa Simpson (Los Simpson)',
    real: 'Daniel Kahneman (psicólogo, Nobel)',
  },
  'data+architect': {
    name: 'El Cartógrafo de Datos',
    line: 'Conviertes datos sueltos en un modelo ordenado que cualquiera puede consultar.',
    fiction: 'Data (Star Trek)',
    real: 'Dmitri Mendeléyev (tabla periódica)',
  },
  'data+planner': {
    name: 'El Pronosticador Realista',
    line: 'Planeas con números: sabes cuánto tarda cada paso y dónde se va a atorar.',
    fiction: 'Mark Watney (Misión Rescate)',
    real: 'Katherine Johnson (matemática de la NASA)',
  },
  'data+strategist': {
    name: 'El Estratega Cuantitativo',
    line: 'Apuestas a largo plazo, pero solo después de calcular las probabilidades.',
    fiction: 'Hari Seldon (Fundación)',
    real: 'Billy Beane (pionero del Moneyball)',
  },
  'data+catalyst': {
    name: 'El Persuasor con Cifras',
    line: 'Convences con la cifra exacta en el momento exacto.',
    fiction: 'Ian Malcolm (Jurassic Park)',
    real: 'Florence Nightingale (enfermera y estadística)',
  },
  'data+creative': {
    name: 'El Artista de Datos',
    line: 'Ves una historia donde otros ven una tabla, y la cuentas con imágenes.',
    fiction: 'Neo (Matrix)',
    real: 'M. C. Escher (artista gráfico)',
  },
  'data+connector': {
    name: 'El Traductor de Números',
    line: 'Explicas un dato difícil de forma que todos lo entienden y lo usan.',
    fiction: 'Baymax (Grandes Héroes)',
    real: 'Hans Rosling (médico y divulgador)',
  },
  'data+learner': {
    name: 'El Experimentador Constante',
    line: 'Pones a prueba lo que crees con datos y cambias de opinión cuando no cuadran.',
    fiction: 'Senku Ishigami (Dr. Stone)',
    real: 'Galileo Galilei (astrónomo)',
  },
  // investigator
  'investigator+governance': {
    name: 'El Escéptico Riguroso',
    line: 'Buscas la causa de fondo y no sueltas hasta descartar cada supuesto débil.',
    fiction: 'Gregory House (Dr. House)',
    real: 'Mario Molina (químico mexicano, Nobel)',
  },
  'investigator+architect': {
    name: 'El Mapeador de Ideas',
    line: 'Investigas a fondo y dejas lo aprendido en un mapa que otros pueden seguir.',
    fiction: 'Hermione Granger (Harry Potter)',
    real: 'Charles Darwin (naturalista)',
  },
  'investigator+planner': {
    name: 'El Explorador Metódico',
    line: 'Tu curiosidad tiene ruta: defines qué averiguar primero y cuándo parar.',
    fiction: 'Hercule Poirot (Agatha Christie)',
    real: 'Roald Amundsen (explorador polar)',
  },
  'investigator+strategist': {
    name: 'El Analista de Futuros',
    line: 'Entiendes el porqué de fondo y con eso anticipas lo que viene.',
    fiction: 'Doctor Strange (Marvel)',
    real: 'Peter Drucker (pensador de negocios)',
  },
  'investigator+catalyst': {
    name: 'El Investigador que Convence',
    line: 'Encuentras la verdad escondida y la cuentas de forma que mueve a la gente.',
    fiction: 'Lois Lane (Superman)',
    real: 'David Attenborough (naturalista y narrador)',
  },
  'investigator+creative': {
    name: 'El Alquimista de Ideas',
    line: 'Juntas temas que nadie relaciona y de ahí sacas ideas nuevas.',
    fiction: 'El Doctor (Doctor Who)',
    real: 'Leonardo da Vinci (artista e inventor)',
  },
  'investigator+connector': {
    name: 'El Lector de Personas',
    line: 'Investigas hasta entender qué mueve a cada persona y se lo explicas con tacto.',
    fiction: 'Sherlock Holmes (Arthur Conan Doyle)',
    real: 'Brené Brown (investigadora y autora)',
  },
  'investigator+learner': {
    name: 'El Eterno Preguntón',
    line: 'Cada respuesta te abre dos preguntas nuevas, y eso te encanta.',
    fiction: 'Alicia (Alicia en el País de las Maravillas)',
    real: 'Carl Sagan (astrónomo y divulgador)',
  },
  // governance
  'governance+architect': {
    name: 'El Guardián del Proceso',
    line: 'Diseñas el proceso para que el error se detenga antes de llegar al cliente.',
    fiction: 'Monica Geller (Friends)',
    real: 'W. Edwards Deming (padre de la calidad)',
  },
  'governance+planner': {
    name: 'El Previsor de Riesgos',
    line: 'Antes de arrancar ya sabes qué puede fallar y tienes listo el plan B.',
    fiction: 'Batman (DC)',
    real: 'Chesley «Sully» Sullenberger (piloto)',
  },
  'governance+strategist': {
    name: 'El Consejero Prudente',
    line: 'Ves la jugada grande y también el riesgo que otros prefieren no mirar.',
    fiction: 'Gandalf (El Señor de los Anillos)',
    real: 'Warren Buffett (inversionista)',
  },
  'governance+catalyst': {
    name: 'El Abogado del Diablo',
    line: 'Cuestionas la propuesta con tan buenos argumentos que todos la mejoran.',
    fiction: 'Atticus Finch (Matar a un Ruiseñor)',
    real: 'Malala Yousafzai (activista por la educación)',
  },
  'governance+creative': {
    name: 'El Crítico Constructivo',
    line: 'Imaginas sin límite y luego revisas tu propia idea sin piedad.',
    fiction: 'Miranda Priestly (El Diablo Viste a la Moda)',
    real: 'Alfonso Cuarón (cineasta mexicano)',
  },
  'governance+connector': {
    name: 'El Mentor Honesto',
    line: 'Dices la verdad incómoda con tanto cuidado que la otra persona la agradece.',
    fiction: 'Mary Poppins (Mary Poppins)',
    real: 'Jane Goodall (primatóloga)',
  },
  'governance+learner': {
    name: 'El Autocrítico Lúcido',
    line: 'Pones a prueba tus propias ideas antes de que alguien más lo haga.',
    fiction: 'Aang (Avatar: La Leyenda de Aang)',
    real: 'Adam Grant (psicólogo organizacional)',
  },
  // architect
  'architect+planner': {
    name: 'El Director de Orquesta',
    line: 'Diseñas el sistema y también el calendario para ponerlo en marcha.',
    fiction: 'El Profesor (La Casa de Papel)',
    real: 'Taiichi Ohno (creador del sistema Toyota)',
  },
  'architect+strategist': {
    name: 'El Estratega Sistémico',
    line: 'Ves el tablero completo y cómo cada pieza mueve a las demás.',
    fiction: 'Tyrion Lannister (Game of Thrones)',
    real: 'Lisa Su (directora de AMD)',
  },
  'architect+catalyst': {
    name: 'El Constructor de Movimientos',
    line: 'Das a la gente un método tan claro que seguirlo se vuelve lo natural.',
    fiction: 'Capitán América (Marvel)',
    real: 'Marie Kondo (experta en orden)',
  },
  'architect+creative': {
    name: 'El Arquitecto de Mundos',
    line: 'Imaginas mundos completos y les das reglas para que todo encaje.',
    fiction: 'Dom Cobb (El Origen)',
    real: 'Hayao Miyazaki (animador)',
  },
  'architect+connector': {
    name: 'El Traductor de Procesos',
    line: 'Tomas un proceso enredado y lo dejas tan claro que cualquiera lo sigue.',
    fiction: 'C-3PO (Star Wars)',
    real: 'Maria Montessori (educadora)',
  },
  'architect+learner': {
    name: 'El Coleccionista de Métodos',
    line: 'Cada cosa que aprendes la conviertes en un método que puedes repetir.',
    fiction: 'Izuku Midoriya (My Hero Academia)',
    real: 'Barbara Oakley (autora de Aprender a Aprender)',
  },
  // planner
  'planner+strategist': {
    name: 'El Estratega Aterrizado',
    line: 'Defines el rumbo a tres años y también lo que toca hacer el lunes.',
    fiction: 'Leia Organa (Star Wars)',
    real: 'Tim Cook (director de Apple)',
  },
  'planner+catalyst': {
    name: 'El Capitán de Equipo',
    line: 'Pones fechas claras y logras que todos quieran cumplirlas.',
    fiction: 'Woody (Toy Story)',
    real: 'Jürgen Klopp (entrenador de futbol)',
  },
  'planner+creative': {
    name: 'El Productor Creativo',
    line: 'Tienes ideas atrevidas y también el plan para entregarlas a tiempo.',
    fiction: 'Phineas Flynn (Phineas y Ferb)',
    real: 'Kevin Feige (productor de Marvel)',
  },
  'planner+connector': {
    name: 'El Coordinador Humano',
    line: 'Organizas el trabajo pensando en la carga y el ánimo de cada persona.',
    fiction: 'Pepper Potts (Iron Man)',
    real: 'Indra Nooyi (exdirectora de PepsiCo)',
  },
  'planner+learner': {
    name: 'El Aprendiz Disciplinado',
    line: 'Conviertes lo que quieres aprender en un plan con metas por semana.',
    fiction: 'Rocky Balboa (Rocky)',
    real: 'Lorena Ochoa (golfista mexicana)',
  },
  // strategist
  'strategist+catalyst': {
    name: 'El Visionario Magnético',
    line: 'Ves el futuro antes que otros y logras que quieran ir contigo.',
    fiction: 'Charles Xavier (X-Men)',
    real: 'Steve Jobs (cofundador de Apple)',
  },
  'strategist+creative': {
    name: 'El Soñador Estratégico',
    line: 'Imaginas un futuro distinto y trazas el camino para llegar.',
    fiction: 'Capitán Nemo (Veinte Mil Leguas de Viaje Submarino)',
    real: 'George Lucas (creador de Star Wars)',
  },
  'strategist+connector': {
    name: 'El Diplomático Visionario',
    line: 'Lees a cada persona en la mesa y encuentras el acuerdo que sirve a largo plazo.',
    fiction: 'Jean-Luc Picard (Star Trek)',
    real: 'Satya Nadella (director de Microsoft)',
  },
  'strategist+learner': {
    name: 'El Estratega Adaptable',
    line: 'Cambias de estrategia sin drama cuando aprendes algo que la contradice.',
    fiction: 'Beth Harmon (Gambito de Dama)',
    real: 'Reed Hastings (cofundador de Netflix)',
  },
  // catalyst
  'catalyst+creative': {
    name: 'El Contador de Historias',
    line: 'Envuelves tu propuesta en una historia que nadie olvida.',
    fiction: 'Sherezada (Las Mil y Una Noches)',
    real: 'Lin-Manuel Miranda (compositor y actor)',
  },
  'catalyst+connector': {
    name: 'El Líder Cercano',
    line: 'Convences porque primero escuchas, y la gente lo nota.',
    fiction: 'Ted Lasso (Ted Lasso)',
    real: 'Oprah Winfrey (conductora y empresaria)',
  },
  'catalyst+learner': {
    name: 'El Coach Inspirador',
    line: 'Lo que aprendes hoy lo compartes mañana y contagias las ganas de aprender.',
    fiction: 'John Keating (La Sociedad de los Poetas Muertos)',
    real: 'Simon Sinek (autor y conferencista)',
  },
  // creative
  'creative+connector': {
    name: 'El Narrador Empático',
    line: 'Creas historias e imágenes que hacen sentir a cada persona que le hablas a ella.',
    fiction: 'Miguel Rivera (Coco)',
    real: 'Guillermo del Toro (cineasta mexicano)',
  },
  'creative+learner': {
    name: 'El Eterno Principiante',
    line: 'Pruebas técnicas nuevas sin miedo a hacerlo mal la primera vez.',
    fiction: 'Remy (Ratatouille)',
    real: 'Natalia Lafourcade (cantautora mexicana)',
  },
  // connector
  'connector+learner': {
    name: 'El Maestro Paciente',
    line: 'Aprendes algo y de inmediato buscas la forma más clara de enseñarlo.',
    fiction: 'Señor Miyagi (Karate Kid)',
    real: 'Salman Khan (fundador de Khan Academy)',
  },
}
