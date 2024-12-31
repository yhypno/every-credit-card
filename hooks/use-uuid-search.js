import React from "react";
import { uuidToIndex, indexToUUID } from "../lib/uuidTools";
import { MAX_UUID } from "../lib/constants";

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

const PADDING_SENTINEL = "X";
const VALID_CHARS = "0123456789";

function getPatternWithPadding(search, leftPadding) {
  const uuidTemplate = `${PADDING_SENTINEL.repeat(4)}-${PADDING_SENTINEL.repeat(4)}-${PADDING_SENTINEL.repeat(4)}-${PADDING_SENTINEL.repeat(3)}${PADDING_SENTINEL}`;
  
  for (let pos = 0; pos < search.length; pos++) {
    const patternPos = leftPadding + pos;
    const inputChar = search[pos];
    const templateChar = uuidTemplate[patternPos];
    
    if (
      (inputChar === "-" && templateChar !== "-") ||
      (templateChar === "-" && inputChar !== "-")
    ) {
      return null;
    }
    
    if (!/^\d$/.test(inputChar) && inputChar !== "-") {
      return null;
    }
  }

  const pattern =
    uuidTemplate.slice(0, leftPadding) +
    search +
    uuidTemplate.slice(leftPadding + search.length);
  
  const sections = pattern.split("-");
  if (
    sections[0].length === 4 &&
    sections[1].length === 4 &&
    sections[2].length === 4 &&
    sections[3].length === 4  // Last section includes checksum
  ) {
    return pattern;
  }
  return null;
}

function getAllValidPatterns(search) {
  const patterns = [];
  const uuidTemplate = `${PADDING_SENTINEL.repeat(4)}-${PADDING_SENTINEL.repeat(4)}-${PADDING_SENTINEL.repeat(4)}-${PADDING_SENTINEL.repeat(3)}${PADDING_SENTINEL}`;
  
  for (
    let leftPadding = 0;
    leftPadding < uuidTemplate.length - search.length + 1;
    leftPadding++
  ) {
    const pattern = getPatternWithPadding(search, leftPadding);
    if (pattern) {
      patterns.push({ pattern, leftPadding });
    }
  }
  return patterns;
}

function generateRandomUUID(pattern) {
  // Generate without checksum first
  const withoutChecksum = pattern.slice(0, -1).replace(
    new RegExp(PADDING_SENTINEL, "g"),
    () => VALID_CHARS[Math.floor(Math.random() * 10)]
  );
  
  // Calculate and append checksum
  const parts = withoutChecksum.split('-');
  const partialCode = parts.join('');
  const checkDigit = luhn_calculate(partialCode);
  
  return withoutChecksum + checkDigit;
}

const SEARCH_LOOKBACK = 50;
const SEARCH_LOOKAHEAD = 25;
const RANDOM_SEARCH_ITERATIONS = 100;

export function useUUIDSearch({ virtualPosition, displayedUUIDs }) {
  const [search, setSearch] = React.useState(null);
  const [uuid, setUUID] = React.useState(null);
  const [nextStates, setNextStates] = React.useState([]);

  const previousUUIDs = React.useMemo(() => {
    let hasComputed = false;
    let value = null;
    const getValue = () => {
      const compute = () => {
        const prev = [];
        for (let i = 1; i <= SEARCH_LOOKBACK; i++) {
          i = BigInt(i);
          let index = BigInt(virtualPosition) - i;
          if (index < 0n) {
            index = MAX_UUID + index;
          }
          const uuid = indexToUUID(index);
          prev.push({ index, uuid });
        }
        return prev;
      };
      if (!hasComputed) {
        value = compute();
        hasComputed = true;
      }
      return value;
    };
    return getValue;
  }, [virtualPosition]);

  const nextUUIDs = React.useMemo(() => {
    let hasComputed = false;
    let value = null;
    const getValue = () => {
      const compute = () => {
        const next = [];
        for (let i = 1; i <= SEARCH_LOOKAHEAD; i++) {
          i = BigInt(i);
          let index = virtualPosition + i;
          if (index > MAX_UUID) {
            index = index - MAX_UUID;
          }
          const uuid = indexToUUID(index);
          next.push({ index, uuid });
        }
        return next;
      };
      if (!hasComputed) {
        value = compute();
        hasComputed = true;
      }
      return value;
    };
    return getValue;
  }, [virtualPosition]);

  const searchAround = React.useCallback(
    ({ input, wantHigher, canUseCurrentIndex }) => {
      if (wantHigher) {
        const startPosition = canUseCurrentIndex ? 0 : 1;
        for (let i = startPosition; i < displayedUUIDs.length; i++) {
          const uuid = displayedUUIDs[i].uuid;
          if (uuid.includes(input)) {
            return { uuid, index: displayedUUIDs[i].index };
          }
        }
        const next = nextUUIDs();
        for (let i = 0; i < next.length; i++) {
          const uuid = next[i].uuid;
          if (uuid.includes(input)) {
            return { uuid, index: next[i].index };
          }
        }
      } else {
        const prev = previousUUIDs();
        for (const { uuid, index } of prev) {
          if (uuid.includes(input)) {
            return { uuid, index };
          }
        }
      }
      return null;
    },
    [displayedUUIDs, previousUUIDs, nextUUIDs]
  );

  const searchRandomly = React.useCallback(
    ({ input, wantHigher }) => {
      const patterns = getAllValidPatterns(input);
      if (patterns.length === 0) return null;
      let best = null;
      let compareIndex = virtualPosition;
      
      for (let i = 0; i < RANDOM_SEARCH_ITERATIONS; i++) {
        const { pattern, leftPadding } =
          patterns[Math.floor(Math.random() * patterns.length)];
        const uuid = generateRandomUUID(pattern);
        const index = uuidToIndex(uuid);
        const satisfiesConstraint = wantHigher
          ? index > compareIndex
          : index < compareIndex;
        const notInHistory = !nextStates.some(
          ({ uuid: nextUUID }) => nextUUID === uuid
        );
        
        if (satisfiesConstraint && notInHistory) {
          const isBetter =
            best === null
              ? true
              : wantHigher
                ? index < best.index
                : index > best.index;
          if (isBetter) {
            best = { uuid, pattern, leftPadding, index };
          }
        }
      }
      
      if (best) {
        return best;
      }
      
      const { pattern: fallbackPattern, leftPadding: fallbackLeftPadding } =
        patterns[Math.floor(Math.random() * patterns.length)];
      const fallbackUuid = generateRandomUUID(fallbackPattern);
      return {
        uuid: fallbackUuid,
        pattern: fallbackPattern,
        leftPadding: fallbackLeftPadding,
        index: uuidToIndex(fallbackUuid)
      };
    },
    [nextStates, virtualPosition]
  );

  const searchUUID = React.useCallback(
    (input) => {
      const invalid = input.replace(/[^0-9-]/g, "");
      if (invalid !== input) {
        return null;
      }
      const newSearch = input.replace(/[^0-9-]/g, "");
      if (!newSearch) return null;
      setNextStates([]);
      
      const inner = () => {
        const around = searchAround({
          input,
          wantHigher: true,
          canUseCurrentIndex: true,
        });
        if (around) return around;
        return searchRandomly({ input, wantHigher: true });
      };
      
      const result = inner();
      if (result) {
        setSearch(newSearch);
        setUUID(result.uuid);
        setNextStates((prev) => [...prev, result]);
      }
      return result?.uuid ?? null;
    },
    [searchAround, searchRandomly]
  );

  const nextUUID = React.useCallback(() => {
    if (!uuid || !search) return null;
    
    const inner = () => {
      const around = searchAround({
        input: search,
        wantHigher: true,
        canUseCurrentIndex: false,
      });
      if (around) return around;
      return searchRandomly({ input: search, wantHigher: true });
    };
    
    const result = inner();
    if (result) {
      setUUID(result.uuid);
      setNextStates((prev) => [...prev, result]);
      return result.uuid;
    }
    return null;
  }, [uuid, search, searchAround, searchRandomly]);

  const previousUUID = React.useCallback(() => {
    if (!uuid || !search) return null;
    
    if (nextStates.length > 1) {
      setNextStates((prev) => prev.slice(0, -1));
      const prevState = nextStates[nextStates.length - 2];
      setUUID(prevState.uuid);
      return prevState.uuid;
    }
    
    const inner = () => {
      const around = searchAround({
        input: search,
        wantHigher: false,
        canUseCurrentIndex: false,
      });
      if (around) return around;
      return searchRandomly({ input: search, wantHigher: false });
    };
    
    const result = inner();
    if (result) {
      setUUID(result.uuid);
      return result.uuid;
    }
    return null;
  }, [uuid, search, nextStates, searchAround, searchRandomly]);

  return {
    searchUUID,
    nextUUID,
    previousUUID,
    currentUUID: uuid,
  };
}
