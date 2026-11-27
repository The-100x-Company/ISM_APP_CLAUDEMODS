# Diseño · Radiografía de talento · x100-masters 0.5.0

Fecha: 2026-11-26 23:19 (hora de México). Mod: `x100-masters` («Tu Nivel en Claude by The 100x Co»).
Datos: `plugins/x100-masters/hooks/talent.ts`.
La radiografía es informativa. No cambia el puntaje. Separador decimal: punto.

## A. Evaluación de los arquetipos

### A.1 Veredicto

- 11 arquetipos es el número correcto. Ningún par se debe fusionar.
- `learner` es necesario. Sin él, la tutoría socrática cae en `investigator` y se pierde.
- Los 11 cubren 9 de las 10 habilidades núcleo del WEF 2025. La que falta es «resiliencia, flexibilidad y agilidad». Un prompt no la muestra. No se agrega eje.
- «Orientación al servicio» (WEF [?]) no tiene eje propio. Va en `connector`. Importa en ISMO: asesores y servicio al cliente.
- El eje con más riesgo de inflarse es `builder`. Claude Code atrae pedidos de código. La regla «código sin prueba ni ajuste = delegación» lo controla.

### A.2 Cruce con el WEF

| Arquetipo | Habilidad WEF 2025 |
|---|---|
| `builder` | Alfabetización tecnológica [?]; IA y big data |
| `data` | Pensamiento analítico (núcleo n.º 1, 69 %) |
| `investigator` | Pensamiento analítico; curiosidad |
| `governance` | Control de calidad; redes y ciberseguridad |
| `architect` | Pensamiento sistémico [?] |
| `planner` | Gestión de recursos y operaciones |
| `strategist` | Pensamiento analítico; liderazgo |
| `catalyst` | Liderazgo e influencia social (61 %) |
| `creative` | Pensamiento creativo (57 %) |
| `connector` | Empatía y escucha activa (50 %); orientación al servicio [?] |
| `learner` | Curiosidad y aprendizaje permanente (50 %); motivación y autoconciencia (52 %) |

### A.3 Regla de frontera por par confundible

| Par | Regla de una línea |
|---|---|
| `architect` / `planner` | Diseña cómo funciona siempre = `architect`. Ordena qué se hace y cuándo, una vez = `planner`. |
| `strategist` / `planner` | Decide a dónde ir y qué sacrificar = `strategist`. Decide el orden para llegar = `planner`. |
| `investigator` / `learner` | El objeto es un tema externo = `investigator`. El objeto es la propia comprensión o creencia = `learner`. |
| `data` / `governance` | Usa números para concluir = `data`. Juzga si algo es confiable, seguro o correcto = `governance`. |
| `data` / `investigator` | La evidencia son cifras = `data`. La evidencia son fuentes, causas o textos = `investigator`. |
| `builder` / `architect` | Quiere el objeto que corre = `builder`. Quiere el diseño o el método = `architect`. |
| `catalyst` / `connector` | Quiere que la otra persona haga o acepte algo = `catalyst`. Quiere que entienda o se sienta atendida = `connector`. |
| `creative` / `catalyst` | La historia busca novedad = `creative`. La historia busca convencer a alguien nombrado = `catalyst`. |
| `governance` / `investigator` | Ataca un trabajo ya hecho = `governance`. Explora un tema abierto = `investigator`. |
| `strategist` / `investigator` | Termina en una decisión = `strategist`. Termina en una explicación = `investigator`. |

### A.4 Observaciones de nombre

- «Influenciador» se lee en México como persona de redes sociales. Sugerencia: «Impulsor». `talent.ts` conserva «Influenciador» hasta que el dueño decida.
- «El Arquitecto de la Verdad» tiene 5 palabras. Se conserva por ser ejemplo del dueño.
- El ejemplo `architect+creative` traía a Christopher Nolan como ficción. Nolan es una persona real. Se usó a Dom Cobb, personaje de Nolan en «El Origen». Miyazaki queda como figura real.

## B. Cómo se evita cada sesgo

### B.1 Pesos

| Concepto | Valor | Regla en palabras simples |
|---|---|---|
| Higiene (`h`) | 0.05 | Corregir, traducir, resumir y dar formato casi no cuentan. |
| Delegación (`d`) | 0.25 | Encargar sin criterio propio cuenta poco. La persona delega lo que no domina. |
| Co-creación (`c`) | 1.00 | Iterar, cuestionar y aportar criterio cuenta completo. |
| Fuera de horario | × 1.5 | Se aplica a `d` y `c`. No se aplica a `h`. Horario laboral: lunes a viernes, 08:00 a 19:00, hora local. |
| Arquetipo dominante | × 1.0 | Primer id de `a`. |
| Segundo arquetipo | × 0.5 | Segundo id de `a`. |
| Tope por día y eje | 6 puntos | Una sesión larga no define el perfil. |
| Ventana | 90 días | El estilo cambia lento. El puntaje sigue en 30 días. |

Puntos de un prompt para un eje = peso de `t` × multiplicador de horario × peso de posición.

### B.2 Sesgo por sesgo

- **Delegación contra talento.** El clasificador marca `c` solo con criterio propio visible. Ante la duda marca `d`. El código da a `d` un cuarto del peso de `c`.
- **Higiene.** `h` lleva lista vacía de arquetipos. El peso 0.05 solo existe por si el clasificador falla.
- **Tutoría socrática diluida.** `learner` tiene eje propio. La frontera con `investigator` está en A.3.
- **Trabajo asignado contra interés propio.** Lo hecho fuera de horario vale 1.5 veces. El código decide el horario. El clasificador no ve la hora.
- **Volumen.** El radar muestra forma, no cantidad. Valor de eje = `sqrt(puntos del eje) / sqrt(puntos del eje mayor)` × 100. La raíz evita que un eje aplaste a los demás.
- **Manipulación.** Las palabras clave no cuentan (regla en C). El tope diario limita la repetición.

### B.3 Evidencia mínima

| Condición | Umbral |
|---|---|
| Mostrar la telaraña | 30 puntos en total y 5 días distintos con puntos |
| Dibujar un eje con valor | 3 puntos en ese eje. Con menos: «sin evidencia todavía» |
| Mostrar el par | Los 2 ejes mayores con 5 puntos cada uno |
| Mostrar un solo arquetipo | Solo el eje mayor llega a 5 puntos |

Antes del umbral, la pantalla muestra el avance: «Llevas 12 de 30 puntos».

### B.4 Límites conocidos

- La radiografía mide cómo la persona usa Claude. No mide a la persona completa.
- Quien solo usa Claude para una tarea de su puesto tendrá un perfil angosto. El texto de pantalla debe decirlo.
- Los umbrales de B.1 y B.3 son valores de arranque. No están calibrados con datos reales [?]. Revisar tras 30 días de uso.

## C. Instrucción para Haiku

Va al final del prompt de sistema del clasificador. Longitud: menos de 1,800 caracteres.

```text
TALENTO. Etiqueta cada prompt. Son consecutivos y de una sola persona.
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
Devuelve por prompt: {"t":"h"|"d"|"c","a":["id","id"]}
```

Nota para el código: el campo `cue` de `talent.ts` es la versión larga de cada señal. Sirve para la pantalla «cómo se mide» y para una calibración con Sonnet. No cabe en esta instrucción.

## D. Fuentes

| Fuente | Qué se tomó | Estado |
|---|---|---|
| WEF, Future of Jobs Report 2025, cap. 3 · https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/ | Habilidades núcleo y de mayor crecimiento | El sitio devolvió 403. Datos tomados de resúmenes de búsqueda y de la fuente siguiente. |
| Plataforma europea Digital Skills and Jobs · https://digital-skills-jobs.europa.eu/en/latest/news/great-skills-reset-wefs-future-jobs-report-2025-catch-22-future-work | Pensamiento analítico n.º 1; curiosidad y aprendizaje permanente en crecimiento | Leída |
| WEF, Future of Jobs Report 2025, cap. 2 · https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/2-jobs-outlook/ | Puestos de mayor crecimiento a 2030 | 403. Lista tomada de Euronews. |
| Euronews, 2025-02-01 · https://www.euronews.com/2025/02/01/jobs-market-at-a-crossroads-which-are-the-fastest-growing-and-declining-jobs | Big Data Specialists, AI and Machine Learning Specialists, Software and Applications Developers, Security Management Specialists, UI and UX Designers, Data Analysts and Scientists | Leída |
| WEF, comunicado · https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/ | 39 % de las habilidades cambia a 2030 | Resumen de búsqueda |
| LinkedIn Jobs on the Rise 2026, vía Dice · https://www.dice.com/career-advice/ai-related-jobs-top-linkedins-fastest-growing-roles-list-for-2026 | AI Engineer, AI Consultant and Strategist, AI Researcher, Quantitative Researcher, Platform Engineer | Leída |
| LinkedIn Jobs on the Rise 2026, resúmenes de búsqueda · https://www.beckershospitalreview.com/workforce/25-fastest-growing-jobs-in-the-us-linkedin | Strategic Advisor, Founder, Sales Executive, Public Affairs Specialist | Resumen de búsqueda. La página devolvió 403. |

### Sin verificar [?]

- Porcentajes del WEF (69 %, 61 %, 57 %, 52 %, 50 %): vienen de resúmenes de búsqueda, no del informe leído [?].
- Habilidades WEF «alfabetización tecnológica», «pensamiento sistémico» y «orientación al servicio»: de memoria [?].
- Roles WEF «Project Manager», «General and Operations Manager» y «Higher Education Teacher» (mayor crecimiento absoluto): de memoria [?].
- Roles sin fuente verificada, tomados del uso en la industria [?]: Forward Deployed Engineer, UX Researcher, Competitive Intelligence Analyst, AI Governance Lead, AI Risk and Compliance Manager, AI Solutions Architect, AI Workflow Designer, AI Operations Manager, Chief AI Officer, AI Adoption Lead, Creative Technologist, AI Content Strategist, Change Management Specialist, Customer Success Manager, Learning and Development Specialist, AI Enablement Lead.
- Ningún informe proyecta puestos para 2027-2028 exactos. WEF proyecta a 2030. LinkedIn mide 2023-2025 [?].
- Títulos de películas en español de México («Misión Rescate», «Sueño de Fuga», «El Origen», «Grandes Héroes», «Gambito de Dama»): de memoria [?].
- William Kamkwamba y Barbara Oakley son menos conocidos en México que el resto de las figuras [?].
