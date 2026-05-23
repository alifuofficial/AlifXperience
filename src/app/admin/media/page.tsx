"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Search,
  FileText,
  Video,
  Music,
  Check,
  ImageIcon,
  HardDrive,
  Trash2,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sliders,
  Database,
  Server,
  HelpCircle,
  X,
} from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  storageType: string;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Media assets
  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media?search=${encodeURIComponent(searchQuery)}&type=${typeFilter}`);
      if (!res.ok) throw new Error("Failed to load assets");
      const data = await res.json();
      setMediaItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [searchQuery, typeFilter]);

  // Format File Sizes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Upload handler
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to upload file");

      // Append and select
      setMediaItems((prev) => [data, ...prev]);
      setSelectedItem(data);
      setUploadError("");
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Sync FTP remote directory
  const handleSyncFTP = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/admin/media/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");

      setSyncMessage(data.message || "FTP Synced successfully!");
      fetchMedia();
      setTimeout(() => setSyncMessage(""), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to synchronize remote FTP storage catalog.");
    } finally {
      setSyncing(false);
    }
  };

  // Permanently delete action
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this media asset? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMediaItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      alert("Failed to delete media asset");
    }
  };

  // Copy Link action
  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(url);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics Calculations
  const totalSize = mediaItems.reduce((acc, item) => acc + item.size, 0);
  const localCount = mediaItems.filter((i) => i.storageType === "LOCAL").length;
  const ftpCount = mediaItems.filter((i) => i.storageType === "FTP").length;

  const renderItemIcon = (mime: string, name: string) => {
    if (mime.startsWith("image/")) {
      return <ImageIcon className="w-10 h-10 text-brand-300" />;
    }
    if (mime.startsWith("video/")) {
      return <Video className="w-10 h-10 text-indigo-400" />;
    }
    if (mime.startsWith("audio/")) {
      return <Music className="w-10 h-10 text-emerald-400" />;
    }
    if (name.endsWith(".apk") || mime.includes("android")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-1">
          <span className="text-[7px] px-1 py-0.5 rounded bg-lime-100 text-lime-800 font-bold uppercase tracking-wider">APK</span>
          <HardDrive className="w-9 h-9 text-lime-500" />
        </div>
      );
    }
    return <FileText className="w-10 h-10 text-brand-400" />;
  };

  const renderSelectedItemBody = () => (
    <>
      <div className="aspect-[4/3] rounded-xl border border-brand-200 bg-white overflow-hidden flex items-center justify-center p-3 shadow-inner">
        {selectedItem!.mimeType.startsWith("image/") ? (
          <img
            src={selectedItem!.url}
            alt={selectedItem!.name}
            className="w-full h-full object-contain"
          />
        ) : (
          renderItemIcon(selectedItem!.mimeType, selectedItem!.name)
        )}
      </div>

      <div className="space-y-3.5 text-[9.5px] text-brand-650 leading-relaxed font-medium">
        <div>
          <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider mb-0.5">Physical File Name:</strong>
          <p className="truncate text-brand-500 font-mono bg-white border border-brand-100 px-2 py-1 rounded" title={selectedItem!.name}>
            {selectedItem!.name}
          </p>
        </div>
        <div>
          <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider mb-0.5">Asset Reference ID:</strong>
          <p className="truncate text-brand-500 font-mono bg-white border border-brand-100 px-2 py-1 rounded" title={selectedItem!.id}>
            {selectedItem!.id}
          </p>
        </div>
        <div>
          <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider mb-0.5">MIME File Format:</strong>
          <p className="text-brand-500 font-bold uppercase">{selectedItem!.mimeType}</p>
        </div>
        <div>
          <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider mb-0.5">File Weight:</strong>
          <p className="text-brand-500">{formatBytes(selectedItem!.size)}</p>
        </div>
        <div>
          <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider mb-0.5">Storage Host:</strong>
          <p className="text-brand-500 uppercase font-bold text-accent-600">{selectedItem!.storageType}</p>
        </div>
        <div>
          <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider mb-0.5">Upload Date:</strong>
          <p className="text-brand-500">{new Date(selectedItem!.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-brand-100">
        <button
          onClick={() => copyLink(selectedItem!.url)}
          className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-bold uppercase tracking-wider text-brand-700 bg-white border border-brand-200 hover:bg-brand-50 rounded-lg transition-all cursor-pointer shadow-sm"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>{copiedId === selectedItem!.url ? "Copied!" : "Copy Asset URL"}</span>
        </button>
        <a
          href={selectedItem!.url}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-bold uppercase tracking-wider text-brand-700 bg-white border border-brand-200 hover:bg-brand-50 rounded-lg transition-all cursor-pointer shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open in New Tab</span>
        </a>
        <button
          onClick={() => handleDelete(selectedItem!.id)}
          className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Asset</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-1">Assets Catalog</p>
          <h1 className="text-3xl font-bold text-brand-900 tracking-tight">Media Library</h1>
          <p className="text-brand-400 text-sm mt-1">
            Store and manage application images, videos, documents, or mobile APK download packages.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncFTP}
            disabled={syncing}
            className="flex items-center justify-center gap-2 bg-white border border-brand-200 text-brand-700 text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-lg hover:bg-brand-50 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Sync FTP Server</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Sync Success Alert */}
      {syncMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-brand-100/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[8px] font-bold text-brand-300 uppercase tracking-widest block">Total Assets</span>
            <span className="text-2xl font-bold text-brand-900 mt-1 block">{mediaItems.length}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-400">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-brand-100/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[8px] font-bold text-brand-300 uppercase tracking-widest block">Storage Size</span>
            <span className="text-2xl font-bold text-brand-900 mt-1 block">{formatBytes(totalSize)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-400">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-brand-100/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[8px] font-bold text-brand-300 uppercase tracking-widest block">Local Disk</span>
            <span className="text-2xl font-bold text-brand-900 mt-1 block">{localCount} files</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-400">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-brand-100/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[8px] font-bold text-brand-300 uppercase tracking-widest block">FTP Server</span>
            <span className="text-2xl font-bold text-brand-900 mt-1 block">{ftpCount} files</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-400">
            <Server className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex overflow-hidden min-h-[500px] border border-brand-200/60 bg-white rounded-xl shadow-sm">
        {/* Left Grid Panel */}
        <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
          {/* Top Search & Filter toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5 shrink-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-300" />
              <input
                type="text"
                placeholder="Search media by slug or original name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[10px] font-medium text-brand-700 placeholder-brand-200 bg-brand-50 rounded-lg pl-9 pr-4 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["all", "image", "video", "apk", "document"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border cursor-pointer whitespace-nowrap transition-all ${
                    typeFilter === filter
                      ? "bg-brand-900 border-brand-900 text-white"
                      : "bg-white border-brand-200 text-brand-500 hover:text-brand-900"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Drag-and-Drop Zone / Direct Upload Grid */}
          <div
            className="flex-1 min-h-0 overflow-y-auto"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {dragActive || uploading ? (
              <div className="h-64 rounded-xl border-2 border-dashed border-accent-400 bg-accent-50/20 flex flex-col items-center justify-center text-center p-6 transition-all">
                <Loader2 className="w-8 h-8 text-accent-500 animate-spin mb-3" />
                <p className="text-[10px] font-bold text-brand-750 uppercase tracking-wider">Uploading Dropped Media Asset...</p>
                <p className="text-[7.5px] text-brand-400 mt-1">Cataloging storage destination path</p>
              </div>
            ) : loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-300 animate-spin" />
              </div>
            ) : mediaItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {mediaItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const isImage = item.mimeType.startsWith("image/");
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`aspect-square rounded-xl border-2 bg-brand-50/20 relative overflow-hidden group cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-accent-500 shadow ring-2 ring-accent-400/20"
                          : "border-brand-200/60 hover:border-brand-400 bg-white"
                      }`}
                    >
                      {/* Checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10 w-4 h-4 rounded-full bg-accent-600 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}

                      {/* Storage type Badge */}
                      <div className="absolute bottom-2 right-2 z-10 px-1 py-0.5 rounded bg-black/60 text-white text-[5.5px] font-extrabold uppercase tracking-wide">
                        {item.storageType}
                      </div>

                      {/* Preview Graphic */}
                      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-brand-50/10">
                        {isImage ? (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-contain select-none"
                            loading="lazy"
                          />
                        ) : (
                          renderItemIcon(item.mimeType, item.name)
                        )}
                      </div>

                      {/* File Info Title */}
                      <div className="px-3 py-2 bg-white border-t border-brand-100 shrink-0">
                        <p className="text-[8.5px] font-bold text-brand-800 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[6.5px] text-brand-400 font-medium mt-0.5">
                          {formatBytes(item.size)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-80 border-2 border-dashed border-brand-100 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-brand-50/10">
                <Upload className="w-10 h-10 text-brand-200 mb-3" />
                <p className="text-[11px] font-bold text-brand-800 uppercase tracking-widest">No Media Assets Found</p>
                <p className="text-[8.5px] text-brand-400 font-medium mt-1.5 max-w-sm leading-relaxed">
                  Drag and drop files onto this workspace to upload them, or trigger the FTP catalog synchronizer.
                </p>
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-150 rounded-xl text-red-700 text-[9px] font-bold uppercase tracking-wider">
                {uploadError}
              </div>
            )}
          </div>
        </div>

        {/* Right Details Slide Panel */}
        <div className="w-72 border-l border-brand-100 bg-brand-50/10 p-6 overflow-y-auto hidden lg:block shrink-0">
          {selectedItem ? (
            <div className="space-y-5">
              <h3 className="text-[10px] font-bold text-brand-900 uppercase tracking-widest border-b border-brand-100 pb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-accent-500" />
                <span>Asset Inspector</span>
              </h3>
              {renderSelectedItemBody()}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-brand-300 text-[10px] font-medium leading-relaxed">
              Click on an asset inside the grid to activate the properties panel.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Detail Sheet */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedItem(null)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 pt-5 pb-3 border-b border-brand-100">
              <h3 className="text-[10px] font-bold text-brand-900 uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-accent-500" />
                <span>Asset Inspector</span>
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg hover:bg-brand-100 text-brand-400 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 pt-4 space-y-5">
              {renderSelectedItemBody()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
