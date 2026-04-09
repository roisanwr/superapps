"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  // Outer ring — lagging behind
  const outerX = useSpring(mouseX, { damping: 20, stiffness: 200, mass: 0.6 });
  const outerY = useSpring(mouseY, { damping: 20, stiffness: 200, mass: 0.6 });

  // Inner dot — snappy
  const dotX = useSpring(mouseX, { damping: 40, stiffness: 1000 });
  const dotY = useSpring(mouseY, { damping: 40, stiffness: 1000 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Outer ring: centered via marginLeft/Top = -(size/2) */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-primary/30 pointer-events-none z-[9000] hidden md:block"
        style={{ x: outerX, y: outerY, marginLeft: -16, marginTop: -16 }}
      />
      {/* Inner filled dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-primary pointer-events-none z-[9001] hidden md:block"
        style={{ x: dotX, y: dotY, marginLeft: -3, marginTop: -3 }}
      />
    </>
  );
}
