"use client";

import React from "react";
import { ArrowRight, Download } from "lucide-react";
import { motion, type Variants } from "motion/react";

interface NotchiHeroProps {
  locale?: string;
  latestTag?: string;
  downloadUrl?: string;
  installerSize?: string;
  allVersionsUrl?: string;
  githubUrl?: string;
}

const sectionVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.15,
    },
  },
};

const softReveal: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", mass: 1.1, stiffness: 45, damping: 15 },
  },
};

const brandReveal: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", mass: 0.8, stiffness: 60, damping: 14 },
  },
};

export default function NotchiHero({
  locale = "en",
  latestTag = "v0.5.0",
  downloadUrl = "/download/latest",
  installerSize = "15 MB",
  allVersionsUrl = "/download/",
}: NotchiHeroProps) {
  const isId = locale === "id";

  const heading1 = isId ? "Notch Desktop" : "The Dynamic Notch";
  const heading2 = isId ? "Diciptakan untuk Windows" : "Engineered for Windows";
  const description = isId
    ? "Overlay desktop native dan ultra-ringan untuk Windows 10 & 11. Kontrol media, telemetri sistem, catatan cepat, dan rak file langsung pada layar Anda."
    : "A native, ultra-lightweight overlay for Windows 10 and 11. Media controls, hardware telemetry, quick notes, and file shelf anchored directly to your screen.";

  const primaryCta = isId ? "Unduh Notchi" : "Download Notchi";
  const secondaryCta = isId ? "Pilihan Installer" : "View Installer";
  const developedBy = isId ? "Dikembangkan oleh" : "Crafted by";

  return (
    <section className="relative isolate flex min-h-[82vh] w-full flex-col justify-between overflow-hidden bg-neutral-950 px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 text-white antialiased border-b border-neutral-800">
      {/* Background Gradient & Dual-Light Flare (Red on Left, Blue on Right as in photos) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Left Crimson / Red Flash Gradient */}
        <div className="absolute -bottom-10 -left-20 h-[500px] w-[580px] rounded-full bg-red-600/30 blur-[140px] opacity-90" />
        <div className="absolute top-1/2 -left-10 h-[360px] w-[420px] rounded-full bg-rose-700/20 blur-[150px]" />

        {/* Right Cobalt / Electric Blue Flash Gradient */}
        <div className="absolute -bottom-10 -right-20 h-[500px] w-[580px] rounded-full bg-blue-600/35 blur-[140px] opacity-90" />
        <div className="absolute top-1/3 -right-10 h-[380px] w-[440px] rounded-full bg-cyan-600/20 blur-[150px]" />

        {/* Center ambient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/80" />
      </div>

      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        {/* Centered Main Heading (Exactly 2 Lines: Heading 1 & Heading 2) */}
        <motion.div variants={softReveal} className="mx-auto max-w-5xl">
          <h1 className="text-[clamp(1.85rem,4.6vw,5.25rem)] leading-[1.04] font-light tracking-tight text-white/95">
            <span className="block font-sans whitespace-nowrap">{heading1}</span>
            <span className="mt-2 sm:mt-3 block font-serif text-[0.98em] leading-[0.96] font-normal text-white italic whitespace-nowrap">
              {heading2}
            </span>
          </h1>
        </motion.div>

        {/* Centered Subtitle */}
        <motion.p
          variants={softReveal}
          className="mt-6 max-w-xl text-center text-sm sm:text-base leading-relaxed text-white/70 font-normal text-pretty"
        >
          {description}
        </motion.p>

        {/* Centered Buttons (Sharp Clean Box Layout, No Rounded Corners) */}
        <motion.div
          variants={softReveal}
          className="mt-8 flex flex-wrap items-center justify-center gap-3.5"
        >
          <a
            href={downloadUrl}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-none bg-zinc-100 px-6 text-sm font-medium text-neutral-900 border border-zinc-200 transition-all duration-150 ease-out hover:bg-white hover:text-black active:translate-y-px"
          >
            <Download className="size-4" />
            <span>{primaryCta}</span>
            {latestTag && (
              <span className="ml-1 text-xs text-neutral-500 font-mono">
                ({latestTag} {installerSize ? `• ${installerSize}` : ""})
              </span>
            )}
          </a>

          <a
            href={allVersionsUrl}
            className="group/secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-none border border-neutral-700 bg-neutral-900/90 px-5 text-sm font-normal text-white backdrop-blur-md transition-all duration-150 ease-out hover:bg-neutral-800 hover:border-neutral-600 active:translate-y-px"
          >
            <span>{secondaryCta}</span>
            <ArrowRight className="size-3.5 transition-transform duration-150 ease-out group-hover/secondary:translate-x-0.5" />
          </a>
        </motion.div>
      </motion.div>

      {/* Bottom Brand Bar: Risunity Works (Matching Photo 2) */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.8 }}
        className="relative z-10 mx-auto mt-14 w-full max-w-4xl text-center"
      >
        <motion.p
          variants={softReveal}
          className="text-xs font-mono font-medium tracking-[0.2em] text-neutral-400/70 uppercase"
        >
          {developedBy}
        </motion.p>

        <motion.div
          variants={brandReveal}
          className="mt-3.5 flex items-center justify-center gap-3.5"
        >
          <a
            href="https://github.com/risuunava"
            target="_blank"
            rel="noopener noreferrer"
            className="group/brand inline-flex items-center gap-3.5 transition-opacity hover:opacity-85"
          >
            <img
              src="/images/risunity.png"
              alt="Risunity Works"
              className="size-12 sm:size-14 object-contain"
            />
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-400/90 group-hover:text-neutral-200 transition-colors">
              Risunity Works
            </span>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
