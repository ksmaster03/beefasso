// Magic-byte validation so attackers can't rename executables to .jpg.
const SIGNATURES: Record<string, number[]> = {
  jpg:  [0xFF, 0xD8, 0xFF],
  jpeg: [0xFF, 0xD8, 0xFF],
  png:  [0x89, 0x50, 0x4E, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header; bytes 8–11 must be 'WEBP'
  pdf:  [0x25, 0x50, 0x44, 0x46], // %PDF
};

export function validateFileMagicBytes(buf: Buffer, ext: string): boolean {
  const sig = SIGNATURES[ext.toLowerCase()];
  if (!sig) return false;
  for (let i = 0; i < sig.length; i++) {
    if (buf[i] !== sig[i]) return false;
  }
  if (ext.toLowerCase() === 'webp') {
    const webp = [0x57, 0x45, 0x42, 0x50];
    for (let i = 0; i < 4; i++) {
      if (buf[8 + i] !== webp[i]) return false;
    }
  }
  return true;
}
