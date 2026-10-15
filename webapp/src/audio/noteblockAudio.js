let audioContext;
let noiseBuffer;
let masterBus;

const tonalProfiles = {
  harp: {
    partials: [
      { ratio: 1, gain: 1, type: 'triangle' },
      { ratio: 2, gain: 0.22, type: 'sine' },
    ],
    attack: 0.005,
    decay: 1.1,
    gain: 0.18,
  },
  bass: {
    partials: [
      { ratio: 1, gain: 1, type: 'sawtooth' },
      { ratio: 0.5, gain: 0.3, type: 'sine' },
    ],
    attack: 0.005,
    decay: 0.7,
    gain: 0.16,
    filter: { type: 'lowpass', frequency: 720, q: 0.7 },
  },
  bell: {
    partials: [
      { ratio: 1, gain: 1, type: 'sine' },
      { ratio: 2.76, gain: 0.38, type: 'sine' },
      { ratio: 4.1, gain: 0.16, type: 'sine' },
    ],
    attack: 0.002,
    decay: 1.8,
    gain: 0.12,
  },
  flute: {
    partials: [
      { ratio: 1, gain: 1, type: 'sine' },
      { ratio: 2, gain: 0.12, type: 'triangle' },
    ],
    attack: 0.03,
    decay: 0.95,
    gain: 0.14,
    filter: { type: 'lowpass', frequency: 2600, q: 0.5 },
  },
  chime: {
    partials: [
      { ratio: 1, gain: 1, type: 'triangle' },
      { ratio: 3, gain: 0.28, type: 'sine' },
    ],
    attack: 0.005,
    decay: 1.4,
    gain: 0.13,
  },
  guitar: {
    partials: [
      { ratio: 1, gain: 1, type: 'triangle' },
      { ratio: 2, gain: 0.25, type: 'triangle' },
      { ratio: 3, gain: 0.08, type: 'sine' },
    ],
    attack: 0.004,
    decay: 0.85,
    gain: 0.15,
    filter: { type: 'lowpass', frequency: 1800, q: 0.7 },
  },
  xylophone: {
    partials: [
      { ratio: 1, gain: 1, type: 'triangle' },
      { ratio: 3, gain: 0.16, type: 'sine' },
    ],
    attack: 0.002,
    decay: 0.65,
    gain: 0.16,
  },
  iron_xylophone: {
    partials: [
      { ratio: 1, gain: 1, type: 'square' },
      { ratio: 2.4, gain: 0.18, type: 'sine' },
    ],
    attack: 0.001,
    decay: 0.55,
    gain: 0.12,
    filter: { type: 'highpass', frequency: 260, q: 0.8 },
  },
  didgeridoo: {
    partials: [
      { ratio: 1, gain: 1, type: 'sawtooth' },
      { ratio: 0.5, gain: 0.24, type: 'sine' },
    ],
    attack: 0.01,
    decay: 0.75,
    gain: 0.14,
    filter: { type: 'lowpass', frequency: 520, q: 1.2 },
  },
  bit: {
    partials: [{ ratio: 1, gain: 1, type: 'square' }],
    attack: 0.001,
    decay: 0.35,
    gain: 0.1,
  },
  banjo: {
    partials: [
      { ratio: 1, gain: 1, type: 'square' },
      { ratio: 2, gain: 0.18, type: 'triangle' },
    ],
    attack: 0.001,
    decay: 0.45,
    gain: 0.11,
    filter: { type: 'highpass', frequency: 240, q: 0.8 },
  },
  pling: {
    partials: [
      { ratio: 1, gain: 1, type: 'square' },
      { ratio: 2, gain: 0.2, type: 'sine' },
    ],
    attack: 0.001,
    decay: 0.5,
    gain: 0.1,
  },
  trumpet: {
    partials: [
      { ratio: 1, gain: 1, type: 'sawtooth' },
      { ratio: 2, gain: 0.5, type: 'sawtooth' },
      { ratio: 3, gain: 0.25, type: 'sine' },
    ],
    attack: 0.015,
    decay: 0.65,
    gain: 0.10,
    filter: { type: 'bandpass', frequency: 1200, q: 1.5 },
  },
  trumpet_exposed: {
    partials: [
      { ratio: 1, gain: 1, type: 'sawtooth' },
      { ratio: 2, gain: 0.6, type: 'sawtooth' },
      { ratio: 3, gain: 0.35, type: 'sawtooth' },
    ],
    attack: 0.012,
    decay: 0.6,
    gain: 0.09,
    filter: { type: 'bandpass', frequency: 1500, q: 1.8 },
  },
  trumpet_weathered: {
    partials: [
      { ratio: 1, gain: 1, type: 'sawtooth' },
      { ratio: 2, gain: 0.4, type: 'sine' },
      { ratio: 3, gain: 0.2, type: 'sine' },
    ],
    attack: 0.02,
    decay: 0.7,
    gain: 0.12,
    filter: { type: 'lowpass', frequency: 1000, q: 0.8 },
  },
  trumpet_oxidized: {
    partials: [
      { ratio: 1, gain: 1, type: 'sawtooth' },
      { ratio: 2, gain: 0.5, type: 'sawtooth' },
      { ratio: 3, gain: 0.3, type: 'sawtooth' },
    ],
    attack: 0.02,
    decay: 0.65,
    gain: 0.11,
    filter: { type: 'lowpass', frequency: 800, q: 1.2 },
  },
};

function getAudioContext() {
  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    audioContext = new Context();
  }

  return audioContext;
}

export async function prepareAudioPlayback() {
  const context = getAudioContext();

  if (context.state === 'suspended') {
    await context.resume();
  }

  return context;
}

// All voices share one compressor so large chords and drum hits sum without clipping.
function getMasterBus(context) {
  if (!masterBus || masterBus.context !== context) {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    compressor.connect(context.destination);
    masterBus = compressor;
  }
  return masterBus;
}

function getNoiseBuffer(context) {
  if (noiseBuffer) return noiseBuffer;

  const buffer = context.createBuffer(1, context.sampleRate * 0.5, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  noiseBuffer = buffer;
  return buffer;
}

function createEnvelope(context, destination, attack, decay, gainAmount, when) {
  const now = when ?? context.currentTime;
  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(gainAmount, now + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  gainNode.connect(destination);
  return { gainNode, stopAt: now + attack + decay + 0.05 };
}

function createOptionalFilter(context, destination, filterConfig) {
  if (!filterConfig) return destination;

  const filter = context.createBiquadFilter();
  filter.type = filterConfig.type;
  filter.frequency.value = filterConfig.frequency;
  filter.Q.value = filterConfig.q ?? 0.0001;
  filter.connect(destination);
  return filter;
}

function minecraftFrequency(note) {
  const baseFrequency = 184.997;
  return baseFrequency * 2 ** (note / 12);
}

function playTonalSound(context, placement, when = context.currentTime) {
  const profile = tonalProfiles[placement.instrument] || tonalProfiles.harp;
  const { gainNode, stopAt } = createEnvelope(
    context,
    getMasterBus(context),
    profile.attack,
    profile.decay,
    profile.gain,
    when
  );
  const target = createOptionalFilter(context, gainNode, profile.filter);
  const baseFrequency = minecraftFrequency(placement.note || 0);

  profile.partials.forEach((partial) => {
    const oscillator = context.createOscillator();
    const partialGain = context.createGain();
    oscillator.type = partial.type;
    oscillator.frequency.setValueAtTime(baseFrequency * partial.ratio, when);
    partialGain.gain.setValueAtTime(partial.gain, when);
    oscillator.connect(partialGain);
    partialGain.connect(target);
    oscillator.start(when);
    oscillator.stop(stopAt);
  });
}

function playBasedrum(context, when = context.currentTime) {
  const { gainNode, stopAt } = createEnvelope(context, getMasterBus(context), 0.001, 0.28, 0.26, when);
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(140, when);
  oscillator.frequency.exponentialRampToValueAtTime(48, when + 0.18);
  oscillator.connect(gainNode);
  oscillator.start(when);
  oscillator.stop(stopAt);
}

function playNoiseBurst(context, options, when = context.currentTime) {
  const source = context.createBufferSource();
  source.buffer = getNoiseBuffer(context);
  const filter = context.createBiquadFilter();
  filter.type = options.filterType;
  filter.frequency.value = options.frequency;
  filter.Q.value = options.q ?? 0.7;
  const { gainNode, stopAt } = createEnvelope(
    context,
    getMasterBus(context),
    options.attack,
    options.decay,
    options.gain,
    when
  );

  source.connect(filter);
  filter.connect(gainNode);
  source.start(when);
  source.stop(stopAt);
}

function playSnare(context, when = context.currentTime) {
  playNoiseBurst(context, {
    filterType: 'highpass',
    frequency: 1200,
    attack: 0.001,
    decay: 0.18,
    gain: 0.18,
  }, when);

  const { gainNode, stopAt } = createEnvelope(context, getMasterBus(context), 0.001, 0.12, 0.08, when);
  const oscillator = context.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(180, when);
  oscillator.connect(gainNode);
  oscillator.start(when);
  oscillator.stop(stopAt);
}

function playHat(context, when = context.currentTime) {
  playNoiseBurst(context, {
    filterType: 'highpass',
    frequency: 5500,
    q: 1.3,
    attack: 0.001,
    decay: 0.08,
    gain: 0.1,
  }, when);
}

function playCowBell(context, when = context.currentTime) {
  const { gainNode, stopAt } = createEnvelope(context, getMasterBus(context), 0.001, 0.25, 0.09, when);
  [540, 800].forEach((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.connect(gainNode);
    oscillator.start(when);
    oscillator.stop(stopAt);
  });
}

function playPercussionSound(context, instrument, when = context.currentTime) {
  switch (instrument) {
    case 'basedrum':
      playBasedrum(context, when);
      break;
    case 'snare':
      playSnare(context, when);
      break;
    case 'hat':
      playHat(context, when);
      break;
    case 'cow_bell':
      playCowBell(context, when);
      break;
    default:
      playTonalSound(context, { instrument: 'harp', note: 0 }, when);
  }
}

export async function playPlacementSound(placement) {
  if (!placement) return;

  const context = await prepareAudioPlayback();

  if (placement.pitch === undefined) {
    playPercussionSound(context, placement.instrument);
    return;
  }

  playTonalSound(context, placement);
}

export async function playSuccessJingle() {
  const context = await prepareAudioPlayback();
  const beat = 0.25; // seconds
  const notes = [
    { instrument: 'pling', note: 6 },
    { instrument: 'pling', note: 10 },
    { instrument: 'pling', note: 13 },
    { instrument: 'bell', note: 18 },
  ];
  const start = context.currentTime;
  notes.forEach(({ instrument, note }, i) => {
    playTonalSound(context, { instrument, note }, start + i * beat);
  });
}

// Synchronous version for the hot playback loop — skips async overhead.
// Only fires if the AudioContext is already running (call prepareAudioPlayback once before loop).
export function playPlacementSoundSync(placement, when) {
  if (!placement || !audioContext || audioContext.state !== 'running') return;

  // Never schedule in the past; that would just play late anyway.
  const startAt = Math.max(when ?? 0, audioContext.currentTime);

  if (placement.pitch === undefined) {
    playPercussionSound(audioContext, placement.instrument, startAt);
    return;
  }

  playTonalSound(audioContext, placement, startAt);
}

// Current time of the audio hardware clock in seconds (or null if unavailable).
export function getAudioClock() {
  return audioContext && audioContext.state === 'running' ? audioContext.currentTime : null;
}
