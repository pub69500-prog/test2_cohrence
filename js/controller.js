// ============================================
// Controller - Cohérence Cardiaque
// Responsabilités :
//  - Démarrer / Pause / Quitter
//  - Pilotage des phases (inhale / hold / exhale)
//  - Mise à jour du timer + progress + compteurs
// ============================================

(function () {
  class Controller {
    constructor(ui, media) {
      this.ui = ui;
      this.media = media;

      this.running = false;
      this.paused = false;

      this._raf = null;
      this._startPerf = 0;
      this._pauseStartPerf = 0;
      this._pausedAccum = 0;

      this.totalMs = 0;
      this.cycleMs = 0;
      this.inhaleMs = 0;
      this.holdMs = 0;
      this.exhaleMs = 0;

      this.currentPhase = 'idle';
      this.lastCycleIndex = -1;

      this.breaths = 0;
      this.cycles = 0;
    }

    init() {
      // Nothing else for now
    }

    start = async () => {
      if (this.running) return;

      // Hide end screen if visible
      this.ui.hideEndScreen();

      // Unlock audio on user gesture
      this.media.unlock();

      const { durationMin, inhaleSec, holdSec, exhaleSec } = this.ui.getBreathingSettings();
      this.totalMs = durationMin * 60 * 1000;

      this.inhaleMs = inhaleSec * 1000;
      this.holdMs = holdSec * 1000;
      this.exhaleMs = exhaleSec * 1000;
      this.cycleMs = this.inhaleMs + this.holdMs + this.exhaleMs;

      // Update CSS durations so animations match
      if (this.ui.breathingCircle) {
        this.ui.breathingCircle.style.setProperty('--inhale-duration', `${inhaleSec}s`);
        this.ui.breathingCircle.style.setProperty('--exhale-duration', `${exhaleSec}s`);
      }

      // Reset counters
      this.breaths = 0;
      this.cycles = 0;
      this.ui.setCounts(0, 0);

      // Enter fullscreen/session mode
      this.ui.enterSessionMode();
      this.ui.setPauseButtonState(false);

      // Ensure media is up-to-date with current UI selection + volumes
      this.media.onMediaChanged();
      this.media.onVolumeChanged();

      // Start background music (best effort)
      await this.media.startBackground();

      this.running = true;
      this.paused = false;
      this.currentPhase = 'idle';
      this.lastCycleIndex = -1;

      this._startPerf = performance.now();
      this._pausedAccum = 0;

      // Initial timer/progress
      this.ui.setTimer(Math.ceil(this.totalMs / 1000));
      this.ui.setProgress(0);

      this._tick();
    };

    togglePause = () => {
      if (!this.running) return;

      if (!this.paused) {
        this.paused = true;
        this._pauseStartPerf = performance.now();
        this.ui.setPauseButtonState(true);
        this.media.pauseAll();
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = null;
      } else {
        this.paused = false;
        const now = performance.now();
        this._pausedAccum += (now - this._pauseStartPerf);
        this.ui.setPauseButtonState(false);
        this.media.resumeBackground();
        this._tick();
      }
    };

    quit = () => {
      if (!this.running) return;
      this._stopSession({ showEndScreen: false });
    };

    _stopSession({ showEndScreen }) {
      this.running = false;
      this.paused = false;

      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = null;

      this.media.stopAll();

      // Reset UI to main screen
      this.ui.exitSessionMode();

      const durationMin = this.ui.getBreathingSettings().durationMin;
      this.ui.setPhase('idle');
      this.ui.setTimer(durationMin * 60);
      this.ui.setProgress(0);

      if (showEndScreen) this.ui.showEndScreen();
    }

    _phaseFromPos(posMs) {
      if (posMs < this.inhaleMs) return 'inhale';
      if (posMs < this.inhaleMs + this.holdMs) return 'hold';
      return 'exhale';
    }

    _onPhaseEnter(phase) {
      this.ui.setPhase(phase);

      if (phase === 'inhale') {
        this.media.playInhale();
      } else if (phase === 'exhale') {
        this.media.playExhale();
        // Count a breath on exhale start (simple & stable)
        this.breaths += 1;
        this.ui.setCounts(this.cycles, this.breaths);
      }
    }

    _tick = () => {
      if (!this.running || this.paused) return;

      const now = performance.now();
      const elapsed = (now - this._startPerf) - this._pausedAccum;

      if (elapsed >= this.totalMs) {
        this._stopSession({ showEndScreen: true });
        return;
      }

      // Progress / timer
      const remainingMs = this.totalMs - elapsed;
      this.ui.setTimer(Math.ceil(remainingMs / 1000));
      this.ui.setProgress((elapsed / this.totalMs) * 100);

      // Phase computation
      const cycleIndex = Math.floor(elapsed / this.cycleMs);
      const cyclePos = elapsed % this.cycleMs;

      // Cycle count: number of completed cycles
      if (cycleIndex !== this.lastCycleIndex) {
        this.lastCycleIndex = cycleIndex;
        this.cycles = cycleIndex;
        this.ui.setCounts(this.cycles, this.breaths);
      }

      const phase = this._phaseFromPos(cyclePos);
      if (phase !== this.currentPhase) {
        this.currentPhase = phase;
        this._onPhaseEnter(phase);
      }

      this._raf = requestAnimationFrame(this._tick);
    };
  }

  window.CoherenceApp = window.CoherenceApp || {};
  window.CoherenceApp.Controller = Controller;
})();
