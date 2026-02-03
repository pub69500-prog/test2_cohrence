// ============================================
// Bootstrap - Cohérence Cardiaque
// Rôle : câbler UI / Media / Controller
// ============================================

(function () {
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    // Service worker: register
    navigator.serviceWorker.register('./sw.js').catch((e) => {
      console.warn('Service Worker non enregistré:', e);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const UI = window.CoherenceApp.UI;
    const MediaManager = window.CoherenceApp.MediaManager;
    const Controller = window.CoherenceApp.Controller;

    const ui = new UI();
    ui.init();

    const media = new MediaManager(ui);
    await media.init();

    const controller = new Controller(ui, media);
    controller.init();

    ui.bindActions({
      onStart: controller.start,
      onPauseToggle: controller.togglePause,
      onQuit: controller.quit,
    });

    ui.bindMediaChange({
      onInhaleSoundChange: () => media.onMediaChanged(),
      onExhaleSoundChange: () => media.onMediaChanged(),
      onMusicChange: () => media.onMediaChanged(),
      onVolumeChange: () => media.onVolumeChanged(),
    });

    // Close end screen also returns to main screen already
    // (UI.close is wired in ui.init)

    registerServiceWorker();
  });
})();
