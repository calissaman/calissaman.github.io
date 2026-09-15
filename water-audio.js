// Original procedural audio: no sampled recordings or third-party audio assets.
export function fillWaterChannel(samples, sampleRate, random = Math.random) {
  const duration = samples.length / sampleRate;
  let low = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const t = i / sampleRate;
    low += (random() * 2 - 1 - low) * 0.045;
    const swell =
      0.55 +
      0.22 * Math.sin((2 * Math.PI * 3 * t) / duration) +
      0.16 * Math.sin((2 * Math.PI * 7 * t) / duration);
    samples[i] = low * swell * 0.5;
  }
  // Short descending resonances evoke small bubbles and ripples, not rainfall.
  for (let at = 0; at < duration; at += 0.12 + random() * 0.65) {
    const length = 0.06 + random() * 0.2;
    const frequency = 450 + random() * 1300;
    const amplitude = 0.025 + random() * 0.065;
    const start = Math.floor(at * sampleRate);
    let phase = 0;
    for (let i = 0; i < length * sampleRate; i += 1) {
      const t = i / sampleRate;
      phase += (2 * Math.PI * frequency * Math.exp(-t * 3)) / sampleRate;
      const envelope = Math.min(1, t / 0.008) * Math.exp(-t * 24);
      samples[(start + i) % samples.length] +=
        Math.sin(phase) * envelope * amplitude;
    }
  }
  const fade = Math.min(Math.floor(sampleRate * 0.025), samples.length / 2);
  for (let i = 0; i < fade; i += 1) {
    samples[i] *= i / fade;
    samples[samples.length - 1 - i] *= i / fade;
  }
}
