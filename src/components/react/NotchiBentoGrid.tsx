"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface NotchiBentoGridProps {
  locale?: string;
  className?: string;
}

export default function NotchiBentoGrid({ locale = "en", className }: NotchiBentoGridProps) {
  const isId = locale === "id";

  const features = [
    {
      index: "01",
      title: isId ? "Kontrol Media Windows (SMTC)" : "Windows SMTC Media Controls",
      desc: isId
        ? "Terhubung langsung dengan API Windows SMTC. Menampilkan info lagu, album art, progress bar, dan tombol putar/jeda untuk Spotify, YouTube Music, dan browser audio."
        : "Direct integration with Windows System Media Transport Controls. View track title, album artwork, scrub progress, and playback buttons for Spotify, YouTube, and desktop players.",
    },
    {
      index: "02",
      title: isId ? "Telemetri Perangkat Keras" : "Hardware Telemetry",
      desc: isId
        ? "Melihat beban penggunaan CPU, kapasitas memori RAM, kecepatan baca/tulis disk, dan persentase baterai secara langsung tanpa membuka Task Manager."
        : "Live processor load, RAM consumption, storage activity, and battery status at a glance without launching Task Manager.",
    },
    {
      index: "03",
      title: isId ? "Catatan Cepat Otomatis Tersimpan" : "Persistent Quick Notes",
      desc: isId
        ? "Jendela catatan cepat mandiri dengan penyimpanan lokal otomatis. Sempurna untuk coretan to-do, tautan sementara, atau kode ringkas."
        : "A dedicated markdown scratchpad that saves state automatically to disk across launches. Ideal for temporary snippets and rapid checklists.",
    },
    {
      index: "04",
      title: isId ? "Rak File Drag and Drop" : "File Drop Shelf",
      desc: isId
        ? "Tarik file apa pun dari File Explorer langsung ke area notch untuk menahan file sementara, membuka direktori asal, atau menyalin path file ke clipboard."
        : "Drag files directly onto the notch to stage them, reveal their origin in Explorer, or copy file paths directly to the clipboard.",
    },
    {
      index: "05",
      title: isId ? "Penempatan di Tiga Sisi Layar" : "Screen Edge Anchoring",
      desc: isId
        ? "Dapat ditambatkan pada bagian tengah atas layar, sisi kiri, atau sisi kanan layar. Posisi disimpan otomatis untuk setiap monitor."
        : "Anchor to the top center, left edge, or right edge of your display with persistent memory across multi-monitor setups.",
    },
    {
      index: "06",
      title: isId ? "Arsitektur Native Tanpa Electron" : "Native WPF Architecture",
      desc: isId
        ? "Dibangun sepenuhnya dengan C# dan WPF tanpa Chromium webview. Menggunakan kurang dari 15 MB memori RAM dan 0% CPU saat idle."
        : "Compiled purely in C# WPF without Chromium or Electron runtimes. Consumes under 15 MB RAM and 0% CPU during idle background operation.",
    },
  ];

  return (
    <section
      id="features"
      className={cn(
        "relative w-full border-b border-neutral-800 bg-neutral-950 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 text-white antialiased",
        className
      )}
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="max-w-3xl">
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">
            {isId ? "Spesifikasi Fitur" : "Core Specifications"}
          </p>
          <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-white">
            {isId ? "Didesain fokus pada efisiensi kerja" : "Designed for desktop productivity"}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-400">
            {isId
              ? "Set fitur lengkap yang dirancang presisi untuk desktop Windows tanpa membebani sistem Anda."
              : "A focused set of desktop tools engineered for performance, staying out of the way until needed."}
          </p>
        </div>

        {/* Sharp Structural Grid (rounded-none, border-neutral-800, no AI bubble slop) */}
        <div className="mt-12 grid grid-cols-1 border-t border-l border-neutral-800 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between border-r border-b border-neutral-800 bg-neutral-950 p-6 sm:p-8 transition-colors hover:bg-neutral-900/40"
            >
              <div>
                <span className="font-mono text-xs text-neutral-500">
                  {item.index}
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-neutral-900 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                <span>Native Win32</span>
                <span>Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
