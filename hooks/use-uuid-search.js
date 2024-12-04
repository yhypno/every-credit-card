import React from "react";
import { uuidToIndex } from "../lib/uuidTools";
const PADDING_SENTINEL = "X";
const VARIANT_SENTINEL = "V";
const VERSION = "4";
const VALID_VARIANTS = ["8", "9", "a", "b"];

function getPatternWithPadding(search, leftPadding) {
  const uuidTemplate = `${PADDING_SENTINEL.repeat(8)}-${PADDING_SENTINEL.repeat(4)}-${VERSION}${PADDING_SENTINEL.repeat(3)}-${VARIANT_SENTINEL}${PADDING_SENTINEL.repeat(3)}-${PADDING_SENTINEL.repeat(12)}`;

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

    if (patternPos === 14 && inputChar !== VERSION) {
      return null;
    }

    if (patternPos === 19 && !VALID_VARIANTS.includes(inputChar)) {
      return null;
    }
  }

  const pattern =
    uuidTemplate.slice(0, leftPadding) +
    search +
    uuidTemplate.slice(leftPadding + search.length);

  const sections = pattern.split("-");
  if (
    sections[0].length === 8 &&
    sections[1].length === 4 &&
    sections[2].length === 4 &&
    sections[3].length === 4 &&
    sections[4].length === 12
  ) {
    return pattern;
  }

  return null;
}

function getAllValidPatterns(search) {
  const patterns = [];
  const uuidTemplate = `${PADDING_SENTINEL.repeat(8)}-${PADDING_SENTINEL.repeat(4)}-${VERSION}${PADDING_SENTINEL.repeat(3)}-${VARIANT_SENTINEL}${PADDING_SENTINEL.repeat(3)}-${PADDING_SENTINEL.repeat(12)}`;

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
  return pattern
    .replace(
      new RegExp(VARIANT_SENTINEL, "g"),
      () => VALID_VARIANTS[Math.floor(Math.random() * VALID_VARIANTS.length)]
    )
    .replace(
      new RegExp(PADDING_SENTINEL, "g"),
      () => "0123456789abcdef"[Math.floor(Math.random() * 16)]
    );
}

export function useUUIDSearch() {
  const [search, setSearch] = React.useState(null);
  const [pattern, setPattern] = React.useState(null);
  const [uuid, setUUID] = React.useState(null);
  const [leftPadding, setLeftPadding] = React.useState(null);
  // Stack of complete states we've seen
  const [nextStates, setNextStates] = React.useState([]);

  const searchUUID = React.useCallback(
    (input) => {
      const newSearch = input.toLowerCase().replace(/[^0-9a-f-]/g, "");
      if (!newSearch) return null;

      // Clear next states stack when search changes
      setNextStates([]);

      if (search && pattern && leftPadding !== null) {
        let newLeftPadding = null;

        if (newSearch.startsWith(search)) {
          newLeftPadding = leftPadding;
        } else if (newSearch.endsWith(search)) {
          newLeftPadding = leftPadding - (newSearch.length - search.length);
        } else if (search.startsWith(newSearch)) {
          newLeftPadding = leftPadding;
        } else if (search.endsWith(newSearch)) {
          newLeftPadding = leftPadding + (search.length - newSearch.length);
        }

        if (newLeftPadding !== null) {
          const newPattern = getPatternWithPadding(newSearch, newLeftPadding);
          if (newPattern) {
            setSearch(newSearch);
            setPattern(newPattern);
            setLeftPadding(newLeftPadding);
            const keptUUID =
              uuid.slice(0, newLeftPadding) +
              newSearch +
              uuid.slice(newLeftPadding + newSearch.length);
            setUUID(keptUUID);
            return keptUUID;
          }
        }
      }

      const validPatterns = getAllValidPatterns(newSearch);
      if (validPatterns.length === 0) return null;

      const { pattern: newPattern, leftPadding: newLeftPadding } =
        validPatterns[Math.floor(Math.random() * validPatterns.length)];
      const newUUID = generateRandomUUID(newPattern);

      setSearch(newSearch);
      setPattern(newPattern);
      setUUID(newUUID);
      setLeftPadding(newLeftPadding);

      return newUUID;
    },
    [search, pattern, uuid, leftPadding]
  );

  const generateMatchingUUID = React.useCallback(
    (compareIndex, wantHigher) => {
      // Try current pattern first
      if (pattern) {
        for (let i = 0; i < 5; i++) {
          const newUUID = generateRandomUUID(pattern);
          const newIndex = uuidToIndex(newUUID);
          const isInHistory = nextStates.some(({ uuid }) => uuid === newUUID);
          if (isInHistory) continue;
          if (wantHigher ? newIndex > compareIndex : newIndex < compareIndex) {
            return { uuid: newUUID, pattern, leftPadding };
          }
        }
      }

      // Try other patterns
      const validPatterns = getAllValidPatterns(search);
      for (let i = 0; i < 5; i++) {
        const { pattern: tryPattern, leftPadding: tryPadding } =
          validPatterns[Math.floor(Math.random() * validPatterns.length)];
        const newUUID = generateRandomUUID(tryPattern);
        const newIndex = uuidToIndex(newUUID);
        if (wantHigher ? newIndex > compareIndex : newIndex < compareIndex) {
          return {
            uuid: newUUID,
            pattern: tryPattern,
            leftPadding: tryPadding,
          };
        }
      }

      // Give up and return any valid UUID
      const { pattern: fallbackPattern, leftPadding: fallbackPadding } =
        validPatterns[Math.floor(Math.random() * validPatterns.length)];
      return {
        uuid: generateRandomUUID(fallbackPattern),
        pattern: fallbackPattern,
        leftPadding: fallbackPadding,
      };
    },
    [pattern, search, leftPadding]
  );

  const nextUUID = React.useCallback(() => {
    if (!uuid || !search) return null;
    const currentIndex = uuidToIndex(uuid);
    const result = generateMatchingUUID(currentIndex, true);
    if (result) {
      // Store complete current state before updating
      setNextStates((prev) => [...prev, { uuid, pattern, leftPadding }]);
      setUUID(result.uuid);
      setPattern(result.pattern);
      setLeftPadding(result.leftPadding);
      return result.uuid;
    }
    return null;
  }, [uuid, search, generateMatchingUUID, pattern, leftPadding]);

  const previousUUID = React.useCallback(() => {
    if (!uuid || !search) return null;

    // First try to use a state from our "next" stack
    if (nextStates.length > 0) {
      const prevState = nextStates[nextStates.length - 1];
      setNextStates((prev) => prev.slice(0, -1));
      setUUID(prevState.uuid);
      setPattern(prevState.pattern);
      setLeftPadding(prevState.leftPadding);
      return prevState.uuid;
    }

    // Otherwise generate a UUID with lower index
    const currentIndex = uuidToIndex(uuid);
    const result = generateMatchingUUID(currentIndex, false);
    if (result) {
      setUUID(result.uuid);
      setPattern(result.pattern);
      setLeftPadding(result.leftPadding);
      return result.uuid;
    }
    return null;
  }, [uuid, search, generateMatchingUUID, nextStates]);

  return {
    searchUUID,
    nextUUID,
    previousUUID,
    currentUUID: uuid,
  };
}
