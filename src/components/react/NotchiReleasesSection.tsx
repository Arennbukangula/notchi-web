"use client";

import React from "react";
import { Download, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotchiReleasesSectionProps {
  locale?: string;
  latestTag?: string;
  latestDate?: string;
  installerUrl?: string;
  portableUrl?: string;
  mobileUrl?: string;
  allReleasesUrl?: string;
}

export default function NotchiReleasesSection({
  locale = "en",
  latestTag = "v0.5.0",
  installerUrl = "/download/latest",
  portableUrl = "/download/",
  mobileUrl = "/mobile/",
  allReleasesUrl = "/download/",
}: NotchiReleasesSectionProps) {
  const isId = locale === "id";

  const packages = [
    {
      format: "EXE / MSI",
      title: isId ? `Windows Setup Installer (${latestTag})` : `Windows Setup Installer (${latestTag})`,
      desc: isId
        ? "Paket instalasi per-pengguna otomatis (%LocalAppData%). Tidak memerlukan izin Administrator."
        : "Automated per-user installation (%LocalAppData%). Operates without administrator rights.",
      target: "Windows 10 / 11 (x64)",
      action: isId ? "Unduh Installer" : "Download Setup",
      href: installerUrl,
      primary: true,
    },
    {
      format: "ZIP / 7Z",
      title: isId ? "Standalone Portable Archive" : "Standalone Portable Archive",
      desc: isId
        ? "Ekstrak arsip dan langsung jalankan tanpa proses instalasi. Sempurna untuk flash drive USB."
        : "Extract and run directly with zero system modification. Portable for external drives.",
      target: "Windows 10 / 11 (x64)",
      action: isId ? "Pilih Arsip" : "Browse Archive",
      href: portableUrl,
      primary: false,
    },
    {
      format: "APK / AAB",
      title: isId ? "Notchi Mobile Companion" : "Notchi Mobile Companion",
      desc: isId
        ? "Aplikasi pendamping smartphone Android untuk kendali remote dan sinkronisasi status perangkat."
        : "Android companion app for remote telemetry and media playback synchronization.",
      target: "Android 8.0+",
      action: isId ? "Buka Halaman Mobile" : "View Mobile",
      href: mobileUrl,
      primary: false,
    },
  ];

  return (
    <section className="relative w-full border-b border-neutral-800 bg-neutral-950 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 text-white antialiased">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-neutral-800">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">
              {isId ? "Distribusi Resmi" : "Official Packages"}
            </p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-white">
              {isId ? "Pilihan Paket Unduhan" : "Download Packages"}
            </h2>
          </div>
          <a
            href={allReleasesUrl}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
          >
            <span>{isId ? "Lihat semua catatan rilis" : "View all release changelogs"}</span>
            <ArrowRight className="size-3.5" />
          </a>
        </div>

        {/* 3-Column Sharp Grid (rounded-none) */}
        <div className="mt-8 grid grid-cols-1 border-t border-l border-neutral-800 sm:grid-cols-3">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between border-r border-b border-neutral-800 bg-neutral-950 p-6 sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-xs text-neutral-500">
                  <span>{pkg.format}</span>
                  <span>{pkg.target}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {pkg.title}
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  {pkg.desc}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-900">
                <a
                  href={pkg.href}
                  className={cn(
                    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-none text-xs font-medium transition-colors font-mono",
                    pkg.primary
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  )}
                >
                  <Download className="size-3.5" />
                  <span>{pkg.action}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Checksum & Hash Notice */}
        <div className="mt-8 border border-neutral-800 bg-neutral-900/30 p-4 text-xs font-mono text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>SHA-256 verification hashes are published with every GitHub Release tag.</span>
          <a
            href="https://github.com/risuunava/Notchi/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 hover:text-white underline underline-offset-4"
          >
            github.com/risuunava/Notchi/releases
          </a>
        </div>
      </div>
    </section>
  );
}
