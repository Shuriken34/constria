"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  // Cine a cerut mai puțină mișcare vede doar primul cadru
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

  return (
    <>
      <div data-hero-media className="absolute inset-x-0 -top-[6%] -bottom-[6%] -z-10">
        <video
          ref={ref}
          className="h-full w-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-hidden="true"
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
