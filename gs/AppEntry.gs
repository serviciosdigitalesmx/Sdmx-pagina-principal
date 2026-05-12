/**
 * AppEntry - puntos de entrada del Web App de Apps Script.
 */

function doGet(e) {
  try {
    return AppEntry_dispatch(e, Router_dispatchGet);
  } catch (error) {
    logError('doGet', error, {});
    return Utils_fail(error && error.message ? error.message : String(error || 'Error'));
  }
}

function doPost(e) {
  try {
    return AppEntry_dispatch(e, Router_dispatchPost);
  } catch (error) {
    logError('doPost', error, {});
    return Utils_fail(error && error.message ? error.message : String(error || 'Error'));
  }
}

function AppEntry_dispatch(e, dispatcher) {
  const params = (e && e.parameter) ? e.parameter : {};
  const responseMode = String(params.responseMode || '').trim().toLowerCase();
  const result = dispatcher(e, function legacyHandler(legacyEvent) {
    if (String((legacyEvent && legacyEvent.parameter && legacyEvent.parameter.action) || '').trim() === 'status') {
      return Utils_ok(Service_getStatus());
    }
    return Utils_fail('Accion no soportada');
  });

  if (responseMode === 'popup') {
    return AppEntry_popupResponse(result, params);
  }
  return result;
}

function AppEntry_popupResponse(result, params) {
  let body = {};
  try {
    body = JSON.parse(result.getContent ? result.getContent() : JSON.stringify(result || {}));
  } catch (e) {
    body = { success: false, error: 'Respuesta invalida del servidor' };
  }
  const html = HtmlService.createHtmlOutput(
    '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>' +
    '(function(){' +
    'var payload = ' + JSON.stringify(body) + ';' +
    'try {' +
    'if (window.opener) {' +
    'window.opener.postMessage({ type: "srfix-login-popup", payload: payload }, "*");' +
    '}' +
    '} finally {' +
    'window.close();' +
    'setTimeout(function(){ document.body.innerText = "Puedes cerrar esta ventana."; }, 50);' +
    '}' +
    '})();' +
    '</script>' +
    '</body></html>'
  );
  return html;
}
