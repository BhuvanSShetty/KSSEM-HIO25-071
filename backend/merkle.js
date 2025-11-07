import { sha256Hex } from './crypto-utils.js';

export function buildMerkleRoot(leafHashes) {
  if (!leafHashes || leafHashes.length === 0) return null;
  let layer = leafHashes.slice();
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      if (i + 1 === layer.length) {
        // duplicate last (Bitcoin-style)
        next.push(sha256Hex(layer[i] + layer[i]));
      } else {
        const left = layer[i];
        const right = layer[i + 1];
        // sort pair to avoid positional malleability (optional)
        const [a, b] = left < right ? [left, right] : [right, left];
        next.push(sha256Hex(a + b));
      }
    }
    layer = next;
  }
  return layer[0];
}
