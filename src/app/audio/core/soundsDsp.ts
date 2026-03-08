/**
 * Shared DSP helpers for Web Audio: clamping, context resume, noise buffer, reverb impulse.
 */

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * iOS/Safari requires user gesture to start AudioContext.
 * Call this before playing to keep behavior consistent.
 */
export function resumeIfSuspended(ctx: AudioContext): void {
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
}

/** Short noise burst for soft clicks, surf, etc. */
export function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const length = Math.max(1, Math.floor(durationSec * ctx.sampleRate));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.8;
  }
  return buffer;
}

/** Tiny reverb-ish impulse (very subtle). */
export function createTinyImpulse(ctx: AudioContext): AudioBuffer {
  const dur = 0.35;
  const len = Math.floor(dur * ctx.sampleRate);
  const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < len; i += 1) {
      const t = i / len;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3) * 0.35;
    }
  }
  return impulse;
}
