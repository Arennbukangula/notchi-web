"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface NotchiScreenshotsProps {
  locale?: string;
  className?: string;
}

type TabKey = "media" | "menu" | "side" | "desktop";
type ViewMode = "compact" | "expanded" | "desktop";

export default function NotchiScreenshots({ locale = "en", className }: NotchiScreenshotsProps) {
  const isId = locale === "id";
  const [activeTab, setActiveTab] = useState<TabKey>("media");
  const [viewMode, setViewMode] = useState<ViewMode>("expanded");

  const previews = {
    media: {
      name: isId ? "Pemutar Media" : "Media Player",
      desc: isId
        ? "Kontrol pemutar audio Windows SMTC dengan informasi trek, judul lagu, dan timeline interaktif."
        : "Active Windows SMTC audio playback overlay with track title, artist info, and interactive timeline.",
      compact: "/images/preview/compact-media-player.png",
      expanded: "/images/preview/media-player.png",
      desktop: "/images/preview/media-player-focus.png",
      compactLabel: isId ? "Ringkas" : "Compact",
      expandedLabel: isId ? "Terbuka" : "Expanded",
      hasDesktop: true,
    },
    menu: {
      name: isId ? "Menu Fitur" : "Feature Menu",
      desc: isId
        ? "Baki kontrol ringkas untuk mengakses catatan cepat, kalkulator, dan telemetri performa sistem."
        : "Quick-access tray for instant scratchpad notes, utilities, and live hardware telemetry.",
      compact: "/images/preview/compact-mode.png",
      expanded: "/images/preview/menu.png",
      desktop: "/images/preview/compact-media-player-focus.png",
      compactLabel: isId ? "Idle Notch" : "Idle Notch",
      expandedLabel: isId ? "Menu Baki" : "Expanded Menu",
      hasDesktop: true,
    },
    side: {
      name: isId ? "Dock Sisi Layar" : "Side Display Dock",
      desc: isId
        ? "Penempatan vertikal di tepi layar kiri atau kanan, ideal untuk monitor sekunder dan layar vertikal."
        : "Anchored to the vertical left or right display border, tailored for portrait and multi-monitor setups.",
      compact: "/images/preview/compact-mode.png",
      expanded: "/images/preview/side.png",
      desktop: "/images/preview/media-player-focus.png",
      compactLabel: isId ? "Idle" : "Idle",
      expandedLabel: isId ? "Dock Sisi" : "Side Dock",
      hasDesktop: true,
    },
    desktop: {
      name: isId ? "Tampilan Desktop Penuh" : "Desktop In-Context",
      desc: isId
        ? "Tangkapan layar resolusi tinggi memperlihatkan integrasi alami Notchi langsung pada desktop Windows."
        : "High-resolution desktop captures showing Notchi integrated seamlessly into actual Windows workflows.",
      compact: "/images/preview/compact-media-player-focus.png",
      expanded: "/images/preview/media-player-focus.png",
      desktop: "/images/preview/media-player-focus.png",
      compactLabel: isId ? "Desktop Compact" : "Desktop Compact",
      expandedLabel: isId ? "Desktop Media" : "Desktop Media Focus",
      hasDesktop: false,
    },
  };

  const current = previews[activeTab];

  // Resolve current image based on mode
  const currentImage =
    viewMode === "desktop"
      ? current.desktop
      : viewMode === "compact"
      ? current.compact
      : current.expanded;

  const isFullDesktopCapture =
    activeTab === "desktop" || viewMode === "desktop";

  return (
    <section className={cn("relative w-full border-b border-neutral-800 bg-neutral-950 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 text-white antialiased", className)}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-800">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">
              {isId ? "Tampilan Antarmuka" : "Interface Previews"}
            </p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-white">
              {isId ? "Kompak saat diam. Lengkap saat aktif." : "Compact when idle. Expanded on hover."}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-2xl font-normal leading-relaxed">
              {current.desc}
            </p>
          </div>

          {/* Controls: Tabs & View Modes */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Tabs */}
            <div className="flex border border-neutral-800 bg-neutral-900/80 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("media");
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono transition-colors rounded-none",
                  activeTab === "media" ? "bg-neutral-800 text-white font-medium" : "text-neutral-400 hover:text-white"
                )}
              >
                {isId ? "Media" : "Media"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("menu");
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono transition-colors rounded-none",
                  activeTab === "menu" ? "bg-neutral-800 text-white font-medium" : "text-neutral-400 hover:text-white"
                )}
              >
                {isId ? "Menu" : "Menu"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("side");
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono transition-colors rounded-none",
                  activeTab === "side" ? "bg-neutral-800 text-white font-medium" : "text-neutral-400 hover:text-white"
                )}
              >
                {isId ? "Sisi" : "Side"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("desktop");
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono transition-colors rounded-none",
                  activeTab === "desktop" ? "bg-neutral-800 text-white font-medium" : "text-neutral-400 hover:text-white"
                )}
              >
                {isId ? "Desktop" : "Desktop"}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-neutral-800 bg-neutral-900/80 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono transition-colors rounded-none",
                  viewMode === "compact" ? "bg-blue-600 text-white font-medium" : "text-neutral-400 hover:text-white"
                )}
              >
                {current.compactLabel}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("expanded")}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono transition-colors rounded-none",
                  viewMode === "expanded" ? "bg-blue-600 text-white font-medium" : "text-neutral-400 hover:text-white"
                )}
              >
                {current.expandedLabel}
              </button>
              {current.hasDesktop && (
                <button
                  type="button"
                  onClick={() => setViewMode("desktop")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-mono transition-colors rounded-none",
                    viewMode === "desktop" ? "bg-blue-600 text-white font-medium" : "text-neutral-400 hover:text-white"
                  )}
                >
                  {isId ? "Layar Penuh" : "Full Desktop"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sharp Frame Container */}
        <div className="mt-8 border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
          {/* Simulated Window Top Bar */}
          <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/70 px-4 py-2.5 text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-neutral-600" />
              <span>Windows Desktop • {current.name}</span>
            </div>
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider">
              {activeTab} • {viewMode}
            </span>
          </div>

          {/* Image Display Area */}
          <div
            className={cn(
              "w-full transition-all duration-200 flex items-center justify-center",
              isFullDesktopCapture
                ? "aspect-[16/10] bg-black p-0"
                : "min-h-[340px] sm:min-h-[440px] p-8 sm:p-14 bg-gradient-to-b from-neutral-900/40 via-neutral-950 to-neutral-950"
            )}
          >
            <img
              key={currentImage}
              src={currentImage}
              alt={`${current.name} - ${viewMode} view`}
              className={cn(
                "transition-all duration-200",
                isFullDesktopCapture
                  ? "h-full w-full object-cover object-top"
                  : "max-h-[300px] w-auto max-w-full object-contain filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
              )}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
