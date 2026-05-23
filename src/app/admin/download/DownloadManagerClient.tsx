"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, Search, FileText, Download, Sparkles, ExternalLink, Clock, Save, Loader2 } from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  storageType: string;
  downloadCount: number;
  createdAt: Date;
}

export default function DownloadManagerClient({ initialMedia }: { initialMedia: MediaItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(12);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.downloadCountdown) {
          setCountdown(parseInt(data.downloadCountdown) || 12);
        }
        setLoadingSettings(false);
      })
      .catch(() => setLoadingSettings(false));
  }, []);

  const handleSaveCountdown = async () => {
    setSavingSettings(true);
    setSavedSettings(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadCountdown: String(countdown) }),
      });
      if (res.ok) {
        setSavedSettings(true);
        setTimeout(() => setSavedSettings(false), 2000);
      } else {
        alert("Failed to save countdown setting");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving setting");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredMedia = initialMedia.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.mimeType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination slicing parameters
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const paginatedMedia = filteredMedia.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCopy = (id: string) => {
    const shortcode = `[download id="${id}"]`;
    navigator.clipboard.writeText(shortcode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / 1024).toFixed(1) + " KB";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 border border-accent-100 rounded-full text-[9px] font-bold uppercase tracking-widest text-accent-600">
              <Sparkles className="w-3.5 h-3.5" /> Content Tools
            </span>
          </div>
          <h1 className="text-3xl font-black text-brand-900 tracking-tight">Downloads Manager</h1>
          <p className="text-brand-500 text-sm mt-1 font-medium">
            Manage, generate, and copy WordPress-style download shortcodes for your uploaded media library assets.
          </p>
        </div>
      </div>

      {/* Dynamic Countdown Control Card */}
      <div className="bg-white rounded-xl border border-brand-100/60 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-brand-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-600" />
              Download Countdown Configuration
            </h2>
            <p className="text-xs text-brand-400 font-medium">
              Control the duration users must wait on the download page before the download button appears.
            </p>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            {loadingSettings ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading configurations...
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={countdown}
                    onChange={(e) => setCountdown(parseInt(e.target.value))}
                    className="w-32 accent-accent-600 cursor-pointer h-1.5 bg-brand-100 rounded-lg appearance-none"
                  />
                  <span className="text-xs font-black text-brand-900 bg-brand-50 border border-brand-100 px-2.5 py-1.5 rounded-lg font-mono">
                    {countdown} seconds
                  </span>
                </div>

                <button
                  onClick={handleSaveCountdown}
                  disabled={savingSettings}
                  className={`flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all shadow-sm ${
                    savedSettings
                      ? "bg-emerald-500 text-white"
                      : "bg-brand-900 hover:bg-accent-600 text-white"
                  }`}
                >
                  {savingSettings ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : savedSettings ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {savedSettings ? "Saved!" : "Save Duration"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-brand-100/60 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-300" />
          <input
            type="text"
            placeholder="Search attachments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-brand-50 border border-brand-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all text-brand-900 placeholder-brand-300 font-medium"
          />
        </div>
        <div className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">
          {filteredMedia.length} assets found
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white rounded-xl border border-brand-100/60 overflow-hidden shadow-sm">
        {filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-200">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-brand-900">No attachments found</p>
              <p className="text-xs text-brand-400">Try adjusting your filter or upload a file first under Media.</p>
            </div>
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead>
              <tr className="border-b border-brand-50 bg-brand-50/40 select-none">
                <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest text-brand-300">File Asset</th>
                <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest text-brand-300">Size & Mime</th>
                <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest text-brand-300">Storage Type</th>
                <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest text-brand-300">Downloaded</th>
                <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest text-brand-300">WordPress Shortcode</th>
                <th className="px-6 py-4 text-[8px] font-bold uppercase tracking-widest text-brand-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {paginatedMedia.map((m) => {
                const isCopied = copiedId === m.id;
                const shortcode = `[download id="${m.id}"]`;

                return (
                  <tr key={m.id} className="hover:bg-brand-50/20 transition-colors group">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-400 flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 max-w-[220px]">
                          <p className="text-xs font-bold text-brand-900 truncate" title={m.name}>
                            {m.name}
                          </p>
                          <p className="text-[9px] text-brand-400 font-semibold truncate mt-0.5" title={m.filename}>
                            {m.filename}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <p className="text-xs font-bold text-brand-800">{formatSize(m.size)}</p>
                      <p className="text-[9px] text-brand-400 font-semibold uppercase tracking-wider mt-0.5">
                        {m.mimeType || "application/octet-stream"}
                      </p>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${
                        m.storageType === "LOCAL"
                          ? "bg-brand-50 text-brand-600 border-brand-100"
                          : "bg-indigo-50 text-indigo-600 border-indigo-150"
                      }`}>
                        {m.storageType}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-xs font-bold text-brand-800 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                        {m.downloadCount || 0} times
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <code className="text-[10px] font-mono text-accent-700 bg-accent-50/50 border border-accent-100/50 px-2 py-1.5 rounded-lg select-all">
                        {shortcode}
                      </code>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopy(m.id)}
                          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                            isCopied
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                              : "bg-brand-900 text-white hover:bg-accent-600 shadow-sm"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Shortcode</span>
                            </>
                          )}
                        </button>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-brand-50 hover:bg-brand-100 border border-brand-100 rounded-xl text-brand-500 hover:text-brand-900 transition-all flex items-center justify-center shrink-0"
                          title="Open public asset link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Pagination Navigation Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-brand-50 bg-brand-50/20 select-none">
              <div className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMedia.length)} of {filteredMedia.length} assets
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (totalPages > 5 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                    if (p === 2 || p === totalPages - 1) {
                      return <span key={p} className="text-brand-300 text-xs px-1 select-none">...</span>;
                    }
                    return null;
                  }
                  
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === p
                          ? "bg-brand-900 text-white shadow-sm"
                          : "border border-brand-100 bg-white text-brand-600 hover:bg-brand-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
