// ============================================
// UI - Cohérence Cardiaque
// Responsabilités :
//  - Lecture/écriture des réglages (sliders + sélecteurs)
//  - Mise à jour de l'affichage (timer, texte, progress)
//  - Gestion des états d'écran (principal / plein écran)
// ============================================

(function () {
  const STORAGE_KEYS = {
    THEME: 'cc_theme',
    SESSION_DURATION: 'cc_session_duration', // minutes
    INHALE_TIME: 'cc_inhale_time',           // secondes
    HOLD_TIME: 'cc_hold_time',               // secondes
    EXHALE_TIME: 'cc_exhale_time',           // secondes

    INHALE_SOUND: 'cc_inhale_sound_v2',
    EXHALE_SOUND: 'cc_exhale_sound_v2',
    MUSIC_TRACK: 'cc_music_track_v2',

    INHALE_VOLUME: 'cc_inhale_volume',
    EXHALE_VOLUME: 'cc_exhale_volume',
    MUSIC_VOLUME: 'cc_music_volume',
  };

  function clampInt(val, min, max, fallback) {
    const n = parseInt(val, 10);
    if (Number.isFinite(n)) return Math.min(max, Math.max(min, n));
    return fallback;
  }

  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  function setText(el, txt) {
    if (el) el.textContent = String(txt);
  }

  class UI {
    constructor() {
      // Elements
      this.themeToggle = document.getElementById('themeToggle');

      this.breathingZone = document.getElementById('breathingZone');
      this.breathingCircle = document.getElementById('breathingCircle');
      this.breathText = document.getElementById('breathText');

      this.timerDisplay = document.getElementById('timerDisplay');
      this.progressFill = document.getElementById('progressFill');
      this.cycleCountEl = document.getElementById('cycleCount');
      this.breathCountEl = document.getElementById('breathCount');

      this.startBtn = document.getElementById('startBtn');
      this.pauseBtn = document.getElementById('pauseBtn');
      this.quitBtn = document.getElementById('quitBtn');
      this.sessionControls = document.getElementById('sessionControls');

      this.endScreen = document.getElementById('endScreen');
      this.endScreenCloseBtn = document.getElementById('endScreenCloseBtn');

      // Sliders
      this.sessionDuration = document.getElementById('sessionDuration');
      this.inhaleTime = document.getElementById('inhaleTime');
      this.holdTime = document.getElementById('holdTime');
      this.exhaleTime = document.getElementById('exhaleTime');

      // Slider displays
      this.sessionDurationValue = document.getElementById('sessionDurationValue');
      this.inhaleTimeValue = document.getElementById('inhaleTimeValue');
      this.holdTimeValue = document.getElementById('holdTimeValue');
      this.exhaleTimeValue = document.getElementById('exhaleTimeValue');

      // Media selects / volumes
      this.inhaleSound = document.getElementById('inhaleSound');
      this.exhaleSound = document.getElementById('exhaleSound');
      this.musicSelect = document.getElementById('musicSelect');

      this.inhaleVolume = document.getElementById('inhaleVolume');
      this.exhaleVolume = document.getElementById('exhaleVolume');
      this.musicVolume = document.getElementById('musicVolume');

      // Expandable section
      this.soundsHeader = document.getElementById('soundsHeader');
      this.soundsContent = document.getElementById('soundsContent');
      this.soundsSection = document.getElementById('soundsSection');
    }

    init() {
      // Theme
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
      this.applyTheme(savedTheme);
      if (this.themeToggle) {
        this.themeToggle.addEventListener('click', () => {
          const isDark = document.body.classList.toggle('dark-theme');
          localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
          this.updateThemeIcon();
        });
      }

      // Sliders: restore + bind
      this.restoreNumericSettings();
      this.bindSlider(this.sessionDuration, this.sessionDurationValue, STORAGE_KEYS.SESSION_DURATION);
      this.bindSlider(this.inhaleTime, this.inhaleTimeValue, STORAGE_KEYS.INHALE_TIME);
      this.bindSlider(this.holdTime, this.holdTimeValue, STORAGE_KEYS.HOLD_TIME);
      this.bindSlider(this.exhaleTime, this.exhaleTimeValue, STORAGE_KEYS.EXHALE_TIME);

      // Volumes: restore + bind
      this.restoreVolume(this.inhaleVolume, STORAGE_KEYS.INHALE_VOLUME, 70);
      this.restoreVolume(this.exhaleVolume, STORAGE_KEYS.EXHALE_VOLUME, 70);
      this.restoreVolume(this.musicVolume, STORAGE_KEYS.MUSIC_VOLUME, 30);

      // Expandable section toggle
      if (this.soundsHeader && this.soundsContent) {
        this.soundsHeader.addEventListener('click', () => {
          const isExpanded = this.soundsHeader.getAttribute('aria-expanded') === 'true';
          const next = !isExpanded;
          this.soundsHeader.setAttribute('aria-expanded', String(next));
          this.soundsContent.hidden = !next;
          const icon = this.soundsHeader.querySelector('.expandable-icon');
          if (icon) icon.textContent = next ? '−' : '+';
        });
      }

      // Initial timer
      const durationMin = this.getBreathingSettings().durationMin;
      this.setTimer(durationMin * 60);
      this.setProgress(0);
      this.setCounts(0, 0);

      // End screen
      if (this.endScreenCloseBtn) {
        this.endScreenCloseBtn.addEventListener('click', () => this.hideEndScreen());
      }
    }

    bindActions({ onStart, onPauseToggle, onQuit }) {
      if (this.startBtn) this.startBtn.addEventListener('click', onStart);
      if (this.pauseBtn) this.pauseBtn.addEventListener('click', onPauseToggle);
      if (this.quitBtn) this.quitBtn.addEventListener('click', onQuit);
    }

    bindMediaChange({ onInhaleSoundChange, onExhaleSoundChange, onMusicChange, onVolumeChange }) {
      if (this.inhaleSound) this.inhaleSound.addEventListener('change', onInhaleSoundChange);
      if (this.exhaleSound) this.exhaleSound.addEventListener('change', onExhaleSoundChange);
      if (this.musicSelect) this.musicSelect.addEventListener('change', onMusicChange);

      const volumeEls = [this.inhaleVolume, this.exhaleVolume, this.musicVolume].filter(Boolean);
      volumeEls.forEach((el) => el.addEventListener('input', onVolumeChange));
    }

    bindSlider(sliderEl, valueEl, storageKey) {
      if (!sliderEl) return;
      const update = () => {
        setText(valueEl, sliderEl.value);
        localStorage.setItem(storageKey, String(sliderEl.value));
      };
      sliderEl.addEventListener('input', update);
      update();
    }

    restoreNumericSettings() {
      // Restore or defaults
      const duration = clampInt(localStorage.getItem(STORAGE_KEYS.SESSION_DURATION), 1, 30, 5);
      const inhale = clampInt(localStorage.getItem(STORAGE_KEYS.INHALE_TIME), 3, 10, 5);

      // HOLD is new; default 0
      const hold = clampInt(localStorage.getItem(STORAGE_KEYS.HOLD_TIME), 0, 5, 0);
      const exhale = clampInt(localStorage.getItem(STORAGE_KEYS.EXHALE_TIME), 3, 10, 5);

      if (this.sessionDuration) this.sessionDuration.value = String(duration);
      if (this.inhaleTime) this.inhaleTime.value = String(inhale);
      if (this.holdTime) this.holdTime.value = String(hold);
      if (this.exhaleTime) this.exhaleTime.value = String(exhale);
    }

    restoreVolume(sliderEl, storageKey, fallback) {
      if (!sliderEl) return;
      const n = clampInt(localStorage.getItem(storageKey), 0, 100, fallback);
      sliderEl.value = String(n);
      sliderEl.addEventListener('input', () => localStorage.setItem(storageKey, String(sliderEl.value)));
    }

    applyTheme(theme) {
      const isDark = theme === 'dark';
      document.body.classList.toggle('dark-theme', isDark);
      this.updateThemeIcon();
    }

    updateThemeIcon() {
      const icon = this.themeToggle?.querySelector('.theme-icon');
      if (!icon) return;
      icon.textContent = document.body.classList.contains('dark-theme') ? '🌙' : '☀️';
    }

    // ---- Settings access ----
    getBreathingSettings() {
      const durationMin = clampInt(this.sessionDuration?.value, 1, 30, 5);
      const inhaleSec = clampInt(this.inhaleTime?.value, 3, 10, 5);
      const holdSec = clampInt(this.holdTime?.value, 0, 5, 0);
      const exhaleSec = clampInt(this.exhaleTime?.value, 3, 10, 5);

      return { durationMin, inhaleSec, holdSec, exhaleSec };
    }

    getMediaSettings() {
      const inhaleSound = this.inhaleSound?.value || '';
      const exhaleSound = this.exhaleSound?.value || '';
      const musicTrack = this.musicSelect?.value || '';

      const inhaleVol = clampInt(this.inhaleVolume?.value, 0, 100, 70) / 100;
      const exhaleVol = clampInt(this.exhaleVolume?.value, 0, 100, 70) / 100;
      const musicVol = clampInt(this.musicVolume?.value, 0, 100, 30) / 100;

      return { inhaleSound, exhaleSound, musicTrack, inhaleVol, exhaleVol, musicVol };
    }

    // ---- Session screen handling ----
    enterSessionMode() {
      document.body.classList.add('session-running');
      if (this.sessionControls) this.sessionControls.setAttribute('aria-hidden', 'false');
    }

    exitSessionMode() {
      document.body.classList.remove('session-running');
      if (this.breathingZone) this.breathingZone.classList.remove('paused');
      this.setPauseButtonState(false);
      if (this.sessionControls) this.sessionControls.setAttribute('aria-hidden', 'true');
    }

    setPauseButtonState(paused) {
      if (!this.pauseBtn) return;
      this.pauseBtn.textContent = paused ? 'Reprendre' : 'Pause';
      if (this.breathingZone) this.breathingZone.classList.toggle('paused', paused);
    }

    // ---- UI updates ----
    setPhase(phase) {
      // phase: 'inhale' | 'hold' | 'exhale' | 'idle' | 'done'
      if (!this.breathingCircle || !this.breathText) return;

      this.breathingCircle.classList.remove('inhale', 'hold', 'exhale');

      if (phase === 'inhale') {
        this.breathingCircle.classList.add('inhale');
        this.breathText.textContent = 'Inspire';
        this.breathText.classList.add('visible');
      } else if (phase === 'hold') {
        this.breathingCircle.classList.add('hold');
        this.breathText.textContent = 'Pause';
        this.breathText.classList.add('visible');
      } else if (phase === 'exhale') {
        this.breathingCircle.classList.add('exhale');
        this.breathText.textContent = 'Expire';
        this.breathText.classList.add('visible');
      } else if (phase === 'done') {
        this.breathText.textContent = '🌿';
        this.breathText.classList.add('visible');
      } else {
        this.breathText.textContent = '🌿';
        this.breathText.classList.remove('visible');
      }
    }

    setTimer(remainingSeconds) {
      setText(this.timerDisplay, formatTime(remainingSeconds));
    }

    setProgress(percent) {
      if (!this.progressFill) return;
      const p = Math.max(0, Math.min(100, percent));
      this.progressFill.style.width = `${p}%`;
    }

    setCounts(cycles, breaths) {
      setText(this.cycleCountEl, cycles);
      setText(this.breathCountEl, breaths);
    }

    showEndScreen() {
      if (!this.endScreen) return;
      this.endScreen.classList.add('show');
      this.endScreen.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }

    hideEndScreen() {
      if (!this.endScreen) return;
      this.endScreen.classList.remove('show');
      this.endScreen.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }

    // ---- Persistence for media selection (called by Media module) ----
    saveMediaSelection({ inhaleSound, exhaleSound, musicTrack }) {
      if (typeof inhaleSound === 'string') localStorage.setItem(STORAGE_KEYS.INHALE_SOUND, inhaleSound);
      if (typeof exhaleSound === 'string') localStorage.setItem(STORAGE_KEYS.EXHALE_SOUND, exhaleSound);
      if (typeof musicTrack === 'string') localStorage.setItem(STORAGE_KEYS.MUSIC_TRACK, musicTrack);
    }

    getSavedMediaSelection() {
      return {
        inhaleSound: localStorage.getItem(STORAGE_KEYS.INHALE_SOUND) || '',
        exhaleSound: localStorage.getItem(STORAGE_KEYS.EXHALE_SOUND) || '',
        musicTrack: localStorage.getItem(STORAGE_KEYS.MUSIC_TRACK) || '',
      };
    }

    getSavedVolumes() {
      return {
        inhaleVol: clampInt(localStorage.getItem(STORAGE_KEYS.INHALE_VOLUME), 0, 100, 70) / 100,
        exhaleVol: clampInt(localStorage.getItem(STORAGE_KEYS.EXHALE_VOLUME), 0, 100, 70) / 100,
        musicVol: clampInt(localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME), 0, 100, 30) / 100,
      };
    }

    // Helpers exposed
    formatTime = formatTime;
  }

  window.CoherenceApp = window.CoherenceApp || {};
  window.CoherenceApp.UI = UI;
})();
