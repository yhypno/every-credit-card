import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100svh;
  max-height: 100svh;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
`;

const NavigationArrow = styled.button`
  width: 100%;
  height: 1.5rem;
  background-color: rgb(243 244 246);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-bottom: 1px solid #e5e7eb;

  &:hover {
    background-color: rgb(229 231 235);
  }

  ${(props) =>
    props.$bottom &&
    `
    border-bottom: none;
    border-top: 1px solid #e5e7eb;
  `}
`;

const Header = styled.header`
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  /* position: sticky; */
  /* top: 0; */
  /* background-color: #fff; */
`;

const Content = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  /* background-color: green; */
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
  padding-right: 1rem;
`;

const UUIDItem = styled.div`
  padding: 0.25rem 1rem;
  font-family: monospace;
  font-size: 0.875rem;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
  height: ${(props) => props.$height}px;

  &:hover {
    background-color: rgb(249 250 251);
  }
`;

const ScrollbarContainer = styled.div`
  width: 1.5rem;
`;

const ScrollbarTrack = styled.div`
  height: 100%;
  margin: 0 0.5rem;
  background-color: rgb(229 231 235);
  cursor: pointer;
  position: relative;
`;

const ScrollbarThumb = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: ${(props) => props.$height}px;
  background-color: rgb(156 163 175);
  cursor: grab;
  transform: translateY(-50%);

  &:hover {
    background-color: rgb(107 114 128);
  }

  &:active {
    cursor: grabbing;
  }
`;

function App() {
  const [virtualPosition, setVirtualPosition] = React.useState(0n);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [targetPosition, setTargetPosition] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef(null);
  const scrollbarRef = React.useRef(null);
  const thumbRef = React.useRef(null);
  const animationRef = React.useRef(null);
  const ITEMS_TO_SHOW = 100;
  const ITEM_HEIGHT = 24;
  const THUMB_HEIGHT = 20;

  // Maximum position is (2^128 - ITEMS_TO_SHOW) to ensure we don't generate past the last UUID
  const MAX_POSITION = 2n ** 128n - BigInt(ITEMS_TO_SHOW);

  const generateUUID = (index) => {
    // Return null if we're past the maximum UUID
    if (index >= 2n ** 128n) return null;

    let uuid = "";
    for (let i = 0; i < 32; i++) {
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += "-";
      }
      const hash = ((Number(index % 100000000n) + i) * 16807) % 16;
      const hex = hash.toString(16);

      if (i === 12) {
        uuid += "4";
      } else if (i === 16) {
        uuid += "8";
      } else {
        uuid += hex;
      }
    }
    return uuid;
  };

  const animateToPosition = (targetPos) => {
    setTargetPosition(targetPos);
    setIsAnimating(true);
  };

  const handleDragStart = React.useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(true);
      setIsAnimating(false);
    },
    [setIsDragging, setIsAnimating]
  );

  const handleDrag = React.useCallback(
    (e) => {
      if (!isDragging || !scrollbarRef.current) return;

      const rect = scrollbarRef.current.getBoundingClientRect();
      const trackHeight = rect.height - THUMB_HEIGHT;
      let percentage = (e.clientY - rect.top - THUMB_HEIGHT / 2) / trackHeight;
      percentage = Math.max(0, Math.min(1, percentage));

      setVirtualPosition(BigInt(Math.floor(Number(MAX_POSITION) * percentage)));
    },
    [isDragging, scrollbarRef, MAX_POSITION]
  );

  const handleDragEnd = React.useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  const movePosition = (delta) => {
    if (isAnimating) return;
    setVirtualPosition((prev) => {
      const newPos = prev + delta;
      return newPos < 0n ? 0n : newPos > MAX_POSITION ? MAX_POSITION : newPos;
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (isAnimating) return;
    movePosition(BigInt(Math.floor(e.deltaY)));
  };

  const handleKey = (e) => {
    if (isAnimating) return;
    const PAGE_SIZE = BigInt(ITEMS_TO_SHOW * ITEM_HEIGHT);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        movePosition(1n);
        break;
      case "ArrowUp":
        e.preventDefault();
        movePosition(-1n);
        break;
      case "PageDown":
        e.preventDefault();
        movePosition(PAGE_SIZE);
        break;
      case "PageUp":
        e.preventDefault();
        movePosition(-PAGE_SIZE);
        break;
      case "Home":
        e.preventDefault();
        animateToPosition(0n);
        break;
      case "End":
        e.preventDefault();
        animateToPosition(MAX_POSITION);
        break;
      default:
        break;
    }
  };

  const handleScrollbarClick = (e) => {
    // Prevent click handling if we're clicking the thumb itself
    if (e.target === thumbRef.current) return;

    if (!scrollbarRef.current) return;

    const rect = scrollbarRef.current.getBoundingClientRect();
    const trackHeight = rect.height - THUMB_HEIGHT;
    let clickPosition = (e.clientY - rect.top - THUMB_HEIGHT / 2) / trackHeight;
    clickPosition = Math.max(0, Math.min(1, clickPosition));

    const newPosition = BigInt(
      Math.floor(Number(MAX_POSITION) * clickPosition)
    );
    animateToPosition(newPosition);
  };

  const handleAnchorClick = (position) => {
    animateToPosition(position);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

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

  return (
    <Wrapper>
      <Header>
        <h1>Every Possible UUID</h1>
        <p>Position: {virtualPosition.toString()}</p>
      </Header>

      <NavigationArrow onClick={() => handleAnchorClick(0n)}>^</NavigationArrow>

      <Content>
        <UUIDContainer
          ref={containerRef}
          onWheel={handleWheel}
          onKeyDown={handleKey}
          tabIndex={0}
        >
          <UUIDList>
            {Array.from({ length: ITEMS_TO_SHOW }, (_, i) => {
              const index = virtualPosition + BigInt(i);
              const uuid = generateUUID(index);
              if (!uuid) return null;
              return (
                <UUIDItem key={i} style={{ height: ITEM_HEIGHT }}>
                  {index.toString()}: {uuid}
                </UUIDItem>
              );
            })}
          </UUIDList>
        </UUIDContainer>

        <ScrollbarContainer>
          <ScrollbarTrack ref={scrollbarRef} onClick={handleScrollbarClick}>
            <ScrollbarThumb
              ref={thumbRef}
              style={{
                top: `${thumbPosition}%`,
                height: THUMB_HEIGHT,
                transform: "translateY(-50%)",
              }}
              onMouseDown={handleDragStart}
            />
          </ScrollbarTrack>
        </ScrollbarContainer>
      </Content>

      <NavigationArrow $bottom onClick={() => handleAnchorClick(MAX_POSITION)}>
        ↓
      </NavigationArrow>
    </Wrapper>
  );
}

export default App;
