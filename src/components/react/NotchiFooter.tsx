"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface NotchiFooterProps {
  locale?: string;
  className?: string;
  allReleasesUrl?: string;
  docsUrl?: string;
  teamUrl?: string;
  githubUrl?: string;
  rssUrl?: string;
  issuesUrl?: string;
}

export default function NotchiFooter({
  locale = "en",
  className,
  allReleasesUrl = "/download/",
  docsUrl = "/docs/",
  teamUrl = "/team/",
  githubUrl = "https://github.com/risuunava/Notchi",
  rssUrl = "/rss.xml",
  issuesUrl = "https://github.com/risuunava/Notchi/issues",
}: NotchiFooterProps) {
  const isId = locale === "id";
  const year = new Date().getFullYear();

  const columns = [
    {
      title: isId ? "Produk" : "Product",
      links: [
        { label: "Installer", href: allReleasesUrl },
        { label: isId ? "Dokumentasi" : "Documentation", href: docsUrl },
        { label: isId ? "Tim & Kontributor" : "Team & Contributors", href: teamUrl },
      ],
    },
    {
      title: isId ? "Sumber Daya" : "Resources",
      links: [
        { label: isId ? "Kode Sumber" : "Source Code", href: githubUrl },
        { label: isId ? "Laporkan Isu" : "Report an Issue", href: issuesUrl },
        { label: isId ? "Feed RSS Rilis" : "Release Feed (RSS)", href: rssUrl },
      ],
    },
    {
      title: isId ? "Komunitas" : "Community",
      links: [
        { label: "GitHub Releases", href: `${githubUrl}/releases` },
        { label: "GitHub Discussions", href: `${githubUrl}/discussions` },
      ],
    },
    {
      title: isId ? "Legalitas" : "Legal",
      links: [
        { label: "Apache-2.0 License", href: `${githubUrl}/blob/main/LICENSE` },
        { label: isId ? "Keamanan & SHA256" : "Security & Hashes", href: allReleasesUrl },
      ],
    },
  ];

  return (
    <footer className={cn("w-full border-t border-neutral-800 bg-neutral-950 py-16 px-4 sm:px-6 lg:px-8 text-neutral-400 antialiased", className)}>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/images/icon.png" alt="Notchi" className="size-6 object-contain" />
              <span className="text-lg font-semibold tracking-tight text-white font-sans">
                Notchi
              </span>
            </div>
            <p className="max-w-sm text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
              {isId
                ? "Overlay desktop native dan ringan untuk Windows 10 & 11, terinspirasi oleh notch macOS dan Dynamic Island."
                : "A native, lightweight notch overlay for Windows 10 and 11, inspired by the macOS notch and Dynamic Island."}
            </p>
          </div>

          {/* Links Columns */}
          {columns.map((col, idx) => (
            <div key={idx} className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-300">
                {col.title}
              </p>
              <ul className="space-y-2 text-xs sm:text-sm">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <a
                      href={link.href}
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar - Clean and Minimal */}
        <div className="mt-14 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 font-mono">
          <span>&copy; {year} Notchi Project. Licensed under Apache-2.0.</span>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 transition-colors"
          >
            github.com/risuunava/Notchi
          </a>
        </div>
      </div>
    </footer>
  );
}
