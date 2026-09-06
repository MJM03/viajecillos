/* Sincronización compartida: conserva localStorage como respaldo sin conexión. */
(function () {
  const firebaseConfig = {
    apiKey: 'AIzaSyDR9a1wkVlx1k4NqHQ8Gp4DZHWy1ZBFM3E',
    authDomain: 'viajecillos-d57ea.firebaseapp.com',
    projectId: 'viajecillos-d57ea',
    databaseURL: 'https://viajecillos-d57ea-default-rtdb.firebaseio.com',
    storageBucket: 'viajecillos-d57ea.firebasestorage.app',
    messagingSenderId: '28873014473',
    appId: '1:28873014473:web:8308c5a8b617e7d019e118'
  };
  const COLLECTION = 'viajecillosShared';
  const DOCUMENT = 'viaje-norte-lider-2-2026';
  let db, dataRef, applyingRemote = false, initialized = false, syncTimer;

  const localPersistMain = persist;
  const localPersistExtras = persistExtraExpenses;

  function showSyncMessage(message, tone) {
    const el = $('saveMessage');
    if (!el) return;
    el.textContent = message;
    el.dataset.syncTone = tone || '';
  }

  function snapshotData() {
    return {
      schemaVersion: 1,
      saved: JSON.parse(JSON.stringify(saved || {})),
      extraSaved: JSON.parse(JSON.stringify(extraSaved || {})),
      updatedAt: new Date().toISOString()
    };
  }

  function queueSync() {
    if (!initialized || applyingRemote || !dataRef) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      try {
        await dataRef.set(snapshotData());
        showSyncMessage('Guardado y sincronizado en todos los dispositivos.');
      } catch (error) {
        console.warn('No se pudo sincronizar todavía:', error);
        showSyncMessage('Guardado en este dispositivo. Se sincronizará al recuperar conexión.');
      }
    }, 350);
  }

  persist = function () { localPersistMain(); queueSync(); };
  persistExtraExpenses = function () { localPersistExtras(); queueSync(); };

  function applyRemote(data) {
    applyingRemote = true;
    saved = data.saved && typeof data.saved === 'object' ? data.saved : {};
    extraSaved = data.extraSaved && typeof data.extraSaved === 'object' ? data.extraSaved : {};
    localPersistMain();
    localPersistExtras();
    currentIndex = firstPendingIndex();
    renderAll();
    renderExtraExpenses();
    renderExtraSummary();
    applyingRemote = false;
  }

  async function start() {
    try {
      firebase.initializeApp(firebaseConfig);
      db = firebase.database();
      dataRef = db.ref(`${COLLECTION}/${DOCUMENT}`);
      dataRef.on('value', snapshot => {
        if (!snapshot.exists) {
          dataRef.transaction(current => current === null ? snapshotData() : current)
            .then(() => { initialized = true; showSyncMessage('Datos iniciales sincronizados.'); })
            .catch(error => { console.warn('No se pudo crear el registro compartido:', error); showSyncMessage('Tus datos siguen guardados aquí. Falta activar Firebase para sincronizar.'); });
          return;
        }
        applyRemote(snapshot.val());
        initialized = true;
        showSyncMessage('Sincronizado en tiempo real.');
      }, error => {
        console.warn('Firebase no disponible:', error);
        showSyncMessage('Modo local activo. Se sincronizará cuando Firebase esté disponible.');
      });
    } catch (error) {
      console.warn('Firebase no pudo iniciar:', error);
      showSyncMessage('Modo local activo. Firebase aún necesita configurarse.');
    }
  }

  start();
})();
