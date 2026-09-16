import { SCORES, EFFECTS } from './scores.js';

/** Native WebAudio rendering of the original MIDI note events. */
export class RetroAudio {
  constructor() {
    this.scene = 'explore';
    this.muted = false;
    this.paused = false;
    this.started = false;
    this.disposed = false;
    this.context = null;
    this._timer = null;
    this._voices = new Set();
    this._index = 0;
    this._cycle = 0;
    this._epoch = 0;
    this._exhausted = false;
  }

  async start() {
    if (this.disposed) return false;
    if (!this.context) {
      const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextClass) return false;
      try {
        // Context creation happens synchronously within the calling gesture.
        this.context = new AudioContextClass({ latencyHint: 'interactive' });
        this._buildGraph();
        this._resetScore();
      } catch (_) { return false; }
    }
    this.paused = false;
    try {
      if (this.context.state !== 'running') await this.context.resume();
    } catch (_) { return false; }
    if (this.disposed) return false;
    this.started = true;
    if (!this._timer) this._timer = setInterval(() => this._tick(), 35);
    this._tick();
    return this.context.state === 'running';
  }

  setScene(name) {
    if (!SCORES[name] || name === this.scene || this.disposed) return;
    this.scene = name;
    if (this.context) {
      this._stopVoices('music', .075);
      this._resetScore();
      this._tick();
    }
  }

  setMuted(value) {
    this.muted = Boolean(value);
    if (this.master && this.context) {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setTargetAtTime(this.muted ? 0 : .62, this.context.currentTime, .025);
    }
  }

  pause() {
    this.paused = true;
    if (this.context) this._stopVoices(null, 0);
    if (this.context && this.context.state === 'running') this.context.suspend().catch(() => {});
  }

  async resume() {
    return this.start();
  }

  sfx(name) {
    if (!this.started || this.paused || this.disposed || !this.context || this.context.state !== 'running') return;
    const fx = EFFECTS[name];
    if (!fx) return;
    const at = this.context.currentTime + .005;
    for (const note of fx.notes) this._playNote(note, at + note.t * 60 / fx.bpm, note.d * 60 / fx.bpm, 'sfx');
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.started = false;
    clearInterval(this._timer);
    this._timer = null;
    this._stopVoices(null, .015);
    if (this.context) this.context.close().catch(() => {});
    this._voices.clear();
  }

  _buildGraph() {
    const ctx = this.context;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : .62;
    this.input = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = .9;
    const wet = ctx.createGain(); wet.gain.value = .14;
    const reverb = ctx.createConvolver();
    const impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 1.45), ctx.sampleRate);
    let seed = 38419;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
    for (let ch=0; ch<2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let j=0; j<data.length; j++) data[j] = random() * Math.pow(1-j/data.length, 3.6) * .7;
    }
    reverb.buffer = impulse;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 14;
    compressor.ratio.value = 3;
    compressor.attack.value = .005;
    compressor.release.value = .2;
    this.input.connect(dry); dry.connect(this.master);
    this.input.connect(reverb); reverb.connect(wet); wet.connect(this.master);
    this.master.connect(compressor); compressor.connect(ctx.destination);
    this._waves = {};
    const spectra = {
      organ: [0,1,.4,.34,.16,.1,.09,.05,.05],
      harpsi: [0,1,.57,.4,.29,.18,.14,.10,.08,.06],
      strings: [0,1,.43,.29,.20,.13,.10,.075,.05],
      bass: [0,1,.16,.23,.08,.06],
      flute: [0,1,.12,.07,.025,.015],
      bell: [0,1,.14,.32,.05,.18,.025,.09,.015],
      choir: [0,1,.18,.25,.35,.18,.07,.045,.02],
      pluck: [0,1,.36,.16,.07,.035,.018],
      square: [0,1,0,.333,0,.20,0,.143,0,.111]
    };
    for (const [name, harmonics] of Object.entries(spectra)) {
      this._waves[name] = ctx.createPeriodicWave(new Float32Array(harmonics.length), new Float32Array(harmonics));
    }
    this._noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate), ctx.sampleRate);
    const noise = this._noise.getChannelData(0);
    for (let j=0;j<noise.length;j++) noise[j] = random();
  }

  _resetScore() {
    this._index = 0;
    this._cycle = 0;
    this._exhausted = false;
    this._epoch = this.context.currentTime + .085;
  }

  _tick() {
    const ctx = this.context;
    if (!ctx || this.paused || this.disposed || ctx.state !== 'running' || this._exhausted) return;
    const score = SCORES[this.scene];
    const seconds = 60 / score.bpm;
    const horizon = ctx.currentTime + .16;
    // Bounded catch-up avoids a burst of old notes after a background-tab delay.
    let guard = 0;
    while (guard++ < 4096) {
      if (this._index >= score.notes.length) {
        if (!score.loop) { this._exhausted = true; return; }
        this._index = 0; this._cycle++;
      }
      const note = score.notes[this._index];
      const at = this._epoch + (this._cycle * score.beats + note.t) * seconds;
      if (at > horizon) return;
      this._index++;
      if (at >= ctx.currentTime - .055) this._playNote(note, Math.max(at, ctx.currentTime + .002), note.d * seconds, 'music');
    }
  }

  _playNote(note, at, duration, kind) {
    if (this._voices.size > 110) return;
    const ctx = this.context;
    const gain = ctx.createGain();
    let source, filter = null;
    let peak = (note.v / 127) * (kind === 'sfx' ? .19 : .105);
    let attack = .009, release = .16, sustain = .75;
    if (note.i === 'drum') {
      if (note.n === 36) {
        source = ctx.createOscillator(); source.type = 'sine';
        source.frequency.setValueAtTime(145, at);
        source.frequency.exponentialRampToValueAtTime(44, at + .12);
        peak *= 1.8; attack = .002; release = .045; sustain = .025;
      } else {
        source = ctx.createBufferSource(); source.buffer = this._noise;
        filter = ctx.createBiquadFilter();
        filter.type = note.n === 42 || note.n === 49 ? 'highpass' : 'bandpass';
        filter.frequency.value = note.n === 42 ? 7800 : note.n === 49 ? 5100 : 1800;
        filter.Q.value = .7;
        peak *= note.n === 42 ? .34 : .7;
        attack = .002; sustain = .015; release = note.n === 49 ? .34 : .04;
      }
    } else {
      source = ctx.createOscillator();
      source.setPeriodicWave(this._waves[note.i] || this._waves.harpsi);
      source.frequency.value = 440 * Math.pow(2,(note.n - 69)/12);
      if (note.i === 'organ') { attack = .014; release = .25; sustain = .83; peak *= .78; }
      if (note.i === 'strings') { attack = Math.min(.06,duration*.3); release = .28; sustain = .78; peak *= .66; }
      if (note.i === 'harpsi') { attack = .003; release = .11; sustain = .19; }
      if (note.i === 'bass') { attack = .007; release = .065; sustain = .58; peak *= 1.28; }
      if (note.i === 'flute') { attack = Math.min(.035,duration*.2); release = .13; sustain = .84; peak *= .77; }
      if (note.i === 'bell') { attack = .002; release = .43; sustain = .07; peak *= .87; }
      if (note.i === 'choir') { attack = Math.min(.095,duration*.3); release = .38; sustain = .81; peak *= .67; }
      if (note.i === 'pluck') { attack = .003; release = .17; sustain = .12; peak *= .86; }
      if (note.i === 'square') { attack = .004; release = .065; sustain = .49; peak *= .61; }
      filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
      const cutoffs = {bass:1300,strings:3700,harpsi:5800,organ:4800,flute:2600,bell:7200,choir:3200,pluck:4800,square:3800};
      filter.frequency.value = cutoffs[note.i] || 4800;
      filter.Q.value = .5;
    }
    duration = Math.max(duration,attack+.015);
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),at+attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,peak*sustain),at+duration);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration+release);
    if (filter) { source.connect(filter); filter.connect(gain); } else source.connect(gain);
    gain.connect(this.input);
    const voice = {source,gain,filter,kind};
    this._voices.add(voice);
    source.onended = () => {
      this._voices.delete(voice);
      try { source.disconnect(); gain.disconnect(); if (filter) filter.disconnect(); } catch (_) {}
    };
    source.start(at); source.stop(at+duration+release+.02);
  }

  _stopVoices(kind, fade) {
    if (!this.context) return;
    const at = this.context.currentTime;
    for (const voice of this._voices) {
      if (kind && voice.kind !== kind) continue;
      try {
        // cancelAndHoldAtTime preserves the envelope value and avoids a click.
        if (voice.gain.gain.cancelAndHoldAtTime) voice.gain.gain.cancelAndHoldAtTime(at);
        else voice.gain.gain.cancelScheduledValues(at);
        voice.gain.gain.setTargetAtTime(.0001,at,Math.max(.003,fade/3));
        voice.source.stop(at+fade+.01);
      } catch (_) {}
    }
  }
}
