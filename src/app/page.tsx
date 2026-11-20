import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Motion } from "@/components/Motion";
import { Quote } from "@/components/Quote";
import { GazeboBand, Hero, Manifest, Marquee, Process, RoofBand, Services } from "@/components/sections";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-plum-900 focus:px-5 focus:py-3 focus:text-cream"
      >
        Sari la conținut
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Hero />
        <Marquee />
        <Services />
        <Manifest />
        <RoofBand />
        <Process />
        <GazeboBand />
        <Quote />
      </main>
      <Footer />
      <Motion />
    </>
  );
}
