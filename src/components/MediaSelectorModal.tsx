"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
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
  HelpCircle,
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

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  title?: string;
  allowedTypes?: "all" | "image";
}

export default function MediaSelectorModal({
  isOpen,
  onClose,
  onSelect,
  title = "Select Media Asset",
  allowedTypes = "all",
}: MediaSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "library">("library");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Media assets
  const fetchMedia = async () => {
    setLoading(true);
    try {
      const typeParam = allowedTypes === "image" ? "image" : typeFilter;
      const res = await fetch(`/api/admin/media?search=${encodeURIComponent(searchQuery)}&type=${typeParam}`);
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
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, searchQuery, typeFilter, allowedTypes]);

  if (!isOpen) return null;

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

      // Auto select and switch tab
      setMediaItems((prev) => [data, ...prev]);
      setSelectedItem(data);
      setActiveTab("library");
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

  // Icon Resolver
  const renderItemIcon = (mime: string, name: string) => {
    if (mime.startsWith("image/")) {
      return <ImageIcon className="w-8 h-8 text-brand-300" />;
    }
    if (mime.startsWith("video/")) {
      return <Video className="w-8 h-8 text-indigo-400" />;
    }
    if (mime.startsWith("audio/")) {
      return <Music className="w-8 h-8 text-emerald-400" />;
    }
    if (name.endsWith(".apk") || mime.includes("android")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-1">
          <span className="text-[7px] px-1 py-0.5 rounded bg-lime-100 text-lime-800 font-bold uppercase tracking-wider">APK</span>
          <HardDrive className="w-8 h-8 text-lime-500" />
        </div>
      );
    }
    return <FileText className="w-8 h-8 text-brand-400" />;
  };

  // Copy Link action
  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(url);
    setTimeout(() => setCopiedId(null), 2000);
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

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all animate-fade-in">
      <div className="bg-white w-full h-full sm:h-[85vh] sm:max-w-5xl sm:rounded-2xl border border-brand-200/50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-brand-100 flex items-center justify-between bg-brand-50/50">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-brand-200 text-brand-500 hover:bg-brand-100 active:bg-brand-200 hover:text-brand-900 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-brand-100 px-5 bg-white shrink-0">
          <button
            onClick={() => setActiveTab("upload")}
            className={`py-3 px-4 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "border-brand-900 text-brand-900"
                : "border-transparent text-brand-400 hover:text-brand-700"
            }`}
          >
            Upload Files
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`py-3 px-4 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "library"
                ? "border-brand-900 text-brand-900"
                : "border-transparent text-brand-400 hover:text-brand-700"
            }`}
          >
            Media Library
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-brand-50/20">
          {/* UPLOAD FILES TAB */}
          {activeTab === "upload" && (
            <div
              className="flex-1 p-8 flex items-center justify-center"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div
                className={`w-full max-w-xl aspect-[16/10] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all ${
                  dragActive || uploading
                    ? "border-accent-500 bg-accent-50/20"
                    : "border-brand-200 hover:border-brand-400 bg-white"
                }`}
              >
                {uploading ? (
                  <div className="space-y-4">
                    <Loader2 className="w-10 h-10 text-accent-500 animate-spin mx-auto" />
                    <div>
                      <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">Uploading Asset...</p>
                      <p className="text-[8px] text-brand-400 mt-1">Routing file storage location</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-400 mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">Drag & drop files here to upload</p>
                      <p className="text-[8px] text-brand-450 mt-1">Any format supported, including Images, Videos, Documents, and APK files (Up to 100MB)</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 bg-brand-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-accent-600 transition-all cursor-pointer inline-block"
                    >
                      Select Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}
                {uploadError && (
                  <p className="text-[9px] font-bold text-red-500 mt-4 bg-red-50 px-3 py-1.5 rounded-lg border border-red-150">{uploadError}</p>
                )}
              </div>
            </div>
          )}

          {/* MEDIA LIBRARY TAB */}
          {activeTab === "library" && (
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Grid Area */}
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-300" />
                    <input
                      type="text"
                      placeholder="Search media files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-[10px] font-medium text-brand-700 placeholder-brand-200 bg-white rounded-lg pl-9 pr-4 py-2 border border-brand-200 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                    />
                  </div>
                  {allowedTypes !== "image" && (
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
                  )}
                </div>

                {/* Media Grid */}
                <div className="flex-1 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-brand-300 animate-spin" />
                    </div>
                  ) : mediaItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {mediaItems.map((item) => {
                        const isSelected = selectedItem?.id === item.id;
                        const isImage = item.mimeType.startsWith("image/");
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`aspect-square rounded-xl border-2 bg-white relative overflow-hidden group cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? "border-accent-500 shadow-md ring-2 ring-accent-400/20"
                                : "border-brand-200/60 hover:border-brand-400"
                            }`}
                          >
                            {/* Selected Badge */}
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-accent-600 text-white flex items-center justify-center shadow">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}

                            {/* Storage Flag (FTP vs Local) */}
                            <div className="absolute bottom-1 right-1 z-10 px-1 py-0.5 rounded bg-black/60 text-white text-[6px] font-extrabold uppercase tracking-wide">
                              {item.storageType}
                            </div>

                            {/* Graphic Container */}
                            <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-brand-50/10">
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

                            {/* Label */}
                            <div className="px-2 py-1.5 bg-brand-50/60 border-t border-brand-100 shrink-0">
                              <p className="text-[8px] font-bold text-brand-800 truncate" title={item.name}>
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
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <HelpCircle className="w-8 h-8 text-brand-200 mb-2" />
                      <p className="text-[10px] text-brand-400 font-bold">No assets cataloged yet</p>
                      <p className="text-[8px] text-brand-300 font-medium mt-0.5">Upload new files or synchronize your remote storage server</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Selection Sidebar */}
              <div className="w-64 border-l border-brand-100 bg-white p-4 overflow-y-auto hidden md:block shrink-0">
                {selectedItem ? (
                  <div className="space-y-4">
                    <h3 className="text-[9px] font-bold text-brand-900 uppercase tracking-widest border-b border-brand-100 pb-2">Attachment Details</h3>
                    
                    {/* Visual Preview */}
                    <div className="aspect-[4/3] rounded-lg border border-brand-100 bg-brand-50/30 overflow-hidden flex items-center justify-center p-2">
                      {selectedItem.mimeType.startsWith("image/") ? (
                        <img
                          src={selectedItem.url}
                          alt={selectedItem.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        renderItemIcon(selectedItem.mimeType, selectedItem.name)
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="space-y-2 text-[9px] text-brand-650 leading-relaxed font-medium">
                      <div>
                        <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider">File Name:</strong>
                        <p className="truncate text-brand-500 font-mono" title={selectedItem.name}>{selectedItem.name}</p>
                      </div>
                      <div>
                        <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider">Generated Slug:</strong>
                        <p className="truncate text-brand-500 font-mono" title={selectedItem.filename}>{selectedItem.filename}</p>
                      </div>
                      <div>
                        <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider">File Type:</strong>
                        <p className="text-brand-500 uppercase">{selectedItem.mimeType}</p>
                      </div>
                      <div>
                        <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider">File Size:</strong>
                        <p className="text-brand-500">{formatBytes(selectedItem.size)}</p>
                      </div>
                      <div>
                        <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider">Storage Target:</strong>
                        <p className="text-brand-500 uppercase">{selectedItem.storageType}</p>
                      </div>
                      <div>
                        <strong className="text-brand-900 block font-bold text-[7.5px] uppercase tracking-wider">Upload Timestamp:</strong>
                        <p className="text-brand-500">{new Date(selectedItem.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Quick Shortcuts */}
                    <div className="space-y-1.5 pt-2 border-t border-brand-50">
                      <button
                        onClick={() => copyLink(selectedItem.url)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[8.5px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === selectedItem.url ? "Copied!" : "Copy Asset URL"}</span>
                      </button>
                      <a
                        href={selectedItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[8.5px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in New Tab</span>
                      </a>
                      <button
                        onClick={() => handleDelete(selectedItem.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[8.5px] font-bold uppercase tracking-wider text-red-650 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Permanently</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-brand-300 text-[10px] font-medium leading-relaxed p-4">
                    Select a media item from the catalog grid to examine full asset details.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-5 py-4 border-t border-brand-100 flex items-center justify-end gap-2 bg-brand-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-brand-200 text-brand-700 text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-brand-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedItem && onSelect(selectedItem)}
            disabled={!selectedItem}
            className="px-4 py-2 bg-brand-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Insert Media Asset
          </button>
        </div>
      </div>
    </div>
  );
}
