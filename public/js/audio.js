// Enhanced Web Audio API Synthesizer with Master Gain & Auto-Resume
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isUnlocked = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
        console.log('AudioContext resumed and unlocked successfully!');
      });
    } else {
      this.isUnlocked = true;
    }
  }

  play(soundId) {
    this.init();
    if (!this.ctx) return;

    try {
      switch (soundId) {
        case 'honk':
          this.playHonk();
          break;
        case 'kaching':
          this.playKaching();
          break;
        case 'cheer':
          this.playCheer();
          break;
        case 'laugh':
          this.playLaugh();
          break;
        case 'fail':
          this.playFail();
          break;
        case 'wheel_tick':
          this.playWheelTick();
          break;
        case 'move_step':
          this.playMoveStep();
          break;
        case 'card_flip':
          this.playCardFlip();
          break;
      }
    } catch (e) {
      console.error('Error playing sound:', soundId, e);
    }
  }

  // 1. Auto-Hupe (Car Horn)
  playHonk() {
    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(430, t);
    osc2.frequency.setValueAtTime(360, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.04);
    gain.gain.setValueAtTime(0.6, t + 0.28);
    gain.gain.linearRampToValueAtTime(0, t + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.38);
    osc2.stop(t + 0.38);
  }

  // 2. Geld / Kasse (Ka-Ching)
  playKaching() {
    const t = this.ctx.currentTime;
    [1046.50, 1318.51, 1567.98, 2093.00].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      gain.gain.setValueAtTime(0.35, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.7);
    });
  }

  // 3. Fanfare / Cheer
  playCheer() {
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.09);

      gain.gain.setValueAtTime(0.4, t + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.6);
    });
  }

  // 4. Lachen / Slapstick Boing
  playLaugh() {
    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const startT = t + i * 0.11;
      osc.frequency.setValueAtTime(260 + (i % 2) * 180, startT);
      osc.frequency.linearRampToValueAtTime(540, startT + 0.08);

      gain.gain.setValueAtTime(0.4, startT);
      gain.gain.linearRampToValueAtTime(0.01, startT + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startT);
      osc.stop(startT + 0.1);
    }
  }

  // 5. Fail / Sad Trombone
  playFail() {
    const t = this.ctx.currentTime;
    const pitches = [392, 370, 349.23, 293.66];
    pitches.forEach((p, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const startT = t + idx * 0.28;
      const dur = idx === 3 ? 0.7 : 0.24;

      osc.frequency.setValueAtTime(p, startT);
      if (idx === 3) {
        osc.frequency.linearRampToValueAtTime(240, startT + dur);
      }

      gain.gain.setValueAtTime(0.35, startT);
      gain.gain.linearRampToValueAtTime(0.01, startT + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startT);
      osc.stop(startT + dur);
    });
  }

  playWheelTick() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(850, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.04);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  playMoveStep() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playCardFlip() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

window.soundEngine = new SoundEngine();

// Auto unlock on first user interaction anywhere on screen
document.addEventListener('click', () => window.soundEngine.init(), { once: false });
document.addEventListener('touchstart', () => window.soundEngine.init(), { once: false });
document.addEventListener('keydown', () => window.soundEngine.init(), { once: false });
