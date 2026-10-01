"use client";

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("whitecard_sound_muted");
        this.muted = stored === "true";
      } catch {
        this.muted = false;
      }
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem("whitecard_sound_muted", String(this.muted));
    } catch {
      // Ignore storage errors
    }
    return this.muted;
  }

  public playTone(freq: number, type: OscillatorType, duration: number, gainVal: number = 0.08) {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  public playFlip() {
    this.playTone(320, "sine", 0.08, 0.04);
  }

  public playPop() {
    this.playTone(440, "sine", 0.05, 0.04);
  }

  public playSuccess() {
    if (this.muted) return;
    this.playTone(523.25, "triangle", 0.1, 0.05); // C5
    setTimeout(() => this.playTone(659.25, "triangle", 0.15, 0.05), 90); // E5
  }

  public playError() {
    if (this.muted) return;
    this.playTone(280, "sawtooth", 0.15, 0.05);
    setTimeout(() => this.playTone(220, "sawtooth", 0.2, 0.05), 100);
  }

  public playScan() {
    this.playTone(880, "sine", 0.06, 0.04);
  }
}

export const sound = new SoundManager();
