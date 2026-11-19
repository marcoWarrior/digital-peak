// ─────────────────────────────────────────────────────────────────────────
//  audio.js — Digital Peak · Versione D "Peak Run"
//  Motore audio procedurale Web Audio API (zero asset esterni):
//  Pad synth-sunset dinamico, onde oceaniche filtrate, scia di surf,
//  accordi cristallini sui Data Node, sub-drop sugli ostacoli e warp whoosh.
// ─────────────────────────────────────────────────────────────────────────
(function (global) {
  'use strict';

  const SCALE = [293.66, 349.23, 440.0, 523.25, 587.33, 659.25, 698.46, 880.0, 1046.5, 1174.66]; // D Dorian / Synthwave

  class Soundscape {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.master = null;
      this.padFilter = null;
      this.oceanFilter = null;
      this.oceanGain = null;
      this.carveGain = null;
    }

    init() {
      if (this.ctx) return true;
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return false;
      try {
        const ctx = new AC();
        this.ctx = ctx;

        const master = ctx.createGain();
        master.gain.value = 0.0001;
        master.connect(ctx.destination);
        this.master = master;

        // 1. Pad Synth-Sunset (Dm9 caldo e cinematografico)
        const padFilter = ctx.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.value = 420;
        padFilter.Q.value = 1.6;

        const padGain = ctx.createGain();
        padGain.gain.value = 0.16;
        padFilter.connect(padGain);
        padGain.connect(master);
        this.padFilter = padFilter;

        const freqs = [73.42, 146.83, 220.0, 261.63, 329.63]; // D2, D3, A3, C4, E4
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          osc.type = idx < 2 ? 'sawtooth' : 'triangle';
          osc.frequency.value = f;
          osc.detune.value = (idx - 2) * 7;
          const g = ctx.createGain();
          g.gain.value = idx === 0 ? 0.28 : 0.16;
          osc.connect(g);
          g.connect(padFilter);
          osc.start();
        });

        // 2. Oceano procedurale + scia sulla tavola
        const bufSize = ctx.sampleRate * 2;
        const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufSize; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + w * 0.029;
          b1 = 0.985 * b1 + w * 0.032;
          b2 = 0.950 * b2 + w * 0.048;
          data[i] = (b0 + b1 + b2 + w * 0.015) * 0.35;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        noise.loop = true;

        const oceanFilter = ctx.createBiquadFilter();
        oceanFilter.type = 'bandpass';
        oceanFilter.frequency.value = 340;
        oceanFilter.Q.value = 0.7;

        const oceanGain = ctx.createGain();
        oceanGain.gain.value = 0.12;

        noise.connect(oceanFilter);
        oceanFilter.connect(oceanGain);
        oceanGain.connect(master);
        noise.start();

        this.oceanFilter = oceanFilter;
        this.oceanGain = oceanGain;
        return true;
      } catch (_) {
        return false;
      }
    }

    toggle(forceState) {
      const next = typeof forceState === 'boolean' ? forceState : !this.enabled;
      if (next && !this.ctx) {
        if (!this.init()) return false;
      }
      if (!this.ctx) return false;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.enabled = next;
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(next ? 0.55 : 0.0001, now, 0.18);
      if (next) this.playGate();
      return this.enabled;
    }

    update(speedNorm, steerAmount, time) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const s = Math.max(0, Math.min(1, speedNorm || 0));
      const c = Math.max(0, Math.min(1, steerAmount || 0));
      const swellLfo = 0.5 + 0.5 * Math.sin(time * 0.85);

      if (this.padFilter) {
        this.padFilter.frequency.setTargetAtTime(360 + s * 1150 + swellLfo * 110, now, 0.08);
      }
      if (this.oceanFilter && this.oceanGain) {
        this.oceanFilter.frequency.setTargetAtTime(260 + swellLfo * 240 + s * 680 + c * 520, now, 0.08);
        this.oceanGain.gain.setTargetAtTime(0.08 + swellLfo * 0.05 + s * 0.12 + c * 0.08, now, 0.08);
      }
    }

    playNode(combo) {
      if (!this.enabled || !this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const idx = Math.min(SCALE.length - 2, Math.max(0, (combo || 1) - 1));
      const f1 = SCALE[idx];
      const f2 = SCALE[idx + 1];

      [f1, f2].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.045);
        g.gain.setValueAtTime(0.001, now + i * 0.045);
        g.gain.exponentialRampToValueAtTime(0.18, now + i * 0.045 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.045 + 0.34);
        osc.connect(g);
        g.connect(this.master);
        osc.start(now + i * 0.045);
        osc.stop(now + i * 0.045 + 0.36);
      });
    }

    playGate() {
      if (!this.enabled || !this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      [293.66, 440.0, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 0.98, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.42);
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.11 / (i + 1), now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0008, now + 0.52);
        osc.connect(g);
        g.connect(this.master);
        osc.start(now);
        osc.stop(now + 0.55);
      });
    }

    playHit() {
      if (!this.enabled || !this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(135, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);
      g.gain.setValueAtTime(0.24, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.32);
    }

    playWarp() {
      if (!this.enabled || !this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.28);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.65);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.15, now + 0.14);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.68);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.7);
    }

    playTick() {
      if (!this.enabled || !this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.035);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.04);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.045);
    }
  }

  global.DPAudio = { Soundscape };
})(window);
