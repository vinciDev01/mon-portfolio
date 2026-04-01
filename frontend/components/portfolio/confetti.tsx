"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function Confetti() {
  useEffect(() => {
    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const colors = ["#F0E68C", "#DAA520", "#FFD700", "#BDB76B", "#8B7D3C", "#1a1a1a"];

    // Phase 1: Center burst (immediate)
    const centerBurst = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.4 },
        colors,
        gravity: 0.8,
        ticks: 300,
        shapes: ["square", "circle"],
        scalar: 1.1,
      });
    }, 200);

    // Phase 2: Side cannons (staggered)
    const leftCannon = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 50,
        startVelocity: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        gravity: 1,
        ticks: 250,
      });
    }, 500);

    const rightCannon = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 50,
        startVelocity: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        gravity: 1,
        ticks: 250,
      });
    }, 700);

    // Phase 3: Gentle rain
    const duration = 1800;
    const end = Date.now() + duration;
    const rain = setTimeout(() => {
      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 90,
          spread: 160,
          startVelocity: 15,
          origin: { x: Math.random(), y: -0.1 },
          colors,
          gravity: 0.6,
          ticks: 200,
          scalar: 0.8,
        });
        if (Date.now() < end + 900) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }, 900);

    return () => {
      clearTimeout(centerBurst);
      clearTimeout(leftCannon);
      clearTimeout(rightCannon);
      clearTimeout(rain);
    };
  }, []);

  return null;
}
