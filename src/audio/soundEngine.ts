/**
 * Self-contained cozy acoustic Web Audio engine (music box / harp + tactile SFX).
 * Unlocks cleanly on first user tap for iOS Safari PWA & Android WebView.
 */

class CozySoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicTimer: number | null = null;
  private musicPlaying = false;
  private noteStep = 0;

  // Warm G-major pentatonic / lydian cozy motif
  private readonly melody = [
    392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 392.0,
    523.25, 659.25, 783.99, 659.25, 587.33, 493.88, 440.0, 493.88
  ];

  constructor() {
    try {
      this.muted = localStorage.getItem('genevieve-audio-muted') === '1';
    } catch {
      this.muted = false;
    }

    if (typeof window !== 'undefined') {
      const unlockOnce = () => {
        if (!this.muted) this.unlock();
      };
      window.addEventListener('touchend', unlockOnce, { passive: true });
      window.addEventListener('pointerdown', unlockOnce, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.muted && this.ctx) {
          this.ctx.resume().catch(() => {});
        }
      });
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('genevieve-audio-muted', this.muted ? '1' : '0');
    } catch {
      // ignore storage errors
    }
    if (this.muted) {
      this.stopMusic();
    } else {
      this.unlock();
      this.startMusic();
    }
    return this.muted;
  }

  public unlock() {
    if (this.muted) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx) {
      const stateStr = this.ctx.state as string;
      if (stateStr === 'suspended' || stateStr === 'interrupted') {
        this.ctx.resume().catch(() => {});
      }
    }
    if (!this.musicPlaying && !this.muted) {
      this.startMusic();
    }
  }

  public startMusic() {
    if (this.muted || this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicTimer = window.setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const freq = this.melody[this.noteStep % this.melody.length];
      this.playPluck(freq, 0.035, 1.35);
      if (this.noteStep % 4 === 0) {
        this.playPluck(freq * 0.5, 0.025, 2.1);
      }
      this.noteStep++;
    }, 680);
  }

  public stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playPluck(freq: number, peakGain: number, duration: number, type: OscillatorType = 'sine') {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  public playTap() {
    this.unlock();
    this.playPluck(520, 0.06, 0.14, 'triangle');
  }

  public playHarvest() {
    this.unlock();
    this.playPluck(587.33, 0.09, 0.22, 'triangle');
    setTimeout(() => this.playPluck(880.0, 0.09, 0.28, 'sine'), 75);
  }

  public playPrepStep(method: 'slice' | 'grind' | 'distill') {
    this.unlock();
    if (method === 'slice') {
      this.playPluck(740, 0.08, 0.12, 'triangle');
    } else if (method === 'grind') {
      this.playPluck(260, 0.09, 0.18, 'triangle');
      setTimeout(() => this.playPluck(330, 0.06, 0.15, 'sine'), 60);
    } else {
      this.playPluck(659.25, 0.07, 0.3, 'sine');
    }
  }

  public playCraftSuccess() {
    this.unlock();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playPluck(n, 0.1, 0.55, 'sine'), idx * 85);
    });
  }

  public playCoin() {
    this.unlock();
    this.playPluck(987.77, 0.09, 0.18, 'sine');
    setTimeout(() => this.playPluck(1318.5, 0.1, 0.38, 'sine'), 80);
  }

  public playBell() {
    this.unlock();
    this.playPluck(1174.66, 0.08, 0.45, 'sine');
    setTimeout(() => this.playPluck(1567.98, 0.06, 0.5, 'sine'), 90);
  }

  public playPurr() {
    this.unlock();
    this.playPluck(310, 0.07, 0.28, 'triangle');
    setTimeout(() => this.playPluck(390, 0.07, 0.32, 'sine'), 110);
  }
}

export const sound = new CozySoundEngine();
