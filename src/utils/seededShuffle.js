/**
 * Deterministic PRNG shuffle based on attemptID seed.
 * Ensures the same 70 questions are selected on reload/resume.
 */
export function seededShuffle(array, seed) {
  let s = 0;
  const strSeed = String(seed || '');
  for (let i = 0; i < strSeed.length; i++) {
    s = ((s << 5) - s + strSeed.charCodeAt(i)) | 0;
  }
  const rand = () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) / 4294967296);
  };
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

