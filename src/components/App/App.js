import React from "react";
import styled, { keyframes } from "styled-components";
import { ClipboardCopy, Star } from "../Icons/Icons";
import Header from "../Header/Header";
import Scrollbar from "../Scrollbar/Scrollbar";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import {
  MAX_UUID,
  WIDTH_TO_SHOW_DOUBLE_HEIGHT,
  SCROLLBAR_WIDTH,
  querySmallScreen,
} from "../../../lib/constants";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100svh;
  max-height: 100svh;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
`;

const CopyButton = styled(UnstyledButton)`
  height: 100%;
  aspect-ratio: 1;
  grid-area: copy;

  color: var(--slate-700);
  transition: color 0.1s ease-in-out;
  cursor: pointer;

  @media (hover: hover) {
    &:hover {
      color: var(--slate-900);
    }
  }

  transition: transform 0.1s ease-in-out;
  &:active {
    transform: scale(0.8);
  }
`;

const SpinStretch = keyframes`
  0% {
    transform: scale(1) rotate(0deg);
  }

  20% {
    transform: scale(0.8) rotate(-40deg);
  }

  80% {
    transform: scale(1) rotate(400deg);
  }

  100% {
    transform: scale(1) rotate(360deg);
  }
`;

const FavoriteButton = styled(UnstyledButton)`
  height: 100%;
  aspect-ratio: 1;
  grid-area: favorite;

  color: var(--yellow-700);
  transition: color 0.1s ease-in-out;

  --fill-color: ${(props) =>
    props.$isFaved ? "var(--yellow-500)" : "transparent"};

  &[data-just-faved="true"] {
    animation: ${SpinStretch} 1s ease-in-out;
  }

  @media (hover: hover) {
    &:hover {
      color: ${(props) =>
        props.$isFaved ? "var(--yellow-100)" : "var(--yellow-500)"};
    }
  }
  cursor: pointer;
`;

const HeaderAndContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const Content = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  overscroll-behavior: none;
`;

const UUIDContainer = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  outline: none;
`;

const UUIDList = styled.div`
  height: 100%;
  padding-bottom: 2rem;
`;

const UUIDContent = styled.div`
  display: grid;
  padding: 0.25rem 0;

  grid-template-areas: "index colon uuid copy favorite";
  grid-template-rows: 100%;
  grid-template-columns: repeat(5, fit-content(15px));
  gap: 0.25rem 0.5rem;
  align-items: center;

  margin-left: ${SCROLLBAR_WIDTH}px;
  font-family: monospace;
  white-space: nowrap;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--border-color);
  height: ${(props) => props.$height}px;

  @media (hover: hover) {
    &:hover {
      background-color: var(--slate-400);
    }
  }

  @media ${querySmallScreen} {
    grid-template-columns: repeat(2, fit-content(0));
    grid-template-areas: "index copy" "uuid favorite";
    grid-template-rows: 50% 50%;
    height: ${(props) => props.$height * 2}px;
    justify-content: center;
    gap: 0.25rem 0.5rem;
    padding: 0.5rem 0;
    margin-left: 0;
  }
`;

const UUIDIndex = styled.span`
  opacity: 0.7;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const UUIDPadding = styled.span`
  opacity: 0.3;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const IndexElt = styled.div`
  display: inline-block;
`;

const Colon = styled.span`
  grid-area: colon;

  &::after {
    content: "";
  }

  @media ${querySmallScreen} {
    display: none;
  }
`;

const UUID = styled.span`
  grid-area: uuid;
  color: var(--uuid-color);
  display: block;
  width: fit-content;
`;

function UUIDItem({ height, index, uuid, isFaved, toggleFavedUUID }) {
  const indexString = index.toString();
  const length = indexString.length;
  const padLength = 37;
  const paddingLength = padLength - length;
  const padding = "0".repeat(paddingLength);
  const [justFaved, setJustFaved] = React.useState(null);
  React.useEffect(() => {
    if (justFaved && justFaved !== uuid) {
      setJustFaved(null);
    }
  }, [justFaved, uuid]);

  return (
    <UUIDContent $height={height}>
      <IndexElt style={{ gridArea: "index" }}>
        <UUIDPadding>{padding}</UUIDPadding>
        <UUIDIndex>{indexString}</UUIDIndex>
      </IndexElt>
      <Colon />
      <UUID>{uuid}</UUID>
      <CopyButton onClick={() => navigator.clipboard.writeText(uuid)}>
        <ClipboardCopy style={{ height: "100%", aspectRatio: 1 }} />
      </CopyButton>
      <FavoriteButton
        $isFaved={isFaved}
        data-just-faved={isFaved && justFaved === uuid}
        onClick={() => {
          if (!isFaved) {
            setJustFaved(uuid);
          }
          toggleFavedUUID(uuid);
        }}
      >
        <Star
          fill="var(--fill-color)"
          style={{ height: "100%", aspectRatio: 1 }}
        />
      </FavoriteButton>
    </UUIDContent>
  );
}

function indexToUUID(index) {
  // Convert index to two 64-bit blocks (left and right)
  let left = BigInt(index) >> BigInt(64);
  let right = BigInt(index) & ((BigInt(1) << BigInt(64)) - BigInt(1));

  // Do 8 rounds of mixing
  for (let round = 0; round < 4; round++) {
    // In each round we:
    // 1. Mix the right block using a round function
    // 2. XOR that with the left block
    // 3. Swap left and right
    const mixed = feistelRound(right, round);
    const newRight = left ^ mixed;
    left = right;
    right = newRight;
  }

  // Combine the blocks and convert to UUID format
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
  // This is our round function that mixes bits
  // Using different constants for each round
  const ROUND_CONSTANTS = [
    BigInt("0x47f5417d6b82b5d1"),
    // BigInt("0x90a7c5fe8c345af2"),
    // BigInt("0xd8796c3b2a1e4f8d"),
    // BigInt("0x6f4a3c8e7d5b9102"),
    // BigInt("0xb3f8c7d6e5a49201"),
    BigInt("0x2d9e8b7c6f5a3d4e"),
    BigInt("0xa1b2c3d4e5f6789a"),
    BigInt("0x123456789abcdef0"),
  ];

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

function App() {
  const [virtualPosition, setVirtualPosition] = React.useState(0n);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [targetPosition, setTargetPosition] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [itemsToShow, setItemsToShow] = React.useState(40);
  const containerRef = React.useRef(null);
  const scrollbarRef = React.useRef(null);
  const thumbRef = React.useRef(null);
  const animationRef = React.useRef(null);
  const ITEM_HEIGHT = 24;
  const THUMB_HEIGHT = 20;
  const [favedUUIDs, setFavedUUIDs] = React.useState(
    localStorage.getItem("favedUUIDs")
      ? JSON.parse(localStorage.getItem("favedUUIDs"))
      : {}
  );
  const MAX_POSITION = MAX_UUID - BigInt(itemsToShow);

  const toggleFavedUUID = (uuid) => {
    setFavedUUIDs((prev) => {
      const prevValue = prev[uuid] || false;
      const newValue = !prevValue;
      const newFavedUUIDs = { ...prev };
      if (newValue) {
        newFavedUUIDs[uuid] = true;
      } else {
        delete newFavedUUIDs[uuid];
      }

      localStorage.setItem("favedUUIDs", JSON.stringify(newFavedUUIDs));
      return newFavedUUIDs;
    });
  };

  React.useEffect(() => {
    if (containerRef.current === null) return;

    const computeItemsToShow = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const height = rect.height;
      const width = rect.width + SCROLLBAR_WIDTH;
      const showDoubleHeight = width < WIDTH_TO_SHOW_DOUBLE_HEIGHT;
      const items = Math.floor(
        height / (showDoubleHeight ? ITEM_HEIGHT * 2 : ITEM_HEIGHT)
      );
      setItemsToShow(items);
    };
    computeItemsToShow();

    // debounce??
    window.addEventListener("resize", computeItemsToShow);
    return () => {
      window.removeEventListener("resize", computeItemsToShow);
    };
  }, []);

  const animateToPosition = React.useCallback(
    (targetPos) => {
      setTargetPosition(targetPos);
      setIsAnimating(true);
    },
    [setTargetPosition, setIsAnimating]
  );

  const movePosition = React.useCallback(
    (delta) => {
      if (isAnimating) return;
      setVirtualPosition((prev) => {
        const newPos = prev + delta;
        return newPos < 0n ? 0n : newPos > MAX_POSITION ? MAX_POSITION : newPos;
      });
    },
    [isAnimating, MAX_POSITION]
  );

  const handleKey = React.useCallback(
    (e) => {
      if (isAnimating) return;
      const PAGE_SIZE = BigInt(itemsToShow);
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      const shiftKey = e.shiftKey;

      const handleAndPrevent = (action) => {
        e.preventDefault();
        action();
      };

      const hasKeyAndModifier = (key, modifiers = []) => {
        return e.key === key && modifiers.every((mod) => mod);
      };

      const handleKeyAndPrevent = (key, modifiers = [], action) => {
        if (hasKeyAndModifier(key, modifiers)) {
          handleAndPrevent(action);
          return true;
        }
        return false;
      };

      const animateWithDelta = (delta) => {
        let target = virtualPosition + delta;
        if (target < 0n) {
          target = 0n;
        } else if (target > MAX_POSITION) {
          target = MAX_POSITION;
        }
        animateToPosition(target);
      };

      switch (true) {
        case handleKeyAndPrevent("ArrowDown", [cmdKey], () => {
          animateWithDelta(MAX_POSITION);
        }):
          return;
        case handleKeyAndPrevent("ArrowUp", [cmdKey], () =>
          animateWithDelta(-MAX_POSITION)
        ):
          return;
        case handleKeyAndPrevent(" ", [shiftKey], () => {
          animateWithDelta(-PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent(" ", [], () => {
          animateWithDelta(PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent("PageDown", [cmdKey], () => {
          animateWithDelta(MAX_POSITION);
        }):
          return;
        case handleKeyAndPrevent("PageUp", [cmdKey], () => {
          animateWithDelta(0n);
        }):
          return;
        case handleKeyAndPrevent("PageDown", [], () => {
          animateWithDelta(PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent("PageUp", [], () => {
          animateWithDelta(-PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent("Home", [], () => animateWithDelta(0n)):
          return;
        case handleKeyAndPrevent("End", [], () =>
          animateWithDelta(MAX_POSITION)
        ):
          return;
        case handleKeyAndPrevent("ArrowDown", [], () => movePosition(1n)):
          return;
        case handleKeyAndPrevent("ArrowUp", [], () => movePosition(-1n)):
          return;
        default:
          break;
      }
    },
    [
      isAnimating,
      virtualPosition,
      movePosition,
      MAX_POSITION,
      itemsToShow,
      animateToPosition,
    ]
  );

  React.useEffect(() => {
    if (isAnimating && targetPosition !== null) {
      const startPosition = virtualPosition;
      const startTime = performance.now();
      const duration = 300;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentPos =
          startPosition +
          ((targetPosition - startPosition) *
            BigInt(Math.floor(easeProgress * 1000))) /
            1000n;
        setVirtualPosition(currentPos);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setVirtualPosition(targetPosition);
          setIsAnimating(false);
          setTargetPosition(null);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
    // we intentionally want to save off an "old" copy of virtual position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, targetPosition]);

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const scrollPercentage = Number((virtualPosition * 100n) / MAX_POSITION);
  // Adjust thumb position to stay within bounds
  const thumbPosition = Math.min(
    100 - (THUMB_HEIGHT * 100) / (scrollbarRef.current?.clientHeight || 100),
    Math.max(0, scrollPercentage)
  );

  React.useEffect(() => {
    if (!containerRef.current) return;
    const handleWheel = (e) => {
      if (isAnimating) return;
      e.preventDefault();
      movePosition(BigInt(Math.floor(e.deltaY)));
    };
    containerRef.current.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    let lastTouchY = 0;
    let lastTouchTime = 0;
    let velocity = 0;
    let animationFrame = null;

    const applyMomentum = () => {
      if (Math.abs(velocity) > 0.5) {
        movePosition(BigInt(Math.floor(velocity)));
        // Decay the velocity - play with these numbers to adjust the "feel"
        velocity *= 0.95;
        animationFrame = requestAnimationFrame(applyMomentum);
      } else {
        velocity = 0;
      }
    };

    const handleTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY;
      lastTouchTime = Date.now();
      velocity = 0;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;
      const now = Date.now();
      const deltaTime = now - lastTouchTime;

      velocity = (deltaY / deltaTime) * 16.67;

      lastTouchY = touchY;
      lastTouchTime = now;

      movePosition(BigInt(Math.floor(deltaY * 2)));
    };

    const handleTouchEnd = () => {
      // Start momentum scrolling
      if (Math.abs(velocity) > 0.5) {
        animationFrame = requestAnimationFrame(applyMomentum);
      }
    };

    containerRef.current.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    containerRef.current.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    containerRef.current.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });

    return () => {
      containerRef.current.removeEventListener("wheel", handleWheel);
      containerRef.current.removeEventListener("touchstart", handleTouchStart);
      containerRef.current.removeEventListener("touchmove", handleTouchMove);
      containerRef.current.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <Wrapper>
      <HeaderAndContent>
        <Header />
        <Content>
          <UUIDContainer ref={containerRef} onKeyDown={handleKey} tabIndex={0}>
            <UUIDList>
              {Array.from({ length: itemsToShow }, (_, i) => {
                const index = virtualPosition + BigInt(i);
                if (index > MAX_UUID) {
                  return null;
                }
                const uuid = indexToUUID(index);
                if (!uuid) {
                  console.error("no uuid", index);
                  return null;
                }
                return (
                  <UUIDItem
                    key={i}
                    height={ITEM_HEIGHT}
                    index={index}
                    uuid={uuid}
                    isFaved={favedUUIDs[uuid]}
                    toggleFavedUUID={toggleFavedUUID}
                  />
                );
              })}
            </UUIDList>
          </UUIDContainer>
        </Content>
      </HeaderAndContent>
      <Scrollbar
        virtualPosition={virtualPosition}
        MAX_POSITION={MAX_POSITION}
        animateToPosition={animateToPosition}
        setVirtualPosition={setVirtualPosition}
        setIsAnimating={setIsAnimating}
      />
    </Wrapper>
  );
}

export default App;
