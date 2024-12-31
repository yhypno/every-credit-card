const ROUND_CONSTANTS = [
  BigInt("0x47f5417d6b82b5"),
  BigInt("0x90a7c5fe8c345"),
  BigInt("0xd8796c3b2a1e"),
  BigInt("0x6f4a3c8e7d5b"),
];

const ROUNDS_USED = 4;
const BLOCK_SIZE = 25n;

function luhn_checksum(code) {
  var len = code.length;
  var parity = len % 2;
  var sum = 0;
  for (var i = len-1; i >= 0; i--) {
      var d = parseInt(code.charAt(i));
      if (i % 2 == parity) { d *= 2; }
      if (d > 9) { d -= 9; }
      sum += d;
  }
  return sum % 10;
}

function luhn_calculate(partcode) {
  var checksum = luhn_checksum(partcode + "0");
  return checksum == 0 ? 0 : 10 - checksum;
}

function luhn_validate(fullcode) {
  return luhn_checksum(fullcode) == 0;
}

function feistelRound(block, round) {
  let mixed = block;
  mixed ^= ROUND_CONSTANTS[round] & ((1n << BLOCK_SIZE) - 1n);
  mixed = ((mixed << 5n) | (mixed >> 20n)) & ((1n << BLOCK_SIZE) - 1n);
  mixed = (mixed * BigInt("0x6c8e944d")) & ((1n << BLOCK_SIZE) - 1n);
  mixed = ((mixed << 7n) | (mixed >> 18n)) & ((1n << BLOCK_SIZE) - 1n);
  return mixed;
}

export function intToUUID(n) {
  if (typeof n !== "bigint") {
      n = BigInt(n);
  }
  if (n < 0n) throw new Error("Number must be non-negative");
  if (n >= 1n << 50n) throw new Error("Number too large (max 50 bits)");
  
  // Convert to 15 digits (4-4-4-3)
  const total = n;
  const block4 = total % 1000n;
  const block3 = (total / 1000n) % 10000n;
  const block2 = (total / 10000000n) % 10000n;
  const block1 = (total / 100000000000n) % 10000n;
  
  const p1 = block1.toString().padStart(4, "0");
  const p2 = block2.toString().padStart(4, "0");
  const p3 = block3.toString().padStart(4, "0");
  const p4 = block4.toString().padStart(3, "0");
  
  const partialCode = p1 + p2 + p3 + p4;
  const checkDigit = luhn_calculate(partialCode);
  
  return `${p1}-${p2}-${p3}-${p4}${checkDigit}`;
}

export function indexToUUID(index) {
  if (typeof index !== "bigint") {
      index = BigInt(index);
  }
  if (index >= BigInt(2) ** BigInt(50)) {
      throw new Error("Index out of range - must be less than 2^50");
  }
  if (index < 0n) {
      throw new Error("Index must be non-negative");
  }
  
  let left = index >> BLOCK_SIZE;
  let right = index & ((1n << BLOCK_SIZE) - 1n);
  
  for (let round = 0; round < ROUNDS_USED; round++) {
      const mixed = feistelRound(right, round);
      const newRight = left ^ mixed;
      left = right;
      right = newRight;
  }
  
  const total = (left << 25n) | right;
  const block4 = total % 1000n;
  const block3 = (total / 1000n) % 10000n;
  const block2 = (total / 10000000n) % 10000n;
  const block1 = (total / 100000000000n) % 10000n;
  
  const p1 = block1.toString().padStart(4, "0");
  const p2 = block2.toString().padStart(4, "0");
  const p3 = block3.toString().padStart(4, "0");
  const p4 = block4.toString().padStart(3, "0");
  
  const partialCode = p1 + p2 + p3 + p4;
  const checkDigit = luhn_calculate(partialCode);
  
  return `${p1}-${p2}-${p3}-${p4}${checkDigit}`;
}

export function uuidToIndex(number) {
  const withoutChecksum = number.slice(0, -1);
  const checkDigit = number.slice(-1);
  const parts = withoutChecksum.split('-');
  
  if (parts.length !== 4 || 
      !luhn_validate(parts.join('') + checkDigit)) {
      throw new Error("Invalid number format or checksum");
  }
  
  const block1 = BigInt(parts[0]);
  const block2 = BigInt(parts[1]);
  const block3 = BigInt(parts[2]);
  const block4 = BigInt(parts[3]);
  
  if (block1 >= 10000n || block2 >= 10000n || 
      block3 >= 10000n || block4 >= 1000n) {
      throw new Error("Block value exceeds limit");
  }
  
  const total = block1 * 100000000000n + block2 * 10000000n + block3 * 1000n + block4;
  const left = total >> 25n;
  const right = total & ((1n << 25n) - 1n);
  
  let current_left = left;
  let current_right = right;
  
  for (let round = ROUNDS_USED - 1; round >= 0; round--) {
      const prev_right = current_left;
      const mixed = feistelRound(prev_right, round);
      const prev_left = current_right ^ mixed;
      current_left = prev_left;
      current_right = prev_right;
  }
  
  return (current_left << BLOCK_SIZE) | current_right;
}
