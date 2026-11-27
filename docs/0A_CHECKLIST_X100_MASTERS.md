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

## Ronda 2026-11-27 (pendiente)

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

## Estilo (design system 100x, tema oscuro)

Papel `#0D0E11`, tarjeta `#15171A`, tinta `#E6E8EA`, línea `#24272A`, acento azul `#6D92D6` (≤ 1 %), amarillo mate `#E9D25B` (≤ 0,4 %, decorativo), familia mate para series. Sin sombras, sin degradados fuera del objeto firma, sin neón. El movimiento explica un cambio de estado o da vida suave; respeta `prefers-reduced-motion`. Curva `cubic-bezier(.16,1,.30,1)`, duraciones 180 / 320 / 560 ms.
