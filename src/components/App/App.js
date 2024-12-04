import React from "react";
import styled from "styled-components";
import Header from "../Header/Header";
import Scrollbar from "../Scrollbar/Scrollbar";
import { MAX_UUID } from "../../../lib/constants";
import UUIDDisplay from "../UUIDDisplay/UUIDDisplay";
import SearchWidget from "../SearchWidget/SearchWidget";

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

function App() {
  const [virtualPosition, setVirtualPosition] = React.useState(0n);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [targetPosition, setTargetPosition] = React.useState(null);
  const [itemsToShow, setItemsToShow] = React.useState(40);
  const [search, setSearch] = React.useState("");
  const [searchDisplayed, setSearchDisplayed] = React.useState(false);
  const animationRef = React.useRef(null);

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

  const animateToPosition = React.useCallback(
    (targetPos) => {
      setTargetPosition(targetPos);
      setIsAnimating(true);
    },
    [setTargetPosition, setIsAnimating]
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

  return (
    <>
      <SearchWidget
        animateToPosition={animateToPosition}
        setVirtualPosition={setVirtualPosition}
        search={search}
        setSearch={setSearch}
        searchDisplayed={searchDisplayed}
        setSearchDisplayed={setSearchDisplayed}
      />
      <Wrapper>
        <HeaderAndContent>
          <Header />
          <Content>
            <UUIDDisplay
              itemsToShow={itemsToShow}
              setItemsToShow={setItemsToShow}
              virtualPosition={virtualPosition}
              setVirtualPosition={setVirtualPosition}
              favedUUIDs={favedUUIDs}
              toggleFavedUUID={toggleFavedUUID}
              isAnimating={isAnimating}
              MAX_POSITION={MAX_POSITION}
              animateToPosition={animateToPosition}
              search={search}
              searchDisplayed={searchDisplayed}
            />
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
    </>
  );
}

export default App;
