"use client";

import React, { useState } from "react";
import { ArrowUpRight, Download, Monitor, Smartphone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReleaseAssetItem {
  name: string;
  size: number;
  url: string;
  kind?: string;
  downloadCount?: number;
}

export interface ReleaseItem {
  tag: string;
  version: string;
  publishedAt: string;
  prerelease?: boolean;
  isLatestStable?: boolean;
  htmlUrl: string;
  primaryInstaller?: ReleaseAssetItem;
  assets?: ReleaseAssetItem[];
}

interface NotchiInstallerGridProps {
  windowsReleases: ReleaseItem[];
  mobileReleases: ReleaseItem[];
  locale?: string;
  initialTab?: "windows" | "mobile";
  className?: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatDate(dateStr: string, locale: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function NotchiInstallerGrid({
  windowsReleases,
  mobileReleases,
  locale = "en",
  initialTab = "windows",
  className,
}: NotchiInstallerGridProps) {
  const isId = locale === "id";
  const [activeTab, setActiveTab] = useState<"windows" | "mobile">(initialTab);
  const [showPrereleases, setShowPrereleases] = useState(false);

  const currentReleases = activeTab === "windows" ? windowsReleases : mobileReleases;
  const filteredReleases = showPrereleases
    ? currentReleases
    : currentReleases.filter((r) => !r.prerelease);

  const hasPrereleases = currentReleases.some((r) => r.prerelease);

  return (
    <div className={cn("w-full text-white antialiased", className)}>
      {/* Category Tabs: Windows vs Mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex border border-neutral-800 bg-neutral-900 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("windows")}
            className={cn(
              "flex items-center gap-2 px-5 py-2 text-xs font-mono font-medium transition-colors",
              activeTab === "windows"
                ? "bg-blue-600 text-white font-semibold"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <Monitor className="size-3.5" />
            <span>Windows Desktop ({windowsReleases.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mobile")}
            className={cn(
              "flex items-center gap-2 px-5 py-2 text-xs font-mono font-medium transition-colors",
              activeTab === "mobile"
                ? "bg-blue-600 text-white font-semibold"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <Smartphone className="size-3.5" />
            <span>Android Mobile ({mobileReleases.length})</span>
          </button>
        </div>

        {hasPrereleases && (
          <button
            type="button"
            onClick={() => setShowPrereleases(!showPrereleases)}
            className={cn(
              "self-start sm:self-auto px-3.5 py-1.5 text-xs font-mono border border-neutral-800 transition-colors",
              showPrereleases
                ? "bg-neutral-800 text-white"
                : "bg-neutral-950 text-neutral-400 hover:text-white"
            )}
          >
            {showPrereleases
              ? (isId ? "Sembunyikan Pre-release" : "Hide Pre-releases")
              : (isId ? "Tampilkan Pre-release" : "Show Pre-releases")}
          </button>
        )}
      </div>

      {/* Target Info Bar */}
      <div className="my-6 flex items-center justify-between text-xs text-neutral-400 font-mono">
        <span>
          {activeTab === "windows"
            ? (isId ? "Target: Windows 10 & Windows 11 (x64) · Native WPF" : "Target: Windows 10 & Windows 11 (x64) · Native WPF")
            : (isId ? "Target: Android 8.0+ · APK / AAB Companion" : "Target: Android 8.0+ · APK / AAB Companion")}
        </span>
        <span className="text-neutral-500">
          {filteredReleases.length} {isId ? "rilis ditemukan" : "releases available"}
        </span>
      </div>

      {/* Grid of Releases (Exact blog-1 style from uploaded photo) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredReleases.map((release, idx) => {
          const installer = release.primaryInstaller;
          const detailUrl = activeTab === "windows"
            ? `/${locale === "id" ? "id/" : ""}download/${encodeURIComponent(release.version)}/`
            : `/${locale === "id" ? "id/" : ""}mobile/${encodeURIComponent(release.version)}/`;

          const downloadLink = installer?.url || release.htmlUrl;

          return (
            <div
              key={idx}
              className="group relative flex flex-col justify-between border border-neutral-800 bg-neutral-900/40 p-6 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-900/70"
            >
              {/* Card Top: Date & Badge */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">
                  {formatDate(release.publishedAt, locale)}
                </span>
                {release.isLatestStable && (
                  <span className="bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] text-blue-400 font-semibold">
                    Latest
                  </span>
                )}
                {release.prerelease && (
                  <span className="bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-400">
                    Pre-release
                  </span>
                )}
              </div>

              {/* Card Middle: Title & Target */}
              <div className="my-6">
                <a href={detailUrl} className="hover:underline">
                  <h3 className="text-lg font-semibold text-white leading-snug group-hover:text-blue-300 transition-colors">
                    {release.tag}
                  </h3>
                </a>
                <p className="mt-2 text-xs text-neutral-400 line-clamp-2">
                  {activeTab === "windows"
                    ? (isId ? "Installer resmi Windows WPF dengan checksum SHA-256." : "Official Windows WPF setup package with verified SHA-256 hashes.")
                    : (isId ? "Paket instalasi Android companion untuk Notchi." : "Android companion package for Notchi remote integration.")}
                </p>
              </div>

              {/* Card Bottom: Accent Filename & Size (Left) + Sharp Square Arrow (Right) */}
              <div className="flex items-end justify-between border-t border-neutral-800/80 pt-4">
                <div className="min-w-0 pr-3">
                  <p className="truncate text-xs font-mono font-semibold text-emerald-400">
                    {installer?.name || `${release.tag}.zip`}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                    {installer ? formatBytes(installer.size) : "Release Archive"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={downloadLink}
                    className="flex size-8 items-center justify-center border border-neutral-800 bg-neutral-950 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
                    title={isId ? "Unduh langsung" : "Direct download"}
                  >
                    <Download className="size-3.5" />
                  </a>
                  <a
                    href={detailUrl}
                    className="flex size-8 items-center justify-center border border-neutral-800 bg-neutral-950 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
                    title={isId ? "Lihat detail" : "View details"}
                  >
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReleases.length === 0 && (
        <div className="my-12 border border-neutral-800 bg-neutral-900/20 p-8 text-center text-neutral-400 font-mono text-sm">
          {isId ? "Tidak ada rilis yang ditemukan." : "No releases found for this filter."}
        </div>
      )}

      {/* Security Verification Bar */}
      <div className="mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-neutral-800 bg-neutral-900/30 p-4 text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
          <span>Automated CI/CD build artifacts with SHA-256 verification.</span>
        </div>
        <a
          href="https://github.com/risuunava/Notchi/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-300 hover:text-white underline underline-offset-4"
        >
          Browse GitHub Releases
        </a>
      </div>
    </div>
  );
}

