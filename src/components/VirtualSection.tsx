import { SPEED, VIRTUAL_SECTION_ID } from "@/constants/constants";
import {
  findClosestElement,
  getActiveElement,
  getNearbyElements,
} from "@/utils/elements";
import { throttle } from "lodash-es";
import { useCallback, useEffect, useRef, useState } from "react";
import "./root.css";

export const VirtualSection = () => {
  const [positionY, setPositionY] = useState(100);
  const [activeLeft, setActiveLeft] = useState(0);
  const [activeRight, setActiveRight] = useState(0);
  const [activeTop, setActiveTop] = useState(0);
  const [activeBottom, setActiveBottom] = useState(0);
  let lastScrollY = window.scrollY;
  const ref = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<number>(-1);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const sectionElement = document.getElementById(VIRTUAL_SECTION_ID);

      if (!sectionElement) {
        return;
      }
      if (!ref.current) {
        return;
      }

      const top = positionY;
      const bottom = top + ref.current?.offsetHeight;

      const sectionHeight = sectionElement.offsetHeight;
      const viewportHeight = window.innerHeight;

      // scroll된 좌표 + 화면 길이 - 섹션 길이
      const maxPosition = window.scrollY + viewportHeight - sectionHeight;

      if (event.key === "ArrowUp") {
        setPositionY((prev) => {
          const newPos = Math.max(prev - SPEED, window.scrollY);
          return newPos;
        });
      } else if (event.key === "ArrowDown") {
        setPositionY((prev) => {
          const newPos = Math.min(prev + SPEED, maxPosition);
          return newPos;
        });
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const activeElement = getActiveElement(activeId);

        if (!activeElement) {
          return;
        }

        const nearbyElements = getNearbyElements(top, bottom).filter(
          (el) => el !== activeElement
        );

        const targetElement = findClosestElement(
          nearbyElements,
          event.key,
          activeLeft,
          activeRight,
          activeTop,
          activeBottom
        );

        if (targetElement) {
          setActiveId((prev) => {
            const newActiveId = Number(prev) + 1;
            targetElement.dataset.virtualId = newActiveId.toString();
            return newActiveId;
          });
        }
      }

      if (event.key === "Enter") {
        const activeElement = getActiveElement(activeId);
        if (activeElement) {
          activeElement.click();
        }
      }
    },
    [activeBottom, activeId, activeLeft, activeRight, activeTop, positionY]
  );

  const handleScroll = useCallback(() => {
    const scrollDelta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;

    // setPositionY((prev) => {
    //   const newPosition = prev + scrollDelta;

    //   return newPosition;
    // });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", throttle(handleScroll));
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleKeyDown, handleScroll]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const top = positionY;
    const bottom = top + ref.current?.offsetHeight;
    const overlappingElements = getNearbyElements(top, bottom);

    const activeElement = overlappingElements[0];

    if (!activeElement) {
      return;
    }

    setActiveId((prev) => {
      const newActiveId = Number(prev) + 1;
      activeElement.dataset.virtualId = newActiveId.toString();

      return newActiveId;
    });
  }, [positionY]);

  useEffect(() => {
    const activeElement = getActiveElement(activeId);

    console.log(activeElement);

    const rect = activeElement?.getBoundingClientRect();

    setActiveLeft(rect?.left ?? 0);
    setActiveRight(rect?.right ?? 0);
    setActiveTop(rect?.top ?? 0);
    setActiveBottom(rect?.bottom ?? 0);
    return () => {
      if (!activeElement) {
        return;
      }
      activeElement.removeAttribute("data-virtual-id");
    };
  }, [activeId]);

  return (
    <div
      id="virtual-section"
      ref={ref}
      style={{
        position: "absolute",
        top: `${positionY}px`,
      }}
    ></div>
  );
};
