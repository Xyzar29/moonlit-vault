// Moonlit Vault — sound, all synthesized with WebAudio (no audio files).
// Footsteps tick softly so the player hears their own noise, a rising
// heartbeat tracks the nearest guard's suspicion, and short chimes mark the
// gem, the loot and the alarm. Sound starts on the first click or keypress,
// as browsers require, and M or the speaker button mutes it.

export class SoundKit {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.heartbeatTimer = 0;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type = 'sine', gain = 0.08, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noiseBurst(dur, gain = 0.05, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    src.connect(filter).connect(g).connect(this.ctx.destination);
    src.start(t0);
  }

  footstep() {
    this.noiseBurst(0.05, 0.035);
  }

  coin() {
    this.tone(1320, 0.09, 'triangle', 0.06);
    this.tone(1760, 0.14, 'triangle', 0.05, null, 0.06);
  }

  gem() {
    this.tone(880, 0.12, 'sine', 0.07);
    this.tone(1108, 0.12, 'sine', 0.07, null, 0.1);
    this.tone(1479, 0.22, 'sine', 0.07, null, 0.2);
  }

  suspicion() {
    this.tone(392, 0.1, 'square', 0.03);
  }

  alarm() {
    this.tone(660, 0.16, 'sawtooth', 0.07, 440);
    this.tone(660, 0.16, 'sawtooth', 0.07, 440, 0.2);
  }

  caught() {
    this.tone(220, 0.5, 'sawtooth', 0.08, 110);
  }

  levelClear() {
    this.tone(523, 0.12, 'triangle', 0.06);
    this.tone(659, 0.12, 'triangle', 0.06, null, 0.1);
    this.tone(784, 0.12, 'triangle', 0.06, null, 0.2);
    this.tone(1046, 0.3, 'triangle', 0.06, null, 0.3);
  }

  // danger is 0..1 (the highest guard awareness): heartbeat speeds up with it.
  updateHeartbeat(dt, danger) {
    if (!this.ctx || this.muted || danger < 0.35) return;
    this.heartbeatTimer -= dt;
    if (this.heartbeatTimer <= 0) {
      this.heartbeatTimer = 1.05 - danger * 0.55;
      this.tone(58, 0.1, 'sine', 0.12);
      this.tone(52, 0.09, 'sine', 0.09, null, 0.14);
    }
  }
}
