"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Toate animațiile paginii, într-un singur loc.
// Elementele sunt marcate în HTML cu clase/atribute (hero-rise, reveal, data-parallax...).
export function Motion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Hero: rândurile uriașe urcă din spatele unei măști, apoi restul apare
      gsap.to(".hero-rise", { y: 0, duration: 1.15, ease: "power4.out", stagger: 0.12, delay: 0.1 });
      gsap.to(".hero-fade", { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.55 });

      // Hero: la scroll, rândurile alunecă în direcții opuse, iar videoul coboară mai încet
      gsap.utils.toArray<HTMLElement>("[data-hero-line]").forEach((line) => {
        const dir = Number(line.dataset.heroLine);
        gsap.to(line, {
          xPercent: -dir * 8,
          ease: "none",
          scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
        });
      });
      gsap.to("[data-hero-media]", {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
      });

      // Apariții la scroll, în grup
      ScrollTrigger.batch(".reveal", {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }),
      });

      // Paralaxă pe fotografii
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      // Manifest: cuvintele se aprind pe rând
      const words = gsap.utils.toArray<HTMLElement>(".fill-text .w");
      if (words.length) {
        ScrollTrigger.create({
          trigger: ".fill-text",
          start: "top 80%",
          end: "bottom 45%",
          scrub: true,
          onUpdate: (st) => {
            const n = Math.round(st.progress * words.length);
            words.forEach((w, k) => w.classList.toggle("is-on", k < n));
          },
        });
      }

      // Cum lucrăm: linia care leagă pașii se umple la scroll
      gsap.fromTo(
        "[data-progress-line]",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: "[data-process]", start: "top 75%", end: "bottom 65%", scrub: true },
        },
      );
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      document.querySelectorAll(".fill-text .w").forEach((w) => w.classList.add("is-on"));
    });

    // Imaginile încărcate târziu schimbă înălțimile: recalculăm pozițiile
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => window.removeEventListener("load", refresh);
  });

  return null;
}
