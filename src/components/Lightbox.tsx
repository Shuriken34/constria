"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Photo = { src: string; alt: string; w: number; h: number };

// Galerie cu poze care se deschid mare la clic, cu săgeți și tastele ← → / Esc.
export function Lightbox({ photos }: { photos: Photo[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();
  const step = (d: number) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length));

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const onClose = () => setIndex(null);
    el.addEventListener("keydown", onKey);
    el.addEventListener("close", onClose);
    return () => {
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("close", onClose);
    };
    // step folosește doar setState funcțional și photos.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  const current = index === null ? null : photos[index];

  return (
    <>
      <ul className="columns-1 gap-3.5 sm:columns-2 lg:columns-3">
        {photos.map((p, i) => (
          <li key={p.src} className="reveal mb-3.5 break-inside-avoid">
            <button
              type="button"
              onClick={() => open(i)}
              className="group block w-full overflow-hidden rounded-[18px]"
              aria-label={`Mărește fotografia: ${p.alt}`}
            >
              <Image
                src={p.src}
                alt={p.alt}
                width={p.w}
                height={p.h}
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                className="h-auto w-full transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label="Fotografie mărită"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-plum-950/95 p-0 text-cream backdrop:bg-plum-950/80"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {current && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-[clamp(16px,4vw,48px)] py-4">
              <span className="font-semibold text-cream/80">
                {(index ?? 0) + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Închide"
                className="grid h-12 w-12 place-items-center rounded-full border border-cream/30 hover:bg-cream/10"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-[clamp(16px,4vw,48px)] pb-6">
              <Image
                key={current.src}
                src={current.src}
                alt={current.alt}
                width={current.w}
                height={current.h}
                unoptimized
                className="h-auto max-h-[78dvh] w-auto max-w-full rounded-[18px] object-contain"
              />
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Fotografia anterioară"
                className="absolute left-3 grid h-12 w-12 place-items-center rounded-full bg-plum-900/80 hover:bg-red-strong sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Fotografia următoare"
                className="absolute right-3 grid h-12 w-12 place-items-center rounded-full bg-plum-900/80 hover:bg-red-strong sm:right-6"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <p className="px-[clamp(16px,4vw,48px)] pb-6 text-center text-cream/80">{current.alt}</p>
          </div>
        )}
      </dialog>
    </>
  );
}
