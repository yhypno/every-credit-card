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

// N has one bit from left and one from right (2 for variant)
// bits from left          bits from right
// ------------------------------------
// |                  |                |
// xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx

// just using 4 rounds seems to produce a good enough distribution to appear
// random
const ROUNDS_USED = 4;

export function indexToUUID(index) {
  if (index >= BigInt(2) ** BigInt(122)) {
    throw new Error("Index out of range - must be less than 2^122");
  }

  let left = BigInt(index) >> BigInt(61);
  let right = BigInt(index) & ((BigInt(1) << BigInt(61)) - BigInt(1));

  for (let round = 0; round < ROUNDS_USED; round++) {
    const mixed = feistelRound(right, round);
    const newRight = left ^ (mixed & ((BigInt(1) << BigInt(61)) - BigInt(1))); // Ensure 61-bit result
    left = right;
    right = newRight;
  }

  let result = BigInt(0);
  // first 48 bits from the left
  // left: 13 bits remaining; right: 61 bits remaining; total: 48 bits used
  result |= (left >> BigInt(13)) << BigInt(80);
  // 4 bits for version
  // left: 13 bits remaining; right: 61 bits remaining; total: 52 bits used
  result |= BigInt(4) << BigInt(76);
  // next 12 bits from left
  // left: 1 bit remaining; right: 61 bits remaining; total: 64 bits used
  const next12BitsFromLeft =
    (left >> BigInt(1)) & ((BigInt(1) << BigInt(12)) - BigInt(1));
  result |= next12BitsFromLeft << BigInt(64);
  // 2 bits for variant
  // left: 1 bit remaining; right: 61 bits remaining; total: 66 bits used
  result |= BigInt(2) << BigInt(62);
  // 1 bit remaining from the left!
  // left: 0 bits remaining; right: 61 bits remaining; total: 67 bits used
  const lastBitFromLeft = left & BigInt(1);
  // good to use all the bits from the right
  result |= lastBitFromLeft << BigInt(61);
  result |= right;

  let hex = result.toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function feistelRound(block, round) {
  // Mix using rotations, XORs, and addition, maintaining 61-bit blocks
  let mixed = block;
  mixed ^= ROUND_CONSTANTS[round] & ((BigInt(1) << BigInt(61)) - BigInt(1));
  mixed =
    ((mixed << BigInt(7)) | (mixed >> BigInt(54))) &
    ((BigInt(1) << BigInt(61)) - BigInt(1));
  mixed =
    (mixed * BigInt("0x6c8e944d1f5aa3b7")) &
    ((BigInt(1) << BigInt(61)) - BigInt(1));
  mixed =
    ((mixed << BigInt(13)) | (mixed >> BigInt(48))) &
    ((BigInt(1) << BigInt(61)) - BigInt(1));

  return mixed;
}

function splitUUID(uuid) {
  const hex = uuid.replace(/-/g, "");
  const value = BigInt("0x" + hex);

  let left = BigInt(0);
  let right = BigInt(0);

  //                    (includes LSB of N)
  //                         grab these
  //                    |               |
  // xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
  // Final bit (0) came from after variant bit
  right = value & ((BigInt(1) << BigInt(61)) - BigInt(1));

  //  grab these
  // |           |
  // xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
  // Highest 48 bits (60-13) came from first shift
  left |= (value >> BigInt(80)) << BigInt(13);

  //             grab these
  //                | |
  // xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
  // Next 12 bits (12-1) came from middle section
  const mid12Bits =
    (value >> BigInt(64)) & ((BigInt(1) << BigInt(12)) - BigInt(1));
  left |= mid12Bits << BigInt(1);

  //                grab bit 1 of N (0 is for right, 2-3 for variant)
  //                    |
  // xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
  // Final bit (0) came from after variant bit
  const lastBit = (value >> BigInt(61)) & BigInt(1);
  left |= lastBit;

  return { left, right };
}

export function uuidToIndex(uuid) {
  // First split the UUID back into left and right values
  const { left, right } = splitUUID(uuid);

  // Now reverse the Feistel network
  let current_left = left;
  let current_right = right;

  // Run rounds in reverse
  for (let round = ROUNDS_USED - 1; round >= 0; round--) {
    const prev_right = current_left;
    const mixed = feistelRound(prev_right, round);
    const prev_left =
      current_right ^ (mixed & ((BigInt(1) << BigInt(61)) - BigInt(1)));
    current_left = prev_left;
    current_right = prev_right;
  }

  // Reconstruct the original index
  return (current_left << BigInt(61)) | current_right;
}
