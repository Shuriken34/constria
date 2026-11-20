"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

// Rulează clipurile pe rând (unul singur se repetă). Are buton de pauză și
// nu pornește singur pentru cine a cerut mai puțină mișcare.
export function HeroVideo({ clips, poster }: { clips: string[]; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current?.pause();
    }
  }, []);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }

  function next() {
    setIndex((i) => (i + 1) % clips.length);
  }

  return (
    <>
      <div data-hero-media className="absolute inset-x-0 -top-[6%] -bottom-[6%] -z-10">
        <video
          ref={ref}
          key={clips[index]}
          className="h-full w-full object-cover"
          src={clips[index]}
          poster={index === 0 ? poster : undefined}
          autoPlay
          muted
          loop={clips.length === 1}
          playsInline
          preload="metadata"
          aria-hidden="true"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={next}
          onError={() => {
            // Un clip care nu poate fi redat (format nesuportat, link stricat) e sărit
            if (clips.length > 1) next();
          }}
        />
        <div className="absolute inset-0 bg-plum-700 opacity-40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(46,0,26,0.55)_0%,rgba(46,0,26,0.25)_40%,rgba(46,0,26,0.85)_100%)]" />
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Oprește videoul" : "Pornește videoul"}
        className="absolute top-5 right-[clamp(16px,4vw,48px)] z-10 grid h-12 w-12 place-items-center rounded-full border border-cream/40 text-cream backdrop-blur-sm hover:bg-cream/15"
      >
        {playing ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
      </button>
    </>
  );
}
