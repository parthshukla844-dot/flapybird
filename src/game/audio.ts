/**
 * Retro Chiptune Audio Synthesizer using Web Audio API
 * Generates authentic 8-bit waveforms (square, triangle, noise, sawtooth)
 * with Dynamic Biome Soundscapes (per-biome pitch, tempo, timbre, filter, and echo).
 */

import { BiomeType } from '../types';

export interface BiomeSoundscapeProfile {
  label: string;
  tempoMultiplier: number; // > 1 faster, < 1 slower
  pitchMultiplier: number; // frequency ratio (semitone transposition)
  melodyWave: OscillatorType;
  bassWave: OscillatorType;
  melodyGain: number;
  bassGain: number;
  noteGate: number; // 0..1 note sustain ratio
  filterFreq: number; // lowpass cutoff Hz
  filterQ: number; // filter resonance
  echoDelay: number; // seconds
  echoFeedback: number; // 0..0.6 feedback amount
  echoWet: number; // 0..0.6 wet echo level
  shimmerOvertone?: boolean; // crystalline upper octave glint (winter)
  pulseDrive?: boolean; // energetic beat accent (volcano / cyberpunk)
}

export const BIOME_SOUNDSCAPES: Record<BiomeType, BiomeSoundscapeProfile> = {
  day: {
    label: 'Sunny Classic',
    tempoMultiplier: 1.0,
    pitchMultiplier: 1.0, // C Major baseline
    melodyWave: 'square',
    bassWave: 'triangle',
    melodyGain: 0.08,
    bassGain: 0.18,
    noteGate: 0.85,
    filterFreq: 4800,
    filterQ: 0.8,
    echoDelay: 0.16,
    echoFeedback: 0.12,
    echoWet: 0.06,
  },
  sunset: {
    label: 'Golden Groove',
    tempoMultiplier: 0.94,
    pitchMultiplier: 0.9439, // -1 semitone (warm golden feel)
    melodyWave: 'triangle',
    bassWave: 'triangle',
    melodyGain: 0.11,
    bassGain: 0.19,
    noteGate: 0.92,
    filterFreq: 2600,
    filterQ: 1.0,
    echoDelay: 0.24,
    echoFeedback: 0.28,
    echoWet: 0.24,
  },
  night: {
    label: 'Nocturnal Cave Echo',
    tempoMultiplier: 0.9,
    pitchMultiplier: 0.8909, // -2 semitones (deep atmospheric pitch)
    melodyWave: 'triangle',
    bassWave: 'sine',
    melodyGain: 0.1,
    bassGain: 0.2,
    noteGate: 0.88,
    filterFreq: 2200,
    filterQ: 1.2,
    echoDelay: 0.28,
    echoFeedback: 0.46,
    echoWet: 0.44,
  },
  cyberpunk: {
    label: 'Neon Synthdrive',
    tempoMultiplier: 1.12,
    pitchMultiplier: 1.0595, // +1 semitone (crisp elevated synthwave)
    melodyWave: 'sawtooth',
    bassWave: 'sawtooth',
    melodyGain: 0.065,
    bassGain: 0.12,
    noteGate: 0.74,
    filterFreq: 3400,
    filterQ: 2.4,
    echoDelay: 0.145,
    echoFeedback: 0.34,
    echoWet: 0.3,
    pulseDrive: true,
  },
  volcano: {
    label: 'Magma Overdrive',
    tempoMultiplier: 1.24, // noticeably higher urgent tempo
    pitchMultiplier: 1.1225, // +2 semitones (intense fiery lift)
    melodyWave: 'sawtooth',
    bassWave: 'square',
    melodyGain: 0.072,
    bassGain: 0.13,
    noteGate: 0.78,
    filterFreq: 3900,
    filterQ: 2.0,
    echoDelay: 0.19,
    echoFeedback: 0.32,
    echoWet: 0.22,
    pulseDrive: true,
  },
  winter: {
    label: 'Frost Cavern Chimes',
    tempoMultiplier: 0.96,
    pitchMultiplier: 1.1892, // +3 semitones (sparkling crystalline register)
    melodyWave: 'sine',
    bassWave: 'triangle',
    melodyGain: 0.11,
    bassGain: 0.17,
    noteGate: 0.92,
    filterFreq: 5400,
    filterQ: 1.1,
    echoDelay: 0.26,
    echoFeedback: 0.5,
    echoWet: 0.48,
    shimmerOvertone: true,
  },
};

const BASE_STEP_DURATION = 0.16; // 120 BPM baseline

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private musicInput: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicDryGain: GainNode | null = null;
  private echoDelay: DelayNode | null = null;
  private echoToneFilter: BiquadFilterNode | null = null;
  private echoFeedbackGain: GainNode | null = null;
  private echoWetGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMusicPlaying = false;
  private bgmTimeoutId: number | null = null;
  private soundEnabled = true;
  private musicEnabled = true;
  private currentBiome: BiomeType = 'day';

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.soundEnabled ? 0.3 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.12 : 0, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      // Dynamic Biome Soundscape FX bus:
      // musicInput -> musicFilter -> (dry + feedback echo delay) -> musicGain
      this.musicInput = this.ctx.createGain();
      this.musicInput.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';

      this.musicDryGain = this.ctx.createGain();
      this.musicDryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.echoDelay = this.ctx.createDelay(1.0);
      this.echoToneFilter = this.ctx.createBiquadFilter();
      this.echoToneFilter.type = 'lowpass';
      this.echoToneFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);

      this.echoFeedbackGain = this.ctx.createGain();
      this.echoWetGain = this.ctx.createGain();

      this.musicInput.connect(this.musicFilter);
      this.musicFilter.connect(this.musicDryGain);
      this.musicDryGain.connect(this.musicGain);

      this.musicFilter.connect(this.echoDelay);
      this.echoDelay.connect(this.echoToneFilter);
      this.echoToneFilter.connect(this.echoFeedbackGain);
      this.echoFeedbackGain.connect(this.echoDelay);
      this.echoToneFilter.connect(this.echoWetGain);
      this.echoWetGain.connect(this.musicGain);

      this.applyBiomeAudioParams(true);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getBiomeSoundscape(biome: BiomeType = this.currentBiome): BiomeSoundscapeProfile {
    return BIOME_SOUNDSCAPES[biome] ?? BIOME_SOUNDSCAPES.day;
  }

  public setBiome(biome: BiomeType) {
    this.currentBiome = biome;
    this.applyBiomeAudioParams(false);
  }

  private applyBiomeAudioParams(immediate: boolean) {
    if (
      !this.ctx ||
      !this.musicFilter ||
      !this.echoDelay ||
      !this.echoFeedbackGain ||
      !this.echoWetGain
    ) {
      return;
    }

    const profile = this.getBiomeSoundscape(this.currentBiome);
    const now = this.ctx.currentTime;
    const safeFeedback = Math.min(0.58, Math.max(0, profile.echoFeedback));
    const safeWet = Math.min(0.6, Math.max(0, profile.echoWet));

    this.musicFilter.frequency.cancelScheduledValues(now);
    this.musicFilter.Q.cancelScheduledValues(now);
    this.echoDelay.delayTime.cancelScheduledValues(now);
    this.echoFeedbackGain.gain.cancelScheduledValues(now);
    this.echoWetGain.gain.cancelScheduledValues(now);

    if (immediate) {
      this.musicFilter.frequency.setValueAtTime(profile.filterFreq, now);
      this.musicFilter.Q.setValueAtTime(profile.filterQ, now);
      this.echoDelay.delayTime.setValueAtTime(profile.echoDelay, now);
      this.echoFeedbackGain.gain.setValueAtTime(safeFeedback, now);
      this.echoWetGain.gain.setValueAtTime(safeWet, now);
    } else {
      this.musicFilter.frequency.setTargetAtTime(profile.filterFreq, now, 0.08);
      this.musicFilter.Q.setTargetAtTime(profile.filterQ, now, 0.08);
      this.echoDelay.delayTime.setTargetAtTime(profile.echoDelay, now, 0.08);
      this.echoFeedbackGain.gain.setTargetAtTime(safeFeedback, now, 0.08);
      this.echoWetGain.gain.setTargetAtTime(safeWet, now, 0.08);
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(enabled ? 0.3 : 0, this.ctx.currentTime);
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(enabled ? 0.12 : 0, this.ctx.currentTime);
    }
    if (!enabled && this.isMusicPlaying) {
      this.stopMusic();
    }
  }

  // 8-bit Flap sound (Rising square wave)
  public playFlap() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Point scored ding (Crisp arpeggio tone)
  public playScore() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    
    // Note 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Note 2
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(987.77, now + 0.06); // B5
    gain2.gain.setValueAtTime(0.25, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.22);
  }

  // Coin collect sound (Classic arcade chime)
  public playCoin() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [987.77, 1318.51]; // B5 -> E6
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      const time = now + i * 0.07;
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time);
      osc.stop(time + 0.15);
    });
  }

  // Power-up collect fan-fare
  public playPowerUp() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  // Shield deflection sound
  public playShieldBreak() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.08);
    osc.frequency.linearRampToValueAtTime(220, now + 0.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Smack / Pipe collision hit sound
  public playHit() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  // Game over falling defeat sound
  public playGameOver() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.45);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // UI click / select sound
  public playSelect() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 8-bit System Wipe / Career Restart sound (Descending retro sweep)
  public playReset() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // 8-bit Sci-Fi Laser Blaster Sound (Descending resonant frequency sweep)
  public playLaser() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Laser obstacle destruction explosion
  public playLaserExplosion() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // White noise explosion burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1300, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  // Laser ammo fully depleted sound (Low 8-bit two-pulse warning buzz: 150Hz -> 95Hz)
  public playLaserDepleted(delaySec = 0) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const start = this.ctx.currentTime + delaySec;
    const pulses = [
      { freqStart: 150, freqEnd: 115, offset: 0, duration: 0.09 },
      { freqStart: 120, freqEnd: 95, offset: 0.11, duration: 0.14 },
    ];

    pulses.forEach(({ freqStart, freqEnd, offset, duration }) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = start + offset;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freqStart, t);
      osc.frequency.linearRampToValueAtTime(freqEnd, t + duration);

      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + duration);
    });
  }

  // Laser ammo cell recharged sound (Rising 8-bit arpeggio chime: D5 -> A5 -> D6)
  public playLaserRecharge() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.055;

      osc.type = idx === notes.length - 1 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.008, t + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  // Dynamic Chiptune BGM Generator with Per-Biome Soundscapes
  public startMusic(biome?: BiomeType) {
    if (biome) {
      this.currentBiome = biome;
    }
    if (!this.musicEnabled || this.isMusicPlaying) {
      this.applyBiomeAudioParams(false);
      return;
    }
    this.initContext();
    if (!this.ctx || !this.musicInput) return;

    this.applyBiomeAudioParams(true);
    this.isMusicPlaying = true;

    // Upbeat 8-bit melody and bass loops (Key of C / A Minor, dynamically transposed & tempo-scaled per biome)
    const melodyNotes = [
      523.25, 659.25, 783.99, 659.25, 880.00, 783.99, 659.25, 587.33,
      523.25, 659.25, 783.99, 1046.5, 987.77, 783.99, 880.00, 783.99,
      659.25, 783.99, 880.00, 987.77, 1046.5, 880.00, 783.99, 659.25,
      587.33, 659.25, 783.99, 587.33, 523.25, 392.00, 523.25, 0
    ];

    const bassNotes = [
      130.81, 130.81, 164.81, 164.81, 174.61, 174.61, 196.00, 196.00,
      130.81, 130.81, 164.81, 164.81, 220.00, 220.00, 196.00, 196.00,
      174.61, 174.61, 196.00, 196.00, 220.00, 220.00, 164.81, 164.81,
      146.83, 146.83, 196.00, 196.00, 130.81, 196.00, 130.81, 0
    ];

    let step = 0;

    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicInput || !this.musicEnabled) return;

      const profile = this.getBiomeSoundscape(this.currentBiome);
      const stepDuration = BASE_STEP_DURATION / profile.tempoMultiplier;
      const now = this.ctx.currentTime;

      const baseMFreq = melodyNotes[step % melodyNotes.length];
      const baseBFreq = bassNotes[step % bassNotes.length];
      const mFreq = baseMFreq > 0 ? baseMFreq * profile.pitchMultiplier : 0;
      const bFreq = baseBFreq > 0 ? baseBFreq * profile.pitchMultiplier : 0;

      // Melody channel shaped by current biome timbre & pitch
      if (mFreq > 0) {
        const oscM = this.ctx.createOscillator();
        const gainM = this.ctx.createGain();
        oscM.type = profile.melodyWave;
        oscM.frequency.setValueAtTime(mFreq, now);

        gainM.gain.setValueAtTime(profile.melodyGain, now);
        gainM.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * profile.noteGate);

        oscM.connect(gainM);
        gainM.connect(this.musicInput);

        oscM.start(now);
        oscM.stop(now + stepDuration);

        // Crystalline upper-octave chime overtone (Winter Frost Cavern)
        if (profile.shimmerOvertone && step % 2 === 0) {
          const oscS = this.ctx.createOscillator();
          const gainS = this.ctx.createGain();
          oscS.type = 'sine';
          oscS.frequency.setValueAtTime(mFreq * 2, now);

          gainS.gain.setValueAtTime(profile.melodyGain * 0.32, now);
          gainS.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.72);

          oscS.connect(gainS);
          gainS.connect(this.musicInput);

          oscS.start(now);
          oscS.stop(now + stepDuration * 0.75);
        }
      }

      // Bass channel shaped by current biome timbre & pitch
      if (bFreq > 0) {
        const oscB = this.ctx.createOscillator();
        const gainB = this.ctx.createGain();
        oscB.type = profile.bassWave;
        oscB.frequency.setValueAtTime(bFreq, now);

        gainB.gain.setValueAtTime(profile.bassGain, now);
        gainB.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.95);

        oscB.connect(gainB);
        gainB.connect(this.musicInput);

        oscB.start(now);
        oscB.stop(now + stepDuration);
      }

      // Subtle low-end driving percussion pulse on strong beats (Volcano / Cyberpunk)
      if (profile.pulseDrive && step % 4 === 0) {
        const oscK = this.ctx.createOscillator();
        const gainK = this.ctx.createGain();
        oscK.type = 'triangle';
        oscK.frequency.setValueAtTime(125, now);
        oscK.frequency.exponentialRampToValueAtTime(42, now + 0.075);

        gainK.gain.setValueAtTime(0.16, now);
        gainK.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        oscK.connect(gainK);
        gainK.connect(this.musicInput);

        oscK.start(now);
        oscK.stop(now + 0.085);
      }

      step++;

      if (this.isMusicPlaying && this.musicEnabled) {
        this.bgmTimeoutId = window.setTimeout(playStep, Math.round(stepDuration * 1000));
      }
    };

    playStep();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.bgmTimeoutId !== null) {
      window.clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
    // Gently damp feedback tail when music stops so echo doesn't ring indefinitely
    if (this.ctx && this.echoFeedbackGain) {
      const now = this.ctx.currentTime;
      this.echoFeedbackGain.gain.cancelScheduledValues(now);
      this.echoFeedbackGain.gain.setTargetAtTime(0, now, 0.06);
    }
  }
}

export const retroAudio = new RetroAudioEngine();
