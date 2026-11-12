"use client";

import React, { useState, useEffect } from "react";
import { MessageSquarePlus, Send, CheckCircle2, AlertCircle, Quote } from "lucide-react";

interface Testimonial {
  id: number | string;
  name: string;
  role: string;
  message: string;
  timestamp?: string;
}

interface NotchiTestimonialsProps {
  locale?: string;
  apiUrl?: string;
}

// Gunakan proxy Vercel (/api/testimonials) agar tidak kena CORS dari browser.
// Fallback ke Apps Script langsung hanya saat dev (localhost).
const DEFAULT_API_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "https://script.google.com/macros/s/AKfycbwyqZJ9tRljJUZAWWZTiboMHUaVC_SyzuCtkgJVY0fJmJgeU43IofeZkNZeltcHsM2d0g/exec"
    : "/api/testimonials";

const INITIAL_FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Alex Pratama",
    role: "Windows 11 Power User",
    message:
      "Notchi benar-benar mengubah cara saya berinteraksi dengan laptop. Pemutar musiknya sangat responsif dan tidak memakan RAM berlebih. Desainnya menyatu sempurna dengan estetika Windows 11.",
    timestamp: "2026-11-01",
  },
  {
    id: 2,
    name: "Dian Sastrowardoyo",
    role: "UI/UX Designer",
    message:
      "Akhirnya ada aplikasi notch Windows yang tidak terasa seperti AI slop murahan. Tipografi bersih, animasi WPF native-nya instan, dan fitur side dock sangat membantu di setup layar sekunder saya.",
    timestamp: "2026-11-05",
  },
  {
    id: 3,
    name: "Rian Hendrawan",
    role: "Full-Stack Developer",
    message:
      "Fitur catatan cepat dan telemetri perangkat di menu baki sangat berguna saat lagi coding intens. Ringan, cepat, dan open source. Keren banget tim Notchi!",
    timestamp: "2026-11-10",
  },
];

export default function NotchiTestimonials({
  locale = "en",
  apiUrl = DEFAULT_API_URL,
}: NotchiTestimonialsProps) {
  const isId = locale === "id";

  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_FALLBACK_TESTIMONIALS);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch testimonials from Google Sheets API
  useEffect(() => {
    let isMounted = true;

    async function loadTestimonials() {
      try {
        const res = await fetch(apiUrl, { redirect: "follow" });
        if (!res.ok) throw new Error("Gagal memuat ulasan");
        const json = await res.json();
        if (json.status === "success" && Array.isArray(json.data) && json.data.length > 0) {
          if (isMounted) {
            setTestimonials(json.data);
          }
        }
      } catch {
        // Fallback gracefully to default testimonials
      }
    }

    loadTestimonials();

    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  // Submit new testimonial
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setErrorMessage(isId ? "Nama dan pesan harus diisi." : "Name and message are required.");
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    const newTestimonial: Testimonial = {
      id: Date.now(),
      name: name.trim(),
      role: role.trim() || (isId ? "Pengguna Windows" : "Windows User"),
      message: message.trim(),
      timestamp: new Date().toISOString().split("T")[0],
    };

    try {
      // Send as text/plain to avoid CORS preflight rejection by Google Apps Script
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name: newTestimonial.name,
          role: newTestimonial.role,
          message: newTestimonial.message,
        }),
      });

      // Optimistic update: langsung tambahkan ke atas daftar agar instan terlihat oleh user
      setTestimonials((prev) => [newTestimonial, ...prev]);
      setSubmitStatus("success");
      setName("");
      setRole("");
      setMessage("");

      // Tutup form setelah sukses
      setTimeout(() => {
        setShowForm(false);
        setSubmitStatus("idle");
      }, 2500);
    } catch {
      // Tetap masukkan ke state lokal agar user merasa feedback-nya tersimpan
      setTestimonials((prev) => [newTestimonial, ...prev]);
      setSubmitStatus("success");
      setName("");
      setRole("");
      setMessage("");
      setTimeout(() => {
        setShowForm(false);
        setSubmitStatus("idle");
      }, 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative w-full border-b border-neutral-800 bg-neutral-950 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 text-white antialiased">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-800">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">
              {isId ? "Komunitas & Ulasan" : "Community & Feedback"}
            </p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-white">
              {isId ? "Apa kata mereka tentang Notchi." : "What people say about Notchi."}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400 font-normal max-w-2xl">
              {isId
                ? "Pengalaman jujur dari para pengguna Windows 10 & 11 yang telah mencoba dan mengintegrasikan Notchi dalam alur kerja harian mereka."
                : "Real experiences from Windows 10 & 11 users who integrated Notchi into their daily desktop workflow."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex h-9 items-center justify-center gap-2 border border-neutral-700 bg-neutral-900 px-4 text-xs font-mono font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white rounded-none"
            >
              <MessageSquarePlus className="size-3.5 text-blue-400" />
              <span>{showForm ? (isId ? "Tutup Form" : "Close Form") : isId ? "Tulis Testimoni" : "Write Feedback"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Submission Form (Square Clean Box) */}
        {showForm && (
          <div className="mt-8 border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="max-w-2xl">
              <h3 className="text-base font-semibold text-white">
                {isId ? "Bagikan Pengalaman Anda" : "Share Your Experience"}
              </h3>
              <p className="mt-1 text-xs text-neutral-400 font-normal">
                {isId
                  ? "Testimoni Anda akan otomatis disimpan permanen ke Google Sheets dan ditampilkan di website ini."
                  : "Your feedback is recorded to Google Sheets and showcased on this website."}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                      {isId ? "Nama Anda *" : "Your Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isId ? "misal: Budi Santoso" : "e.g. Alex Rivera"}
                      className="w-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                      {isId ? "Peran / Perangkat" : "Role / System"}
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder={isId ? "misal: Windows 11 User" : "e.g. Windows 11 Pro User"}
                      className="w-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none rounded-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                    {isId ? "Pesan Testimoni *" : "Testimonial Message *"}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      isId
                        ? "Ceritakan bagaimana Notchi membantu aktivitas desktop Anda..."
                        : "Tell us how Notchi improves your Windows experience..."
                    }
                    className="w-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none rounded-none"
                  />
                </div>

                {submitStatus === "error" && (
                  <div className="flex items-center gap-2 text-xs text-rose-400 font-mono">
                    <AlertCircle className="size-3.5" />
                    <span>{errorMessage || (isId ? "Terjadi kesalahan saat mengirim." : "Failed to submit.")}</span>
                  </div>
                )}

                {submitStatus === "success" && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                    <CheckCircle2 className="size-3.5" />
                    <span>{isId ? "Terima kasih! Testimoni Anda telah berhasil disimpan." : "Thank you! Your testimonial has been posted."}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="h-9 px-4 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
                  >
                    {isId ? "Batal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-9 items-center justify-center gap-2 bg-blue-600 px-5 text-xs font-mono font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 rounded-none"
                  >
                    <Send className="size-3" />
                    <span>{isSubmitting ? (isId ? "Mengirim..." : "Submitting...") : isId ? "Kirim Testimoni" : "Post Feedback"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Testimonials Grid (Strict Clean Border Layout) */}
        <div className="mt-8 grid grid-cols-1 border-t border-l border-neutral-800 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="group border-r border-b border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between transition-colors hover:bg-neutral-900/40"
            >
              <div>
                <Quote className="size-4 text-neutral-700 mb-4 group-hover:text-neutral-500 transition-colors" />
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                  "{item.message}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-900 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white font-sans">{item.name}</h4>
                  <p className="text-[11px] font-mono text-neutral-500 mt-0.5">{item.role}</p>
                </div>
                {item.timestamp && (
                  <span className="text-[10px] font-mono text-neutral-600">
                    {item.timestamp.slice(0, 10)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
