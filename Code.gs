/**
 * DGEA App — Backend (Notificaciones Telegram/Correo + Datos compartidos)
 * -------------------------------------------------------------------------
 * Este script hace DOS cosas para la app DGEA:
 *   1) Reenvía avisos a Telegram y correo (igual que antes).
 *   2) Guarda y entrega los datos de la app (tareas, hojas de ruta, CCTPs,
 *      cronogramas, etc.) en una Google Sheet, para que TODO el equipo
 *      vea la misma información actualizada, no una copia por celular.
 *
 * El token del bot NUNCA se escribe aquí en texto plano: se guarda en
 * "Propiedades del script", que nadie puede ver desde afuera.
 *
 * ── CÓMO INSTALAR ─────────────────────────────────────────
 * 1. Ve a https://script.google.com/ → "Nuevo proyecto".
 * 2. Borra el contenido de "Código.gs" y pega TODO este archivo.
 * 3. Menú lateral ⚙️ "Configuración del proyecto" → "Propiedades del
 *    script" → "Añadir propiedad de script":
 *       Propiedad: TELEGRAM_TOKEN
 *       Valor: <tu token de BotFather>
 *    Guarda. (No hace falta crear la Sheet a mano: el script la crea
 *    sola la primera vez que se usa, y guarda su ID automáticamente).
 * 4. Arriba, "Implementar" → "Nueva implementación":
 *    - Tipo: "Aplicación web"
 *    - Ejecutar como: "Yo (tu correo)"
 *    - Quién tiene acceso: "Cualquier usuario"
 *    "Implementar" → autoriza los permisos que pida Google.
 * 5. Copia la "URL de la aplicación web" (termina en /exec) y pégala en
 *    la app DGEA, botón ⚙️ Ajustes → "URL de Apps Script".
 *
 * Cada vez que cambies este código debes "Implementar → Gestionar
 * implementaciones → editar (lápiz) → Nueva versión" para que se aplique.
 */

var HOJA_NOMBRE = 'DGEA_DATA';

function doPost(e) {
  var resultado = { ok: true };
  try {
    var datos = JSON.parse(e.postData.contents);
    var accion = datos.accion || 'notificar'; // compatibilidad: si no manda 'accion', es una notificación

    if (accion === 'guardarEstado') {
      resultado = guardarEstado(datos);
    } else {
      resultado = notificar(datos);
    }
  } catch (err) {
    resultado.ok = false;
    resultado.error = String(err);
  }

  return ContentService
    .createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.accion === 'obtenerEstado') {
      var out = obtenerEstado();
      return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput('DGEA App – backend activo ✅')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ── NOTIFICACIONES (Telegram + correo) ──────────────────────────────────
function notificar(datos) {
  var resultado = { ok: true, telegram: false, correo: false };
  var mensaje = datos.mensaje || '';
  var chatId = datos.chatId || '';
  var correo = datos.correo || '';
  var asunto = datos.asunto || 'DGEA – Notificación';

  if (chatId && mensaje) {
    try {
      enviarTelegram(chatId, mensaje);
      resultado.telegram = true;
    } catch (errTg) {
      resultado.errorTelegram = String(errTg);
    }
  }
  if (correo && mensaje) {
    try {
      MailApp.sendEmail({ to: correo, subject: asunto, body: mensaje.replace(/\*/g, '') });
      resultado.correo = true;
    } catch (errMail) {
      resultado.errorCorreo = String(errMail);
    }
  }
  return resultado;
}

function enviarTelegram(chatId, mensaje) {
  var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  if (!token) throw new Error('Falta configurar TELEGRAM_TOKEN en Propiedades del script');
  var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  var opciones = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: mensaje, parse_mode: 'Markdown' }),
    muteHttpExceptions: true
  };
  var respuesta = UrlFetchApp.fetch(url, opciones);
  if (respuesta.getResponseCode() !== 200) {
    throw new Error('Telegram respondió ' + respuesta.getResponseCode() + ': ' + respuesta.getContentText());
  }
}

// ── DATOS COMPARTIDOS (sincronización de todo el equipo) ────────────────
function obtenerHoja_() {
  var props = PropertiesService.getScriptProperties();
  var idHoja = props.getProperty('SHEET_ID');
  var libro;
  if (idHoja) {
    try {
      libro = SpreadsheetApp.openById(idHoja);
    } catch (e) {
      libro = null;
    }
  }
  if (!libro) {
    libro = SpreadsheetApp.create('DGEA App – Datos compartidos');
    props.setProperty('SHEET_ID', libro.getId());
  }
  var hoja = libro.getSheetByName(HOJA_NOMBRE);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA_NOMBRE);
    hoja.getRange('A1').setValue('estado_json');
    hoja.getRange('B1').setValue('actualizado');
    hoja.getRange('C1').setValue('usuario');
  }
  return hoja;
}

function guardarEstado(datos) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // evita que dos guardados simultáneos se pisen
  try {
    var hoja = obtenerHoja_();
    var ahora = new Date().toISOString();
    hoja.getRange('A2').setValue(JSON.stringify(datos.estado || {}));
    hoja.getRange('B2').setValue(ahora);
    hoja.getRange('C2').setValue(datos.usuario || '');
    return { ok: true, actualizado: ahora };
  } finally {
    lock.releaseLock();
  }
}

function obtenerEstado() {
  var hoja = obtenerHoja_();
  var valor = hoja.getRange('A2').getValue();
  var actualizado = hoja.getRange('B2').getValue();
  var usuario = hoja.getRange('C2').getValue();
  if (!valor) return { ok: true, estado: null, actualizado: null };
  return {
    ok: true,
    estado: JSON.parse(valor),
    actualizado: actualizado ? new Date(actualizado).toISOString() : null,
    usuario: usuario || ''
  };
}

/**
 * Prueba manual: ejecútala desde el editor (▶ Ejecutar) para verificar
 * que el token de Telegram y el Chat ID funcionan. Reemplaza CHAT_ID_AQUI.
 */
function pruebaManual() {
  enviarTelegram('CHAT_ID_AQUI', '✅ Prueba de conexión desde Apps Script — DGEA App');
}
