"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface NotchiRequirementsProps {
  locale?: string;
  className?: string;
}

export default function NotchiRequirements({ locale = "en", className }: NotchiRequirementsProps) {
  const isId = locale === "id";

  const steps = [
    {
      step: "01",
      title: isId ? "Unduh File Setup" : "Download Setup Executable",
      desc: isId
        ? "Ambil file installer NotchiSetup.exe versi stabil terbaru dari situs ini."
        : "Download the latest stable NotchiSetup.exe package from this site or GitHub.",
    },
    {
      step: "02",
      title: isId ? "Jalankan Instalasi Per-User" : "Run Per-User Setup",
      desc: isId
        ? "Notchi terpasang langsung di direktori profil Anda tanpa meminta hak akses Administrator."
        : "Installs directly to your user profile directory with zero UAC elevation prompts.",
    },
    {
      step: "03",
      title: isId ? "Notch Langsung Aktif" : "Overlay Appears Instantly",
      desc: isId
        ? "Overlay notch langsung muncul di bagian atas layar dan siap digunakan."
        : "The notch anchors to the top center of your display ready for immediate use.",
    },
  ];

  const specs = [
    {
      component: isId ? "Sistem Operasi" : "Operating System",
      min: "Windows 10 v2004 (Build 19041)",
      rec: "Windows 11 22H2 / 24H2",
    },
    {
      component: isId ? "Arsitektur" : "Architecture",
      min: "64-bit (x64)",
      rec: "64-bit (x64)",
    },
    {
      component: isId ? "Memori (RAM)" : "Memory (RAM)",
      min: "4 GB RAM",
      rec: "8 GB RAM (Idle <15MB)",
    },
    {
      component: isId ? "Penyimpanan" : "Disk Storage",
      min: "150 MB Free Space",
      rec: "SSD Storage",
    },
    {
      component: isId ? "Resolusi Layar" : "Display Resolution",
      min: "1280 × 720",
      rec: "1920 × 1080 or higher",
    },
  ];

  return (
    <section className={cn("relative w-full border-b border-neutral-800 bg-neutral-950 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 text-white antialiased", className)}>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl pb-8 border-b border-neutral-800">
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">
            {isId ? "Instalasi & Kompatibilitas" : "Installation & Requirements"}
          </p>
          <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-white">
            {isId ? "Tiga langkah cepat instalasi" : "Three-step quick install"}
          </h2>
        </div>

        {/* 3 Step Flat Grid */}
        <div className="mt-8 grid grid-cols-1 border-t border-l border-neutral-800 sm:grid-cols-3">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="border-r border-b border-neutral-800 bg-neutral-950 p-6 sm:p-8"
            >
              <span className="font-mono text-2xl font-semibold text-neutral-600">
                {item.step}
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* System Specs Table */}
        <div className="mt-12">
          <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-800">
            {isId ? "Tabel Persyaratan Sistem" : "System Compatibility Specs"}
          </h3>
          <div className="divide-y divide-neutral-800 border-b border-neutral-800 text-xs sm:text-sm">
            {specs.map((spec, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2">
                <span className="text-neutral-300 font-medium">{spec.component}</span>
                <div className="flex items-center gap-6 font-mono text-xs">
                  <span className="text-neutral-400">Min: {spec.min}</span>
                  <span className="text-neutral-600">|</span>
                  <span className="text-neutral-200">Rec: {spec.rec}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
