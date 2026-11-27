// What the hover shows for each dimension: what we observe, four ways to do it and four prompts to paste.
// Plain es-MX for people who are new to Claude; only real controls of the desktop app (Code tab), checked
// against code.claude.com/docs on 2026-11-26. No levels, ratios or internal detail here.
export const GUIDE: Record<string, { measure: string; how: string[]; examples: string[] }> = {
  adopcion: {
    measure: 'Usas Claude la mayoría de tus días de trabajo.',
    how: [
      'Abre Claude al empezar tu día, junto con tu correo.',
      'Llévale primero la tarea que más tiempo te quita.',
      'Deja la app abierta toda la jornada.',
      'Elige una tarea que repites cada semana y hazla siempre con Claude.',
    ],
    examples: [
      'Estos son mis pendientes de hoy en ventas: [lista]. Ordénalos por impacto y dime por cuál empiezo.',
      'Revisa mi agenda de hoy y prepárame un resumen de cada cita con cliente.',
      'Ayúdame a contestar estos 5 correos de clientes de postventa. Te los pego abajo.',
      'Hoy cierro la cobranza de la semana. Dime qué necesito tener listo antes de las 5 pm.',
    ],
  },
  frecuencia: {
    measure: 'Trabajas con Claude en conversación seguida: pides, revisas y ajustas.',
    how: [
      'Pide un primer borrador y corrígelo en el siguiente mensaje.',
      'Contesta en el momento, mientras el tema está fresco.',
      'Haz varios mensajes cortos en lugar de uno gigante.',
      'Si Claude te pregunta algo, respóndele antes de cambiar de tarea.',
    ],
    examples: [
      'Va el primer borrador del mensaje al cliente. Hazlo más corto y con tono más cálido.',
      'Bien. Ahora agrega la fecha de entrega y quita el segundo párrafo.',
      'Casi. El monto correcto es 385,000 MXN. Corrígelo y enséñame la versión final.',
      'Falta la sucursal Norte en la tabla. Agrégala y vuelve a sumar.',
    ],
  },
  jornada: {
    measure: 'Tienes Claude en uso a lo largo de tu jornada, no solo un rato.',
    how: [
      'Usa Claude en la mañana para planear y en la tarde para cerrar.',
      'Regresa a la misma conversación cuando retomes el tema.',
      'Antes de hacer a mano una tarea repetida, prueba hacerla con Claude.',
      'Cierra tu día pidiendo un resumen de lo que quedó pendiente.',
    ],
    examples: [
      'Buenos días. Estas son mis 6 tareas de hoy en cobranza. Ármame el orden del día.',
      'Regreso de la junta. Estas son mis notas. Sácame los acuerdos y quién hace cada uno.',
      'Antes de irme: resume qué quedó pendiente hoy y qué debo retomar mañana primero.',
      'Tengo 20 minutos libres. ¿Qué avanzo de la lista que armamos en la mañana?',
    ],
  },
  sesiones: {
    measure: 'Abres una conversación nueva para cada tema distinto.',
    how: [
      'Usa «+ New» en la barra lateral (Ctrl+N) cuando cambies de tema.',
      'Ponle a cada conversación un nombre que reconozcas después.',
      'No mezcles la cotización de un cliente con el reporte de otro.',
      'Si Claude se confunde con lo anterior, empieza una conversación limpia.',
    ],
    examples: [
      'Tema nuevo: reporte semanal de citas de servicio de la sucursal Centro. Te paso el archivo.',
      'Esta conversación es solo para la campaña de seminuevos de diciembre.',
      'Empiezo de cero: necesito el comparativo de comisiones de noviembre contra octubre.',
      'Nueva tarea de RH: descripción del puesto de asesor de servicio.',
    ],
  },
  profundidad: {
    measure: 'Llevas cada tema hasta terminarlo dentro de la misma conversación.',
    how: [
      'Sigue en la misma conversación hasta tener el resultado que vas a usar.',
      'Pide la versión final en el formato en que la vas a entregar.',
      'Después del borrador, pide revisar cifras, tono y formato por separado.',
      'Antes de cerrar, pregunta qué falta para darlo por terminado.',
    ],
    examples: [
      'Ya tengo el borrador. Ahora revisa que los totales por sucursal cuadren con el archivo.',
      'Conviértelo en una tabla de una página para el director comercial.',
      '¿Qué le falta a este reporte para poder enviarlo hoy?',
      'Último paso: escribe el correo de 3 líneas con el que lo voy a enviar.',
    ],
  },
  consumo: {
    measure: 'Le das a Claude trabajo grande y real: archivos, datos y procesos completos.',
    how: [
      'Adjunta el archivo completo con el botón + en lugar de copiar un pedazo.',
      'Pide el análisis de todo el mes, no de un solo día.',
      'Dale varios documentos juntos y pide que los cruce.',
      'Encárgale el proceso completo, de los datos al entregable.',
    ],
    examples: [
      'Lee estos 3 Excel de ventas y dime qué sucursal vende menos y por qué.',
      'Cruza la cartera vencida con los pagos de noviembre y lista quién sigue sin pagar.',
      'Revisa las 200 encuestas de servicio y agrupa las quejas por causa.',
      'Con estos 40 CV, arma una tabla de candidatos para asesor de ventas con su experiencia.',
    ],
  },
  variedad: {
    measure: 'Le pides a Claude que use herramientas distintas.',
    how: [
      'Pide que lea tus archivos y carpetas en vez de pegarle el texto.',
      'Pide que busque en internet cuando necesites datos actuales.',
      'Pide el resultado como archivo: Excel, PDF o presentación.',
      'Pide que revise una página web y te diga qué encontró.',
    ],
    examples: [
      'Busca en la carpeta Contratos los que vencen este mes y hazme la lista en Excel.',
      'Busca en internet los precios de lista actuales de 3 SUV que compiten con la nuestra.',
      'Convierte este reporte en una presentación de 5 láminas para la junta del lunes.',
      'Abre la página de nuestra sucursal y dime qué datos de contacto están mal.',
    ],
  },
  contexto: {
    measure: 'Le entregas a Claude el archivo o el dato exacto en vez de describirlo.',
    how: [
      'Escribe @ y el nombre del archivo para agregarlo al mensaje.',
      'Arrastra el archivo al cuadro de mensaje o usa el botón +.',
      'Pega la captura de pantalla del error o del reporte.',
      'Di la hoja, la columna o la página donde está el dato.',
    ],
    examples: [
      'Usa @Ventas_noviembre.xlsx, hoja Sucursales, columnas D a F.',
      'Te pego la captura del error que sale al facturar. ¿Qué significa y cómo lo arreglo?',
      'En @Cartera_vencida.xlsx revisa solo los clientes con más de 60 días.',
      'Toma el formato de @Cotizacion_modelo.docx y llénalo con los datos de este cliente.',
    ],
  },
  planificacion: {
    measure: 'Acuerdas con Claude qué se va a hacer antes de que construya algo grande.',
    how: [
      'Pide que te entreviste y que deje el acuerdo escrito en un documento.',
      'Di cómo se ve el trabajo terminado antes de empezar.',
      'Elige «Plan» en el selector de modo, debajo del cuadro de mensaje, para ver la propuesta antes de cualquier cambio.',
      'Revisa el plan, corrige lo que no va y da tu visto bueno.',
    ],
    examples: [
      'Quiero un tablero de cobranza pero no lo tengo claro. Entrevístame y luego escribe la especificación.',
      'Antes de tocar nada, dame el plan en pasos y espera mi visto bueno.',
      'Está terminado cuando el total cuadre con el estado de cuenta. Primero dime cómo lo vas a hacer.',
      'Escribe en un documento qué vamos a construir, qué queda fuera y cómo lo vamos a probar.',
    ],
  },
  skills: {
    measure: 'Usas skills: recetas guardadas que Claude sigue para tareas conocidas.',
    how: [
      'Escribe / en el cuadro de mensaje para ver las skills disponibles.',
      'Elige la skill y escribe tu tarea después.',
      'Pregunta a Claude qué skills tiene para lo que necesitas.',
      'Pide a Claude que convierta en skill un proceso que repites.',
    ],
    examples: [
      '¿Qué skills tienes disponibles para trabajar con Excel y PDF?',
      'Usa la skill de Excel para armar la tabla dinámica de ventas por asesor.',
      'Usa la skill de PDF para juntar estas 6 facturas en un solo archivo.',
      'Guarda como skill los pasos que seguimos para el reporte semanal de postventa.',
    ],
  },
  conectores: {
    measure: 'Usas apps conectadas vía MCP en tu día a día.',
    how: [
      'Haz clic en el botón + junto al cuadro de mensaje y elige Conectores (Connectors).',
      'Conecta primero lo que usas diario: correo, calendario y Drive.',
      'Pide el dato directo de la app en lugar de copiarlo y pegarlo.',
      'Revisa tus apps conectadas en Personalizar (Customize) > Conectores.',
    ],
    examples: [
      'Revisa mi correo de hoy y lista los clientes que esperan respuesta de ventas.',
      'Busca en Drive el reporte de cartera de octubre y compáralo con el de noviembre.',
      'Revisa mi calendario de mañana y prepárame una ficha por cada cita con cliente.',
      'Busca en Drive la política de garantías vigente y resúmela para el equipo de servicio.',
    ],
  },
  conduccion: {
    measure: 'Detienes a Claude y corriges el rumbo cuando ves que se desvía.',
    how: [
      'Mira el primer minuto de trabajo de Claude.',
      'Presiona Esc o el botón de detener en cuanto se desvíe.',
      'Escribe la corrección y presiona Enter; Claude la toma sin perder lo avanzado.',
      'Si ya corregiste dos veces lo mismo, abre una conversación nueva con un mejor mensaje.',
    ],
    examples: [
      'Alto. Solo quiero las sucursales de Guadalajara, no todo el grupo.',
      'Espera: ese archivo es de 2025. Usa el de noviembre de 2026.',
      'No cambies el formato. Solo corrige las cifras de la columna Enganche.',
      'Detente. El reporte es para el director, no para el cliente. Cambia el tono.',
    ],
  },
  escritorio: {
    measure: 'Haces tu trabajo en la app de escritorio de Claude.',
    how: [
      'Abre la app de escritorio en lugar del navegador.',
      'Trabaja en la pestaña Code con la carpeta de tus archivos elegida.',
      'Deja la app anclada en tu barra de tareas.',
      'Usa el botón + para adjuntar archivos de tu computadora.',
    ],
    examples: [
      'Trabaja en mi carpeta Reportes_Postventa y dime qué archivos hay de este mes.',
      'Guarda el resultado como Excel en la misma carpeta, con la fecha de hoy en el nombre.',
      'Revisa todos los PDF de esta carpeta y dime cuáles no tienen firma.',
      'Ordena los archivos de esta carpeta por sucursal y dime cómo quedaron.',
    ],
  },
  delegacion: {
    measure: 'Le pides a Claude repartir el trabajo en agentes que avanzan al mismo tiempo.',
    how: [
      'Pide un agente por sucursal, por marca o por archivo.',
      'Pide que cada agente regrese un resumen corto.',
      'Pide un agente revisor que no haya visto cómo se hizo el trabajo.',
      'Úsalo para trabajo independiente; cuesta más y no da mejor respuesta por sí solo.',
    ],
    examples: [
      'Lanza un agente por sucursal para revisar su cartera vencida y junta todo en una tabla.',
      'Usa agentes en paralelo: uno por cada uno de estos 8 contratos. Resume riesgos de cada uno.',
      'Pide a otro agente que revise este reporte sin ver cómo lo hicimos y liste los errores.',
      'Reparte en agentes: uno analiza ventas, otro postventa, otro cobranza. Dame un resumen de cada uno.',
    ],
  },
  automatizacion: {
    measure: 'Tienes tareas que Claude corre solo, sin que tú las pidas cada vez.',
    how: [
      'Pídelo en el chat: «cada lunes a las 9, haz…».',
      'O abre Programadas (Scheduled) en la barra lateral y crea una tarea nueva.',
      'Escribe en la tarea qué es un buen resultado y a dónde va.',
      'Corre la primera vez con «Run now» y revisa el resultado.',
    ],
    examples: [
      'Cada lunes a las 8, revisa la cartera vencida y déjame el resumen por sucursal.',
      'Todos los días a las 9, lista las citas de servicio de hoy que no están confirmadas.',
      'Cada viernes a las 4 pm, arma el reporte de ventas de la semana contra la meta.',
      'El día 1 de cada mes, compara las comisiones del mes contra el anterior y marca diferencias.',
    ],
  },
  comandos: {
    measure: 'Arrancas tu trabajo repetido con comandos guardados que llamas con /.',
    how: [
      'Escribe / para ver tus comandos y skills.',
      'Pide a Claude guardar como skill las instrucciones que repites.',
      'Ponle un nombre corto que recuerdes.',
      'Úsalo cada vez en lugar de volver a escribir las instrucciones.',
    ],
    examples: [
      '/reporte-semanal sucursal Norte',
      'Guarda estas instrucciones como skill con el nombre /seguimiento-leads.',
      '/cotizacion cliente Juan Pérez, SUV versión intermedia, 20 % de enganche',
      '/cierre-cobranza semana 47',
    ],
  },
  construccion: {
    measure: 'Le enseñas a Claude tu forma de trabajar con reglas y skills que tú escribes.',
    how: [
      'Pide a Claude guardar una regla cuando te corrija lo mismo dos veces.',
      'Escribe solo lo que Claude no puede saber por su cuenta.',
      'Guarda tus procesos de equipo como skills.',
      'Mantén tus instrucciones cortas y borra lo que ya no aplica.',
    ],
    examples: [
      'Agrega a mis instrucciones: las cifras siempre en MXN con separador de miles.',
      'Guarda esta regla: los correos a clientes van de usted y sin tecnicismos.',
      'Crea una skill con los pasos del cierre mensual de cobranza que acabamos de hacer.',
      'Revisa mis instrucciones y dime cuáles ya no hacen falta.',
    ],
  },
  objetivo: {
    measure: 'Dices qué quieres lograr, para qué y quién lo va a usar.',
    how: [
      'Empieza por el resultado que necesitas.',
      'Di para qué decisión o para qué persona es.',
      'Di en qué formato lo vas a usar.',
      'Si quieres la versión completa, dilo: Claude tiende a hacer lo mínimo.',
    ],
    examples: [
      'Necesito un resumen de una página para el director comercial, que decide el bono del mes.',
      'Quiero un mensaje de WhatsApp para recuperar clientes que no vinieron a su cita de servicio.',
      'Arma la comparación de 3 planes de financiamiento para que el cliente elija hoy.',
      'Necesito la lista de vacantes abiertas para presentarla mañana en la junta de gerentes.',
    ],
  },
  contexto_negocio: {
    measure: 'Le das a Claude el contexto que no puede adivinar.',
    how: [
      'Cuenta las decisiones y reglas que solo existen en tu equipo.',
      'Di las restricciones: presupuesto, fechas y políticas.',
      'Di qué ya intentaste y por qué no funcionó.',
      'Di de dónde salen los datos y cuál fuente manda.',
    ],
    examples: [
      'Ya probamos 5 % de descuento y no funcionó: la competencia dio 8 %.',
      'Regla nuestra: ningún seminuevo sale sin revisión de 120 puntos. Tómalo en cuenta.',
      'El presupuesto de la campaña es de 80,000 MXN y debe salir antes del día 15.',
      'Si los datos no coinciden, manda el reporte del sistema de cobranza, no el Excel.',
    ],
  },
  criterios: {
    measure: 'Defines cómo se ve el trabajo terminado antes de empezar.',
    how: [
      'Di una condición que se pueda comprobar.',
      'Da una prueba de pasa o falla que Claude pueda revisar solo.',
      'Pon los límites: largo, formato y qué no debe cambiar.',
      'Da un ejemplo de un resultado que sí te sirve.',
    ],
    examples: [
      'Está listo cuando el total cuadre con el estado de cuenta al peso y quepa en una página.',
      'El mensaje debe tener menos de 60 palabras, incluir la fecha y no mencionar precio.',
      'Termina cuando las 38 sucursales tengan dato; si falta alguna, dime cuál.',
      'Debe quedar igual que este ejemplo: mismas columnas, mismo orden. Te lo adjunto.',
    ],
  },
  edge_cases: {
    measure: 'Anticipas los casos raros antes de que Claude construya.',
    how: [
      'Di qué excepciones conoces de tu operación.',
      'Pregunta a Claude qué casos raros podrían romper el resultado.',
      'Pide que pruebe cada caso y te muestre qué pasó.',
      'Di qué hacer cuando falte un dato.',
    ],
    examples: [
      '¿Qué pasa si un cliente tiene dos créditos o pagó en dólares? Contémplalo.',
      'Hay unidades facturadas en un mes y entregadas en otro. Cuéntalas por fecha de entrega.',
      'Si falta el teléfono del cliente, no lo inventes: ponlo en una lista aparte.',
      'Antes de armar el reporte, dime qué casos raros ves en estos datos.',
    ],
  },
  exploracion: {
    measure: 'Exploras opciones con preguntas abiertas antes de decidir.',
    how: [
      'Pide varias formas de resolverlo antes de elegir una.',
      'Pide pros y contras de cada opción.',
      'Pregunta qué supuestos hay detrás de cada una.',
      'Decide tú y di por qué elegiste esa.',
    ],
    examples: [
      'Dame 3 formas de bajar las citas de servicio perdidas, con pros y contras.',
      '¿Qué opciones tenemos para mover el inventario de más de 90 días?',
      '¿Qué tendría que ser cierto para que convenga abrir los domingos?',
      'Compara llamar, WhatsApp o correo para cobrar. ¿Cuál conviene para cada tipo de cliente?',
    ],
  },
  descubrimiento: {
    measure: 'Reconoces lo que no sabes y le pides a Claude que te pregunte, te explique o te muestre lo que falta.',
    how: [
      'Di con tus palabras qué parte no entiendes.',
      'Pide que te haga preguntas antes de empezar.',
      'Pide que te entreviste cuando todavía no tienes clara la idea.',
      'Pregunta qué te falta considerar antes de decidir.',
    ],
    examples: [
      'Pregúntame lo que necesites antes de armar el reporte de cobranza.',
      'No entiendo por qué bajó el margen de seminuevos. Explícamelo paso a paso con estos datos.',
      'Quiero mejorar el seguimiento de leads y no sé por dónde empezar. Entrevístame antes de proponer algo.',
      '¿Qué no estoy viendo en este plan de comisiones? Dime qué me falta considerar.',
    ],
  },
  verificacion: {
    measure: 'Le pides a Claude evidencia de que el trabajo quedó bien.',
    how: [
      'Pide ver de dónde salió cada cifra.',
      'Pide unas filas de ejemplo que prueben el total.',
      'Pide que revise su resultado contra tu criterio y te muestre la revisión.',
      'Abre el archivo y revisa tú una muestra.',
    ],
    examples: [
      'Muéstrame 5 filas de ejemplo que prueben que el total de cartera es correcto.',
      '¿De qué archivo y de qué columna salió esa cifra de ventas?',
      'Revisa que ningún cliente aparezca dos veces y enséñame cómo lo revisaste.',
      'Compara tu total contra el del reporte oficial y dime la diferencia exacta.',
    ],
  },
  iteracion: {
    measure: 'Cuestionas la respuesta de Claude y la mejoras con correcciones claras.',
    how: [
      'Di qué está mal y por qué.',
      'No repitas la misma orden con otras palabras.',
      'Pide que te explique cómo llegó al resultado.',
      'Si falla dos veces, replantea el problema desde el inicio.',
    ],
    examples: [
      'El total no cuadra porque incluiste las ventas canceladas. Quítalas y vuelve a sumar.',
      'El tono suena a regaño. El cliente no tiene la culpa del retraso. Reescríbelo.',
      '¿Por qué pusiste a la sucursal Sur en último lugar? Explícame el cálculo.',
      'Lo planteé mal: no quiero más leads, quiero que los que hay se atiendan en menos de una hora.',
    ],
  },
  descomposicion: {
    measure: 'Partes un problema grande en pasos o fases.',
    how: [
      'Divide el trabajo en fases con un entregable cada una.',
      'Pide que termine y te muestre una fase antes de seguir.',
      'Di qué depende de qué.',
      'Pide a Claude que proponga las fases si no las tienes claras.',
    ],
    examples: [
      'Fase 1: limpia la base. Fase 2: crúzala con ventas. Fase 3: arma el reporte.',
      'Primero dame solo la lista de clientes duplicados. Después vemos cómo unirlos.',
      'Divide el lanzamiento de la campaña en pasos, con responsable y fecha para cada uno.',
      'Empieza con una sucursal. Si queda bien, lo repetimos en las demás.',
    ],
  },
  precision: {
    measure: 'Nombras el archivo, el dato y el síntoma exactos.',
    how: [
      'Di dónde está el problema: archivo, hoja, fila o pantalla.',
      'Di qué ves y qué esperabas ver.',
      'Usa cifras, fechas y nombres exactos.',
      'Pega el mensaje de error tal como aparece.',
    ],
    examples: [
      'En la fila 42 la fecha sale 1900-01-01; debería ser 2026-11-03.',
      'El reporte dice 118 unidades y el sistema dice 121. Encuentra las 3 que faltan.',
      'En la hoja Comisiones, la columna G suma con IVA y debería ser sin IVA.',
      'Al guardar la orden de servicio 55231 sale el error "folio duplicado". Te pego la captura.',
    ],
  },
  documentacion: {
    measure: 'Dejas por escrito lo aprendido para volver a usarlo.',
    how: [
      'Al terminar, pide un documento con los pasos que funcionaron.',
      'Pide un resumen de entrega para quien siga el trabajo.',
      'Guarda las reglas que descubriste en tus instrucciones.',
      'Di en qué carpeta debe quedar el documento.',
    ],
    examples: [
      'Deja en un documento los pasos que seguimos para repetirlo el mes que viene.',
      'Escribe un resumen de entrega para Laura: qué se hizo, qué falta y dónde están los archivos.',
      'Anota en mis instrucciones lo que aprendimos hoy sobre el reporte de garantías.',
      'Haz una guía de una página para que cualquier asesor repita este proceso.',
    ],
  },
  sops: {
    measure: 'Repites tus procesos con un procedimiento fijo en lugar de improvisar.',
    how: [
      'Pide a Claude que escriba el procedimiento la primera vez que lo hagas bien.',
      'Guárdalo como skill para llamarlo con /.',
      'Usa el mismo procedimiento cada vez.',
      'Actualízalo cuando cambie el proceso.',
    ],
    examples: [
      'Sigue el procedimiento de cierre de mes, paso por paso, igual que la última vez.',
      'Convierte lo que acabamos de hacer en un procedimiento de 6 pasos para entrega de unidades.',
      'Usa mi procedimiento de alta de personal para este nuevo asesor.',
      'Cambió la política de enganche mínimo. Actualiza el procedimiento de cotización.',
    ],
  },
  loops: {
    measure: 'Pides ciclos de hacer, revisar y corregir hasta cumplir una condición.',
    how: [
      'Da la condición que debe cumplirse para terminar.',
      'Pide que revise su resultado y corrija lo que falle.',
      'Pide que te avise solo cuando se cumpla o cuando se atore.',
      'Para revisiones que se repiten, crea una tarea programada.',
    ],
    examples: [
      'Revisa fila por fila y corrige hasta que todas cuadren. Avísame solo si alguna no se puede.',
      'Compara cada factura contra su orden de servicio y sigue hasta que no haya diferencias.',
      'Corrige el reporte y vuelve a revisar los totales hasta que coincidan con el sistema.',
      'Cada hora, revisa si ya llegaron los pagos pendientes y actualiza la lista.',
    ],
  },
  recursividad: {
    measure: 'Usas a Claude para revisar y mejorar el trabajo de Claude.',
    how: [
      'Pide que critique su propia respuesta desde el punto de vista de quien la recibe.',
      'Pide un agente revisor que no haya visto la conversación.',
      'Pide a Claude que mejore tu mensaje antes de usarlo.',
      'Abre otra conversación para revisar el resultado con ojos nuevos.',
    ],
    examples: [
      'Critica tu respuesta como lo haría el director financiero y mejórala.',
      'Pide a otro agente que revise esta propuesta sin contexto y liste sus puntos débiles.',
      'Mejora este mensaje mío para que la próxima vez te pida mejor el reporte.',
      'Revisa esta cotización como si fueras el cliente. ¿Qué dudas te quedan?',
    ],
  },
  generalizacion: {
    measure: 'Conviertes un caso resuelto en una solución que sirve para otros casos.',
    how: [
      'Pide la versión que funcione para cualquier sucursal o marca.',
      'Separa lo que cambia de un caso a otro de lo que se queda igual.',
      'Pruébala con un segundo caso distinto.',
      'Guárdala como skill o plantilla para tu equipo.',
    ],
    examples: [
      'Hazlo para que funcione con cualquier sucursal, no solo con la del Centro.',
      'Convierte este mensaje en plantilla: deja espacios para nombre, unidad y fecha.',
      'Este análisis de cobranza, ¿sirve igual para postventa? Adáptalo.',
      'Prueba la misma fórmula con los datos de otra marca y dime si se rompe.',
    ],
  },
  kpis: {
    measure: 'Nombras los indicadores que mueven tu área y cómo están hoy.',
    how: [
      'Di el indicador por su nombre, con su valor de hoy.',
      'Di la meta y la fecha.',
      'Relaciona tu indicador con el de la empresa.',
      'Pide el trabajo en función de ese indicador.',
    ],
    examples: [
      'Mi indicador es tiempo de respuesta a leads: hoy 6 horas, la meta es 1 hora.',
      'En cobranza medimos cartera vencida a más de 60 días: hoy es 12 %.',
      'En postventa cuidamos la retención de clientes al segundo servicio: vamos en 48 %.',
      'En RH medimos la rotación de asesores a 90 días. Ayúdame a bajarla.',
    ],
  },
  metrica_exito: {
    measure: 'Dices qué indicador debe moverse con el trabajo.',
    how: [
      'Di qué número debe cambiar si esto funciona.',
      'Ponle meta y plazo.',
      'Di cómo y dónde lo vas a medir.',
      'Si no sabes cuál indicador usar, pregúntale a Claude.',
    ],
    examples: [
      'Esto sirve si la cartera vencida a 90 días baja de 9 % a 6 % en enero.',
      'La campaña funciona si llegan 150 leads calificados antes del día 30.',
      'El nuevo guion sirve si las citas confirmadas suben de 60 % a 75 %.',
      '¿Con qué indicador debería medir si este cambio de horario funcionó?',
    ],
  },
  linea_base: {
    measure: 'Sabes cómo está hoy el número antes de cambiar algo.',
    how: [
      'Pide medir el estado actual antes de proponer cambios.',
      'Di de qué fuente sale el dato.',
      'Guarda ese número con su fecha.',
      'Usa el mismo cálculo cuando vuelvas a medir.',
    ],
    examples: [
      'Antes de cambiar el proceso, dime cuántos días tarda hoy una factura en cobrarse.',
      'Calcula con este archivo cuántos leads se atendieron en menos de una hora en octubre.',
      '¿Cuál es hoy el tiempo promedio de entrega de una unidad, según el reporte del sistema?',
      'Guarda este dato como punto de partida: 62 % de citas confirmadas al 26 de noviembre.',
    ],
  },
  roi: {
    measure: 'Comparas el esfuerzo contra el beneficio antes de hacer algo.',
    how: [
      'Di cuánto tiempo o dinero cuesta hoy.',
      'Di cuánto costaría hacerlo.',
      'Pide comparar opciones por lo que regresan.',
      'Di los supuestos que usas.',
    ],
    examples: [
      'Este reporte me toma 4 horas a la semana. Si lo automatizamos en 2 horas, ¿cuándo se paga?',
      'Compara: contratar un asesor más o mejorar el seguimiento. ¿Cuál da más ventas por peso gastado?',
      'La campaña cuesta 80,000 MXN. ¿Cuántas unidades debe vender para pagarse?',
      'Si bajamos 10 minutos por orden de servicio, ¿cuántas órdenes más caben al mes?',
    ],
  },
  prioridad: {
    measure: 'Eliges qué hacer primero por su impacto en el negocio.',
    how: [
      'Lista tus pendientes y pide ordenarlos por impacto.',
      'Di qué indicador importa más este mes.',
      'Pide el esfuerzo de cada uno.',
      'Decide qué no vas a hacer.',
    ],
    examples: [
      'De estas 5 tareas, ¿cuál mueve más la venta del mes? Empecemos por esa.',
      'Ordena estos pendientes por impacto en cobranza y esfuerzo. Dime cuáles puedo soltar.',
      'Tengo 3 horas hoy. ¿Qué hago primero para acercarme a la meta de entregas?',
      'De estas 12 quejas de servicio, ¿cuáles 3 afectan a más clientes?',
    ],
  },
  cierre: {
    measure: 'Vuelves a medir el resultado real después del cambio.',
    how: [
      'Regresa con el dato nuevo cuando pase el plazo.',
      'Compáralo con el número de antes.',
      'Pregunta qué explica la diferencia.',
      'Decide si sigues, ajustas o lo dejas.',
    ],
    examples: [
      'Ya pasó un mes. Compara el tiempo de cobro de hoy contra el de antes del cambio.',
      'La campaña cerró con 132 leads; la meta era 150. ¿Qué ajustamos para la siguiente?',
      'Las citas confirmadas subieron de 60 % a 71 %. ¿Seguimos con el guion o lo cambiamos?',
      'Mide otra vez la rotación a 90 días con los datos de este corte y compárala.',
    ],
  },
}
