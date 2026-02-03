// ============================================
// Media - Cohérence Cardiaque
// Responsabilités :
//  - Charger la liste des médias (manifest JSON)
//  - Remplir les menus (inhale / exhale / musique)
//  - Lire/stopper les sons + gérer les volumes
//  - Résoudre les chemins (relatifs au projet)
// ============================================

(function () {
  const DEFAULTS = {
    inhale: 'Inhale1.m4a',
    exhale: 'Exhale1.m4a',
    music: 'Music1.mp3',
  };

  function resolveUrl(relPath) {
    return new URL(relPath, document.baseURI).toString();
  }

  function isAudioFile(name) {
    return /\.(mp3|m4a|wav)$/i.test(name || '');
  }

  class MediaManager {
    constructor(ui) {
      this.ui = ui;

      this.manifest = null;

      this.inhaleAudio = null;
      this.exhaleAudio = null;
      this.bgAudio = null;

      this.unlocked = false;
      this.isBackgroundPlaying = false;
    }

    async init() {
      // Load manifest (with fallback)
      this.manifest = await this.loadManifestWithFallback();

      // Populate selects
      this.populateSelects();

      // Restore saved selection or apply defaults
      this.restoreOrApplyDefaults();

      // Apply volume
      this.applyVolumes(this.ui.getSavedVolumes());
    }

    async loadManifestWithFallback() {
      const fallback = {
        inhale: [DEFAULTS.inhale, 'Inhale2.m4a', 'Inhale3.m4a'],
        exhale: [DEFAULTS.exhale, 'Exhale2.m4a', 'Exhale3.m4a'],
        music: [DEFAULTS.music, 'Music2.mp3', 'Music3.mp3'],
      };

      try {
        const res = await fetch(resolveUrl('assets/audio-manifest.json'), { cache: 'no-store' });
        if (!res.ok) return fallback;
        const data = await res.json();
        // sanitize
        const sanitized = {
          inhale: (Array.isArray(data.inhale) ? data.inhale : fallback.inhale).filter(isAudioFile),
          exhale: (Array.isArray(data.exhale) ? data.exhale : fallback.exhale).filter(isAudioFile),
          music: (Array.isArray(data.music) ? data.music : fallback.music).filter(isAudioFile),
        };
        return sanitized;
      } catch (e) {
        console.warn('Manifest audio non chargé, fallback utilisé:', e);
        return fallback;
      }
    }

    populateSelects() {
      const { inhaleSound, exhaleSound, musicSelect } = this.ui;

      const fill = (selectEl, files, { includeNone, noneLabel }) => {
        if (!selectEl) return;
        selectEl.innerHTML = '';
        if (includeNone) {
          const optNone = document.createElement('option');
          optNone.value = 'none';
          optNone.textContent = noneLabel || 'Aucun';
          selectEl.appendChild(optNone);
        }
        files.forEach((f) => {
          const opt = document.createElement('option');
          opt.value = f;
          opt.textContent = f;
          selectEl.appendChild(opt);
        });
      };

      fill(inhaleSound, this.manifest.inhale, { includeNone: true, noneLabel: 'Aucun' });
      fill(exhaleSound, this.manifest.exhale, { includeNone: true, noneLabel: 'Aucun' });

      // Musique : option "Aucune" + liste
      fill(musicSelect, this.manifest.music, { includeNone: true, noneLabel: 'Aucune' });
    }

    restoreOrApplyDefaults() {
      const saved = this.ui.getSavedMediaSelection();

      const pickValid = (savedValue, list, defaultValue) => {
        if (savedValue && list.includes(savedValue)) return savedValue;
        if (savedValue === 'none') return 'none';
        return defaultValue;
      };

      const inhale = pickValid(saved.inhaleSound, this.manifest.inhale, DEFAULTS.inhale);
      const exhale = pickValid(saved.exhaleSound, this.manifest.exhale, DEFAULTS.exhale);
      const music = pickValid(saved.musicTrack, this.manifest.music, DEFAULTS.music);

      if (this.ui.inhaleSound) this.ui.inhaleSound.value = inhale;
      if (this.ui.exhaleSound) this.ui.exhaleSound.value = exhale;
      if (this.ui.musicSelect) this.ui.musicSelect.value = music;

      this.ui.saveMediaSelection({ inhaleSound: inhale, exhaleSound: exhale, musicTrack: music });

      // Preload audio objects (lazy unlock on user gesture)
      this.prepareAudios();
    }

    prepareAudios() {
      const { inhaleSound, exhaleSound, musicSelect } = this.ui;
      const inhaleFile = inhaleSound?.value || DEFAULTS.inhale;
      const exhaleFile = exhaleSound?.value || DEFAULTS.exhale;
      const musicFile = musicSelect?.value || DEFAULTS.music;

      this.inhaleAudio = this.createAudioForSelection('inhale', inhaleFile);
      this.exhaleAudio = this.createAudioForSelection('exhale', exhaleFile);
      this.bgAudio = this.createAudioForSelection('music', musicFile, { loop: true });
    }

    createAudioForSelection(type, selection, { loop = false } = {}) {
      if (!selection || selection === 'none') return null;

      let rel = '';
      if (type === 'inhale') rel = `sounds/inhale/${encodeURIComponent(selection)}`;
      if (type === 'exhale') rel = `sounds/exhale/${encodeURIComponent(selection)}`;
      if (type === 'music') rel = `music/${encodeURIComponent(selection)}`;

      const audio = new Audio(resolveUrl(rel));
      audio.preload = 'auto';
      audio.loop = loop;
      audio.crossOrigin = 'anonymous';

      // Fail-safe: never throw
      audio.addEventListener('error', () => {
        console.warn(`Impossible de charger ${type}:`, selection);
      });

      return audio;
    }

    // Called from Start button (user gesture)
    unlock() {
      if (this.unlocked) return;
      this.unlocked = true;

      // iOS/Chromium sometimes needs a play/pause to unlock.
      // We'll try a minimal safe sequence on background audio.
      if (this.bgAudio) {
        const a = this.bgAudio;
        const prevVol = a.volume;
        a.volume = 0;
        a.play().then(() => {
          a.pause();
          a.currentTime = 0;
          a.volume = prevVol;
        }).catch(() => {
          // Ignore
          a.volume = prevVol;
        });
      }
    }

    applyVolumes({ inhaleVol, exhaleVol, musicVol }) {
      if (this.inhaleAudio) this.inhaleAudio.volume = inhaleVol;
      if (this.exhaleAudio) this.exhaleAudio.volume = exhaleVol;
      if (this.bgAudio) this.bgAudio.volume = musicVol;
    }

    onMediaChanged() {
      // Recreate audios to update src
      this.prepareAudios();
      // Persist selection
      this.ui.saveMediaSelection(this.ui.getMediaSettings());
      // Apply volumes immediately
      this.applyVolumes(this.ui.getMediaSettings());
    }

    onVolumeChanged() {
      this.applyVolumes(this.ui.getMediaSettings());
    }

    async playInhale() {
      if (!this.inhaleAudio) return;
      try {
        this.inhaleAudio.pause();
        this.inhaleAudio.currentTime = 0;
        await this.inhaleAudio.play();
      } catch (e) {
        // Autoplay restrictions - ignore
      }
    }

    async playExhale() {
      if (!this.exhaleAudio) return;
      try {
        this.exhaleAudio.pause();
        this.exhaleAudio.currentTime = 0;
        await this.exhaleAudio.play();
      } catch (e) {
        // ignore
      }
    }

    async startBackground() {
      if (!this.bgAudio) return;
      try {
        this.bgAudio.currentTime = 0;
        await this.bgAudio.play();
        this.isBackgroundPlaying = true;
      } catch (e) {
        this.isBackgroundPlaying = false;
      }
    }

    pauseAll() {
      [this.inhaleAudio, this.exhaleAudio, this.bgAudio].forEach((a) => {
        try { a?.pause(); } catch (_) {}
      });
    }

    resumeBackground() {
      if (!this.bgAudio || !this.isBackgroundPlaying) return;
      this.bgAudio.play().catch(() => {});
    }

    stopAll() {
      if (this.bgAudio) {
        try {
          this.bgAudio.pause();
          this.bgAudio.currentTime = 0;
        } catch (_) {}
      }
      // Stop sfx too
      [this.inhaleAudio, this.exhaleAudio].forEach((a) => {
        try { a?.pause(); a.currentTime = 0; } catch (_) {}
      });
      this.isBackgroundPlaying = false;
    }
  }

  window.CoherenceApp = window.CoherenceApp || {};
  window.CoherenceApp.MediaManager = MediaManager;
})();
