# Checklist «Tu Claude Score» (x100-masters) — comentarios de Tomás

Fuente única de lo que Tomás pidió para la pantalla. Cada subagente la lee completa antes de tocar código.
Mod en desarrollo: `plugins/x100-masters/` (espejo del dev-mod local).

## Vigentes desde 0.5.0 (ya construidos, no romper)

- Nivel real = máximo recurrente (4 veces en 45 días, 2 de ellas en 10 días seguidos, memoria 120 días). Momento actual = últimos 10 días.
- Curva ácida: un 80 crudo se ve como ~72.
- Correos nunca salen de la máquina: hash sha256. Empresa por organización + dominios.
- Pestañas grandes. Burbujas de ayuda (ⓘ) en encabezados. Nombre «Spiderweb Charts». Punto del Master del grupo en cada eje.
- Nombre de ranking automático por empresa («Ranking ISMO Motors»).
- La pestaña Ranking es IDÉNTICA para todos. Solo admins (owner, primary_owner, admin; por rol, nunca por nombre) ven, DEBAJO de la tabla, el Spiderweb del equipo y pueden hacer clic en una fila para ver el detalle de esa persona.
- Coronita 👑 a licencia premium.
- Banner arriba del prompt: [telaraña grande] [↗] «Tu Claude Score» [ícono con celebración o consejo].
- Consejos (empujones) con Sonnet una vez al día sobre lo de ayer; empuje fuerte a criterios de verificación y definición de terminado, artefactos, tareas programadas y automatizaciones.
- Radiografía de talento: 10 arquetipos + Learner; evita 4 sesgos (delegación, rutina, Learner, fuera de horario); gamificación (superpoder híbrido, referentes, zona de genio vs punto ciego, socio ideal, rutina, roles 2027).

## Ronda 2026-11-27 (publicada en 0.5.0–0.5.4)

1. Los hover siempre muestran «Cómo hacerlo» y ejemplos, aunque el puntaje sea 0 o 1. Nunca se truncan ni quedan tapados por el borde.
2. Nueva dimensión `memoria` en Sistematización: eventos que la persona guarda en memoria. Cada recomendación pertenece a su categoría (en Herramienta: skills, conectores, artefactos, tareas programadas y funciones del producto).
3. Nombres de dimensión de una palabra: Herramienta: Adopción, Frecuencia, Jornada, Profundidad, Consumo, Variedad, Skills, Conectores, Escritorio, Móvil, Artefactos, Nube. Estructura: Referencias, Especificación, Conducción, Objetivo, Contexto, Criterios, Excepciones, Exploración, Descubrimiento, Verificación, Iteración, Descomposición, Precisión. Sistema: Delegación, Automatización, Comandos, Sistematiza, Memoria, Documentación, SOPs, Loops, Recursividad, Generalización. Valor: KPIs, Meta, Base, Retorno, Prioridad, Cierre.
4. Fusionar el recuadro del ADN de talento con el recuadro del Spiderweb de la radiografía (una sola caja).
5. Un color y un ícono animado por arquetipo (`hooks/icons.ts`, bucle 5 s, estilo suave y mate del design system 100x, nunca neón). Van frente al ADN y frente a cada nombre de arquetipo en el Spiderweb.
6. Nivel real y Momento actual del mismo tamaño, con una animación de puntitos que viajan entre los dos.
7. Columna oculta (se enciende en el selector de columnas) con el consumo de tokens del propio mod, para vigilar costo. Solo admins reciben ese dato.
8. Título «Tu ADN de talento» grande y visible, igual de grande el resultado (nombre del par).
9. Tabla de ranking sin barra de scroll horizontal: un ícono que al hover desplaza la tabla; columnas # y Persona fijas.
10. Top 50 por defecto; flecha abajo para mostrar 50 más y otra al lado para mostrar todo. Sutiles y con movimiento.
11. Nombre con apellido si se deduce (fullName o parte local del correo); si no, nombre con iniciales.
12. Ranking: filtrar y ordenar por cada encabezado, reordenar columnas arrastrando, elegir columnas, y una columna con el arquetipo / ADN de talento (ícono + nombre del par).
13. En «Mi nivel», bajo el ADN: «¿Quién sería tu compañero ideal?» con 5 personas y «¿Quién sería tu maestro ideal?» con 3 personas.
14. Bajo el Spiderweb del equipo (admins): campana de Gauss con la distribución del talento del equipo.
15. Filtros arriba del Ranking: por categoría, por las 41 dimensiones, por una dimensión y por top / mid / low performers. Los mismos filtros aplican a la tabla, al Spiderweb del equipo y a la campana.
16. Íconos: no neón ni brillantes; estilo suave y pacífico pero con movimiento y dimensión del design system 100x.

## Ronda 2026-11-28 (pendiente, 4 hilos en paralelo; nadie publica, Claude integra)

Hilo A · Portal y pantallas (dueño de `hooks/visuals.ts`, `hooks/guide.ts` y `openReport` en `register.tsx`)
- A1. El portal pasa de 4 MB y la app rechaza la escritura (`$.fs.write` límite 4 194 304 bytes; hoy 5 MB con 17 personas). Que nunca pase en ninguna computadora, crezca el equipo lo que crezca: partir en varios archivos (página + datos por persona bajo demanda) o adelgazar, con una prueba que falle si un archivo pasa de ~3,5 MB con un equipo sintético de 300 personas.
- A2. Títulos de los Spiderweb: «CUÁNTO Y CÓMO USAS CLAUDE», «CÓMO ESTRUCTURAS Y ELABORAS», «SISTEMATIZACIÓN, AUTOMATIZACIÓN Y RECURSIVIDAD», «¿SABES ENCONTRAR VALOR DE NEGOCIO?» (no «SPIDERWEB CHART · USO DE LA HERRAMIENTA»).
- A3. Radiografía de talento: quitar el título chico «Radiografía de talento» y pasar su ⓘ a «Tu ADN de talento»; «Tu ADN de talento» al 50 % de su tamaño actual, como título principal. Quitar «SPIDERWEB CHART · RADIOGRAFÍA DE TALENTO / Pasa el cursor por cada eje…». En ese lugar, lado a lado: «Tu superpoder» (antes zona de genio) y «Tu kriptonita» (antes punto ciego).
- A4. Instalación solo personal (sin empresa dada de alta): sin barra de pestañas; no se ven «Mi nivel» ni «Ranking», solo el contenido de Mi nivel.
- A5. Ranking: quitar el párrafo bajo el título (solo el título). Quitar textos de la barra de filtros («Medir por», «Top desde», «Low hasta»). Flecha animada hacia abajo después de la tabla, solo owners y admins (hay Spiderweb y campana debajo). Debajo de la tabla, dos botones lado a lado «Mostrar más» y «Mostrar todo». ADN = tercera columna (después de Nivel real y Nivel momentáneo). Columna «Momento» → «Nivel momentáneo».
- A6. Licencia premium (Pro/Max, cualquiera no estándar): un punto minúsculo frente al nombre, sin texto. Coronita 👑 solo al #1 en Nivel real y otra al #1 en Nivel momentáneo.
- A7. Spiderweb del equipo (admins): filtro adicional por arquetipo.
- A8. Campana de Gauss del mismo alto que el Spiderweb del equipo (campana + puntitos). Funcional completa: mismos filtros y desgloses que el Spiderweb, varias formas de verla, accionable (clic en un tramo o un punto lleva a las personas).
- A9. Filtros con jerarquías (categoría › dimensión; luego área › subárea del hilo D) con un registro de filtros enchufable para que el hilo D agregue «Áreas de negocio».

Hilo B · Instalador sin versión (dueño de `deploy/`, `scripts/`, `.claude-plugin/marketplace.json` de la raíz, README y guías 0C/0D)
- B1. Managed settings no debe cambiar al publicar una versión: marketplace que sigue al repo (fuente github o url) con actualización automática; publicar = subir la versión en `plugin.json` y hacer push/release.

Hilo C · Alta por dominio (dueño de `deploy/sql/0007_*` y de la parte de identidad/registro de `register.tsx`)
- C1. Entra al ranking cualquier persona con correo de un dominio de la empresa, aunque use plan personal fuera del Team (otra organización).

Hilo D · Áreas de negocio (dueño de archivos nuevos `hooks/areas*.ts` y `deploy/sql/0008_*`; en `visuals.ts` y `register.tsx` solo bloques marcados `// areas:`)
- D1. Medir áreas de expertise con todo el historial (experiencia pura): primer cálculo profundo, luego cada 50 prompts. Responde dos cosas: si la persona hace ese tipo de trabajo y si piensa o puede ser apta para esa área. Fuerte en todas o en pocas: especialista o generalista.
- D2. Barras horizontales por área y subárea que crecen. Visible al final de Mi nivel, en el Ranking (columna y filtro), como filtro jerárquico en Spiderweb y campana del equipo, y vista consolidada del equipo (mismas barras) para admins.
- D3. Áreas: Growth & Marketing (Growth Hacking & Experimentación, Generación de Demanda, Brand & Comms, Content & Community, Performance Marketing) · Ventas y Revenue (RevOps, Prospección, Closing / Cierre de Ventas, Desarrollo de Negocios y Alianzas, Customer Success, CX Experiencia del Cliente) · Producto y Diseño (Gestión de Producto, Product Ops, UX/UI Design) · Ingeniería, Tecnología y Data (Desarrollo de Software, Infra Cloud & DevOps, Infra Física y Redes, Cyber & InfoSec, Ciencia de Datos e IA, Business Intelligence & Analytics) · Operaciones y Logística (BizOps, Suministro y Logística, Fulfillment, Compras y Abastecimiento) · Talento y Cultura (People Ops, Adquisición de Talento, Branding y Endomarketing, Aprendizaje y Desarrollo, Experiencia del Empleado) · Finanzas, Legal y Estrategia (FP&A, Contabilidad e Impuestos, Estrategia Corporativa, Legal Riesgo y Cumplimiento, Relación con Inversionistas) · R&D (UXR Consumidor y Usuario, Mercado y Competencia, Tecnológica y Prototipado, IA y Ciencia Aplicada, Producto e Innovación, Nuevos Modelos de Negocio, Nuevas Fuentes de Ingresos).

## Estilo (design system 100x, tema oscuro)

Papel `#0D0E11`, tarjeta `#15171A`, tinta `#E6E8EA`, línea `#24272A`, acento azul `#6D92D6` (≤ 1 %), amarillo mate `#E9D25B` (≤ 0,4 %, decorativo), familia mate para series. Sin sombras, sin degradados fuera del objeto firma, sin neón. El movimiento explica un cambio de estado o da vida suave; respeta `prefers-reduced-motion`. Curva `cubic-bezier(.16,1,.30,1)`, duraciones 180 / 320 / 560 ms.
