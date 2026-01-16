"use client";

import { useEffect, useRef, useState } from "react";

interface TextScrambleProps {
  texts: string[];
  className?: string;
  speed?: number;
}

const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?~`";

export default function TextScramble({
  texts,
  className = "",
  speed = 50,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(
    texts[0] ? texts[0].replace(/ /g, "\u00A0") : ""
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrambleRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const currentScrambleRef = useRef<NodeJS.Timeout | null>(null);
  const initialDelayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasPlayed(true);
        } else {
          // Reset when element leaves viewport so animation plays again when scrolling back
          setHasPlayed(false);
          setCurrentIndex(0);
          setDisplayText(texts[0] ? texts[0].replace(/ /g, "\u00A0") : "");
          // Clean up intervals
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (currentScrambleRef.current) {
            clearInterval(currentScrambleRef.current);
            currentScrambleRef.current = null;
          }
          if (initialDelayRef.current) {
            clearTimeout(initialDelayRef.current);
            initialDelayRef.current = null;
          }
        }
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [texts]);

  useEffect(() => {
    if (!hasPlayed) return;

    const scrambleText = (targetText: string, onComplete: () => void) => {
      let iteration = 0;

      const scrambleInterval = setInterval(() => {
        const scrambled = targetText
          .split("")
          .map((char, index) => {
            // Preserve spaces as non-breaking spaces
            if (char === " ") {
              return "\u00A0";
            }
            if (index < iteration) {
              return targetText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        setDisplayText(scrambled);

        if (iteration >= targetText.length) {
          clearInterval(scrambleInterval);
          setDisplayText(targetText.replace(/ /g, "\u00A0"));
          onComplete();
        }

        iteration += 1 / 3;
      }, 30);

      currentScrambleRef.current = scrambleInterval;
    };

    const changeText = () => {
      const nextIndex = (currentIndex + 1) % texts.length;
      const targetText = texts[nextIndex];

      scrambleText(targetText, () => {
        setCurrentIndex(nextIndex);
      });
    };

    // Initial delay before first change
    const initialDelay = setTimeout(() => {
      changeText();

      // Set up interval for subsequent changes
      intervalRef.current = setInterval(() => {
        changeText();
      }, 3000); // Change text every 3 seconds
    }, 2000);

    initialDelayRef.current = initialDelay;

    return () => {
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current);
        initialDelayRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (scrambleRef.current) {
        clearInterval(scrambleRef.current);
        scrambleRef.current = null;
      }
      if (currentScrambleRef.current) {
        clearInterval(currentScrambleRef.current);
        currentScrambleRef.current = null;
      }
    };
  }, [texts, currentIndex, hasPlayed]);

  return (
    <span ref={containerRef} className={`text-scramble ${className}`}>
      {displayText.split("").map((char, index) => (
        <span key={index} className="text-scramble__symbol">
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
