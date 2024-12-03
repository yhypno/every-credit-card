const ROUND_CONSTANTS = [
  BigInt("0x47f5417d6b82b5d1"),
  BigInt("0x90a7c5fe8c345af2"),
  BigInt("0xd8796c3b2a1e4f8d"),
  BigInt("0x6f4a3c8e7d5b9102"),
  BigInt("0xb3f8c7d6e5a49201"),
  BigInt("0x2d9e8b7c6f5a3d4e"),
  BigInt("0xa1b2c3d4e5f6789a"),
  BigInt("0x123456789abcdef0"),
];

// just using 4 rounds seems to produce a good enough distribution to appear
// random
export const ROUNDS_USED = 4;

export function indexToUUID(index) {
  let left = BigInt(index) >> BigInt(64);
  let right = BigInt(index) & ((BigInt(1) << BigInt(64)) - BigInt(1));

  for (let round = 0; round < ROUNDS_USED; round++) {
    const mixed = feistelRound(right, round);
    const newRight = left ^ mixed;
    left = right;
    right = newRight;
  }

  const result = (left << BigInt(64)) | right;
  let hex = result.toString(16).padStart(32, "0");

  hex = hex.slice(0, 12) + "4" + hex.slice(13);
  hex =
    hex.slice(0, 16) +
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) +
    hex.slice(17);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function feistelRound(block, round) {
  // Mix using rotations, XORs, and addition
  let mixed = block;
  mixed ^= ROUND_CONSTANTS[round];
  mixed =
    ((mixed << BigInt(7)) | (mixed >> BigInt(57))) &
    ((BigInt(1) << BigInt(64)) - BigInt(1));
  mixed = mixed * BigInt("0x6c8e944d1f5aa3b7");
  mixed =
    ((mixed << BigInt(13)) | (mixed >> BigInt(51))) &
    ((BigInt(1) << BigInt(64)) - BigInt(1));

  return mixed;
}
