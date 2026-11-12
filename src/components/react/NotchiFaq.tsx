"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface NotchiFaqProps {
  locale?: string;
  className?: string;
  items?: FaqItem[];
}

export default function NotchiFaq({ locale = "en", className, items }: NotchiFaqProps) {
  const isId = locale === "id";
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const defaultItems: FaqItem[] = items || [
    {
      question: isId ? "Apakah Notchi hanya berjalan di Windows?" : "Does Notchi only run on Windows?",
      answer: isId
        ? "Ya, Notchi dibangun khusus di atas Windows Presentation Foundation (WPF) dengan API natif Windows (SMTC, DWM). Karena itu Notchi hanya kompatibel dengan Windows 10 dan Windows 11 (64-bit)."
        : "Yes, Notchi is custom-engineered using Windows Presentation Foundation (WPF) and native Win32/SMTC APIs. It exclusively supports 64-bit Windows 10 and Windows 11.",
    },
    {
      question: isId ? "Kenapa muncul peringatan Windows Defender SmartScreen?" : "Why does Windows SmartScreen flag the installer?",
      answer: isId
        ? "Sebagai aplikasi open source independen tanpa sertifikat code-signing komersial, Windows SmartScreen dapat menampilkan dialog verifikasi. Klik 'More info' lalu 'Run anyway' untuk melanjutkan instalasi dengan aman."
        : "As a community open-source project without a paid commercial signing certificate, Windows SmartScreen may present an unknown publisher screen. Click 'More info' and 'Run anyway' to continue.",
    },
    {
      question: isId ? "Apakah Notchi membutuhkan hak akses Administrator?" : "Does Notchi require administrator privileges?",
      answer: isId
        ? "Tidak. Notchi diinstal per-pengguna ke dalam direktori %LocalAppData% dan dapat dijalankan sepenuhnya tanpa akun Administrator atau izin khusus."
        : "No. Notchi installs strictly within your user profile directory (%LocalAppData%) and operates completely under standard user rights without elevation prompts.",
    },
    {
      question: isId ? "Bagaimana cara rollback atau memasang versi sebelumnya?" : "How can I rollback or install a prior version?",
      answer: isId
        ? "Anda dapat mengunduh installer atau arsip portabel dari rilis versi sebelumnya di halaman Versions. Setiap versi dapat dipasang secara berdampingan atau menimpa instalasi lama dengan aman."
        : "You can download previous installers or standalone portable zip packages directly from the Versions page. All versions maintain clean state separation.",
    },
  ];

  return (
    <section id="faq" className={cn("relative w-full border-b border-neutral-800 bg-neutral-950 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 text-white antialiased", className)}>
      <div className="mx-auto max-w-4xl">
        <div className="pb-8 border-b border-neutral-800">
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">
            FAQ
          </p>
          <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-white">
            {isId ? "Pertanyaan umum" : "Frequently asked questions"}
          </h2>
        </div>

        <div className="divide-y divide-neutral-800 border-b border-neutral-800">
          {defaultItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between text-left transition-colors hover:text-neutral-300"
                >
                  <span className="text-base sm:text-lg font-medium text-white">
                    {item.question}
                  </span>
                  <div className={cn("ml-4 shrink-0 transition-transform duration-200 text-neutral-500", isOpen && "rotate-180 text-white")}>
                    <ChevronDown className="size-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 text-sm text-neutral-400 leading-relaxed font-normal">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
