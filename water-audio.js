// Blend the recording ends without a silent gap or an abrupt loop boundary.
export function createWaterLoop(context, recording) {
  const overlap = Math.min(
    Math.floor(recording.sampleRate * 1.5),
    Math.floor(recording.length / 4),
  );
  const length = recording.length - overlap;
  const loop = context.createBuffer(
    recording.numberOfChannels,
    length,
    recording.sampleRate,
  );
  for (let channel = 0; channel < recording.numberOfChannels; channel += 1) {
    const input = recording.getChannelData(channel);
    const output = loop.getChannelData(channel);
    output.set(input.subarray(overlap));
    for (let i = 0; i < overlap; i += 1) {
      const mix = i / overlap;
      output[length - overlap + i] =
        input[length + i] * (1 - mix) + input[i] * mix;
    }
  }
  return loop;
}
