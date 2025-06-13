/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

// Import hai component
import BlobCursor from "@/components/animation/BlobCursor";
import SplashCursor from "@/components/animation/SplashCursor";

// Định nghĩa type hiệu ứng
type CursorEffect = {
  Component: React.ComponentType<any>;
  props?: Record<string, any>;
};

// Danh sách hiệu ứng với props tương ứng
const cursorEffects: CursorEffect[] = [
  {
    Component: BlobCursor,
    props: {
      blobType: "circle",
      fillColor: "#5227FF",
      trailCount: 3,
      sizes: [60, 125, 75],
      innerSizes: [20, 35, 25],
      innerColor: "rgba(255,255,255,0.8)",
      opacities: [0.6, 0.6, 0.6],
      shadowColor: "rgba(0,0,0,0.75)",
      shadowBlur: 5,
      shadowOffsetX: 10,
      shadowOffsetY: 10,
      filterStdDeviation: 30,
      useFilter: true,
      fastDuration: 0.1,
      slowDuration: 0.5,
      zIndex: 100,
    },
  },
  {
    Component: SplashCursor,
    props: {}, // Không cần props
  },
];

function CursorCustom() {
  const [Effect, setEffect] = useState<CursorEffect | null>(null);

  useEffect(() => {
    const random = Math.floor(Math.random() * cursorEffects.length);
    setEffect(cursorEffects[random]);
  }, []);

  if (!Effect) return null;

  const { Component, props } = Effect;
  return <Component {...props} />;
}

export default CursorCustom;
