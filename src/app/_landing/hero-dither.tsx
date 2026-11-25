"use client";

import dynamic from "next/dynamic";
import type { DitherProps } from "./dither";

const Dither = dynamic<DitherProps>(
  () => import("./dither").catch(() => ({ default: () => null })),
  { ssr: false },
);

const grayscale = ["#101010", "#262626", "#444444", "#626262"];

export function HeroDither() {
  return (
    <Dither
      palette={grayscale}
      waveSpeed={0.038}
      pixelSize={3}
      dpr={1}
      scale={0.95}
      brightness={0.12}
      enableMouseInteraction={false}
      clickRipple={false}
      intro={false}
    />
  );
}
