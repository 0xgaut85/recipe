"use client";

import { useRef, ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
}

export default function MagneticButton({
  children,
  className = "",
  style = {},
  href,
  target,
  rel,
  onClick,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 300 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    x.set(distanceX * 0.3);
    y.set(distanceY * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const motionProps = {
    ref: buttonRef as React.RefObject<HTMLAnchorElement & HTMLButtonElement>,
    className,
    style: {
      ...style,
      x: xSpring,
      y: ySpring,
    },
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };

  if (href) {
    return (
      <motion.a href={href} target={target} rel={rel} {...motionProps}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button onClick={onClick} {...motionProps}>
      {children}
    </motion.button>
  );
}
