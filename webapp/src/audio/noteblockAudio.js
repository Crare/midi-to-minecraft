let audioContext;
let noiseBuffer;

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
    gain: 0.1,
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

function createEnvelope(context, destination, attack, decay, gainAmount) {
  const now = context.currentTime;
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

function playTonalSound(context, placement) {
  const profile = tonalProfiles[placement.instrument] || tonalProfiles.harp;
  const { gainNode, stopAt } = createEnvelope(
    context,
    context.destination,
    profile.attack,
    profile.decay,
    profile.gain,
  );
  const target = createOptionalFilter(context, gainNode, profile.filter);
  const baseFrequency = minecraftFrequency(placement.note || 0);

  profile.partials.forEach((partial) => {
    const oscillator = context.createOscillator();
    const partialGain = context.createGain();
    oscillator.type = partial.type;
    oscillator.frequency.setValueAtTime(baseFrequency * partial.ratio, context.currentTime);
    partialGain.gain.setValueAtTime(partial.gain, context.currentTime);
    oscillator.connect(partialGain);
    partialGain.connect(target);
    oscillator.start();
    oscillator.stop(stopAt);
  });
}

function playBasedrum(context) {
  const { gainNode, stopAt } = createEnvelope(context, context.destination, 0.001, 0.28, 0.26);
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(140, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(48, context.currentTime + 0.18);
  oscillator.connect(gainNode);
  oscillator.start();
  oscillator.stop(stopAt);
}

function playNoiseBurst(context, options) {
  const source = context.createBufferSource();
  source.buffer = getNoiseBuffer(context);
  const filter = context.createBiquadFilter();
  filter.type = options.filterType;
  filter.frequency.value = options.frequency;
  filter.Q.value = options.q ?? 0.7;
  const { gainNode, stopAt } = createEnvelope(
    context,
    context.destination,
    options.attack,
    options.decay,
    options.gain,
  );

  source.connect(filter);
  filter.connect(gainNode);
  source.start();
  source.stop(stopAt);
}

function playSnare(context) {
  playNoiseBurst(context, {
    filterType: 'highpass',
    frequency: 1200,
    attack: 0.001,
    decay: 0.18,
    gain: 0.18,
  });

  const { gainNode, stopAt } = createEnvelope(context, context.destination, 0.001, 0.12, 0.08);
  const oscillator = context.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(180, context.currentTime);
  oscillator.connect(gainNode);
  oscillator.start();
  oscillator.stop(stopAt);
}

function playHat(context) {
  playNoiseBurst(context, {
    filterType: 'highpass',
    frequency: 5500,
    q: 1.3,
    attack: 0.001,
    decay: 0.08,
    gain: 0.1,
  });
}

function playCowBell(context) {
  const { gainNode, stopAt } = createEnvelope(context, context.destination, 0.001, 0.25, 0.09);
  [540, 800].forEach((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.connect(gainNode);
    oscillator.start();
    oscillator.stop(stopAt);
  });
}

function playPercussionSound(context, instrument) {
  switch (instrument) {
    case 'basedrum':
      playBasedrum(context);
      break;
    case 'snare':
      playSnare(context);
      break;
    case 'hat':
      playHat(context);
      break;
    case 'cow_bell':
      playCowBell(context);
      break;
    default:
      playTonalSound(context, { instrument: 'harp', note: 0 });
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
  const beat = 250; // ms
  const notes = [
    { delay: beat, instrument: 'pling', note: 6 },
    { delay: beat * 2, instrument: 'pling', note: 10 },
    { delay: beat * 3, instrument: 'pling', note: 13 },
    { delay: beat * 4, instrument: 'bell', note: 18 },
  ];
  notes.forEach(({ delay, instrument, note }) => {
    if (delay === 0) {
      playTonalSound(context, { instrument, note });
    } else {
      setTimeout(() => playTonalSound(context, { instrument, note }), delay);
    }
  });
}

// Synchronous version for the hot playback loop — skips async overhead.
// Only fires if the AudioContext is already running (call prepareAudioPlayback once before loop).
export function playPlacementSoundSync(placement) {
  if (!placement || !audioContext || audioContext.state !== 'running') return;

  if (placement.pitch === undefined) {
    playPercussionSound(audioContext, placement.instrument);
    return;
  }

  playTonalSound(audioContext, placement);
}
