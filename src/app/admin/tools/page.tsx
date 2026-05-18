"use client";

import { useState, useEffect } from "react";
import { 
  Wrench, 
  FileDown, 
  FileUp, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Info,
  Database,
  Server,
  HardDrive,
  RefreshCw
} from "lucide-react";

export default function AdminToolsPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importCount: number;
    categoriesCreated: number;
    message: string;
    titles?: string[];
    error?: string;
  } | null>(null);

  // SQLite Resiliency panel states
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbInfo, setDbInfo] = useState<{
    database: {
      size: number;
      lastModified: string | null;
      journalMode: string;
      synchronous: string;
      path: string;
    };
    backups: Array<{
      name: string;
      size: number;
      createdAt: string;
    }>;
  } | null>(null);
  const [backupActionLoading, setBackupActionLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  const fetchDbInfo = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (res.ok) {
        const data = await res.json();
        setDbInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch database info:", err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchDbInfo();
  }, []);

  const triggerServerBackup = async () => {
    setBackupActionLoading(true);
    setBackupMessage(null);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupMessage({ success: true, text: data.message });
        fetchDbInfo();
      } else {
        setBackupMessage({ success: false, text: data.error || "Failed to create backup." });
      }
    } catch (err: any) {
      setBackupMessage({ success: false, text: err.message || "Network error occurred." });
    } finally {
      setBackupActionLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setImporting(true);
    setImportResult(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      setImportResult({
        success: false,
        importCount: 0,
        categoriesCreated: 0,
        message: "Please select a valid WordPress WXR XML export file first.",
      });
      setImporting(false);
      return;
    }

    try {
      const res = await fetch("/api/posts/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        setImportResult({
          success: false,
          importCount: 0,
          categoriesCreated: 0,
          message: data.error || data.message || "Failed to parse and import the XML file.",
        });
      } else {
        setImportResult({
          success: true,
          importCount: data.importCount,
          categoriesCreated: data.categoriesCreated,
          message: data.message,
          titles: data.titles,
        });
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        importCount: 0,
        categoriesCreated: 0,
        message: err.message || "An unexpected network error occurred.",
      });
    } finally {
      setImporting(false);
    }
  };

  const triggerExport = () => {
    window.open("/api/posts/export", "_blank");
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-200/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-600/10 flex items-center justify-center text-accent-600">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-900">System Utilities & Tools</h1>
            <p className="text-xs text-brand-400 font-medium mt-0.5">
              Migrate, backup, and sync your magazine articles using standard WordPress compatibility engines.
            </p>
          </div>
        </div>
      </div>

      {/* Informative Banner */}
      <div className="bg-brand-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-brand-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-64 h-64 bg-accent-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-600 text-white text-[9px] font-bold uppercase tracking-wider">
            WordPress Compatible WXR
          </span>
          <h2 className="text-sm md:text-base font-bold tracking-tight">Migrate Seamlessly In or Out</h2>
          <p className="text-[10px] md:text-xs text-brand-300 font-medium leading-relaxed max-w-2xl">
            NEXUS implements standard WordPress Extended RSS (WXR 1.2) XML schemas. This allows you to export all your articles and load them into any WordPress blog, or cleanly import any export backup downloaded from an active self-hosted or cloud WordPress website.
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 text-[10px] font-bold text-accent-400 group relative cursor-pointer">
          <Sparkles className="w-4 h-4" />
          <span>Fully Standard WXR 1.2</span>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Export Panel */}
        <div className="bg-white rounded-2xl border border-brand-200/50 shadow-sm p-6 space-y-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-850">Export Posts to WXR</h3>
              <p className="text-[9px] text-brand-400 font-medium mt-0.5">Download your blog library as a dynamic XML format.</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-[9px] font-bold text-brand-700">
                <Info className="w-3.5 h-3.5 text-brand-500" />
                <span>Export Properties Checklist</span>
              </div>
              <ul className="text-[9px] text-brand-400 font-medium space-y-1 pl-5 list-disc">
                <li>Standard WXR 1.2 tags: &lt;item&gt;, &lt;wp:post_type&gt;, &lt;content:encoded&gt;.</li>
                <li>Extracts HTML body data and original created dates securely.</li>
                <li>Attaches custom categorizations with matching slugs.</li>
                <li>Preserves author creator display mappings.</li>
              </ul>
            </div>

            <p className="text-[10px] text-brand-500 font-medium leading-relaxed">
              Clicking the button below will immediately compile your local post database and generate a downloadable standard XML backup. You can import this file directly into standard WordPress via the <strong>Tools → Import → WordPress</strong> admin settings screen on your new site.
            </p>
          </div>

          <button
            onClick={triggerExport}
            className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider text-white bg-brand-900 hover:bg-brand-950 active:bg-black rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>Compile & Export XML</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Import Panel */}
        <div className="bg-white rounded-2xl border border-brand-200/50 shadow-sm p-6 space-y-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-850">Import Posts from WXR</h3>
              <p className="text-[9px] text-brand-400 font-medium mt-0.5">Upload a standard WordPress XML export backup.</p>
            </div>
          </div>

          <form onSubmit={handleImportSubmit} className="flex-1 flex flex-col gap-6">
            <div className="flex-1 space-y-4">
              <div className="relative border-2 border-dashed border-brand-200 hover:border-accent-400 rounded-2xl p-6 transition-all group flex flex-col items-center justify-center text-center gap-2 bg-brand-50/50">
                <input
                  type="file"
                  name="file"
                  accept=".xml"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 group-hover:bg-accent-100 group-hover:text-accent-600 transition-colors">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-800">Select WordPress XML File</p>
                  <p className="text-[8px] text-brand-400 font-medium mt-0.5">Click or drag export backup (.xml) files here.</p>
                </div>
              </div>

              <div className="text-[9px] text-brand-450 leading-relaxed font-medium bg-brand-50 border border-brand-100 rounded-xl p-3">
                <strong>Important Import Rule:</strong> If categories referenced inside the XML are missing from the NEXUS database, they will be created automatically. Slugs are filtered for unique uniqueness, meaning collisions will automatically append counters (e.g. <code>my-post-1</code>) to prevent overwriting existing articles!
              </div>
            </div>

            <button
              type="submit"
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider text-white bg-accent-600 hover:bg-accent-700 active:bg-accent-800 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {importing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Migration...</span>
                </>
              ) : (
                <>
                  <span>Upload & Import Posts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Database Resiliency & Backups */}
      <div className="bg-white rounded-2xl border border-brand-200/50 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-850">SQLite Database Resiliency</h3>
              <p className="text-[9px] text-brand-400 font-medium mt-0.5">Protect and monitor your flat-file database using modern transaction snapshots.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDbInfo}
              disabled={loadingDb}
              className="p-1.5 rounded-lg border border-brand-200 text-brand-500 hover:bg-brand-50 active:bg-brand-100 disabled:opacity-50 transition-all cursor-pointer"
              title="Refresh database stats"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Database Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-brand-50/50 border border-brand-100/70 rounded-xl space-y-1">
            <span className="text-[8px] font-bold text-brand-400 uppercase tracking-wider block">Database File Size</span>
            {dbInfo ? (
              <span className="text-xs font-extrabold text-brand-900">{formatBytes(dbInfo.database.size)}</span>
            ) : (
              <span className="text-xs font-medium text-brand-300">Loading...</span>
            )}
          </div>
          <div className="p-4 bg-brand-50/50 border border-brand-100/70 rounded-xl space-y-1">
            <span className="text-[8px] font-bold text-brand-400 uppercase tracking-wider block">SQLite Journal Mode</span>
            {dbInfo ? (
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${String(dbInfo.database.journalMode).toLowerCase() === "wal" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                <span className="text-xs font-extrabold uppercase text-brand-900">{String(dbInfo.database.journalMode)}</span>
              </div>
            ) : (
              <span className="text-xs font-medium text-brand-300">Loading...</span>
            )}
          </div>
          <div className="p-4 bg-brand-50/50 border border-brand-100/70 rounded-xl space-y-1">
            <span className="text-[8px] font-bold text-brand-400 uppercase tracking-wider block">Synchronous Mode</span>
            {dbInfo ? (
              <span className="text-xs font-extrabold uppercase text-brand-900">
                {dbInfo.database.synchronous === "1" ? "NORMAL" : dbInfo.database.synchronous === "2" ? "FULL" : dbInfo.database.synchronous}
              </span>
            ) : (
              <span className="text-xs font-medium text-brand-300">Loading...</span>
            )}
          </div>
          <div className="p-4 bg-brand-50/50 border border-brand-100/70 rounded-xl space-y-1">
            <span className="text-[8px] font-bold text-brand-400 uppercase tracking-wider block">Last Database Write</span>
            {dbInfo ? (
              <span className="text-[10px] font-bold text-brand-850 truncate block">
                {dbInfo.database.lastModified ? new Date(dbInfo.database.lastModified).toLocaleString() : "Never"}
              </span>
            ) : (
              <span className="text-xs font-medium text-brand-300">Loading...</span>
            )}
          </div>
        </div>

        {/* Database Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/api/admin/backup?download=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition-all cursor-pointer text-center"
          >
            <FileDown className="w-4.5 h-4.5" />
            <span>Download Live Backup (.db)</span>
          </a>
          <button
            onClick={triggerServerBackup}
            disabled={backupActionLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider text-white bg-brand-900 hover:bg-brand-950 active:bg-black disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer"
          >
            {backupActionLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating Server Backup...</span>
              </>
            ) : (
              <>
                <Server className="w-4.5 h-4.5" />
                <span>Snapshot & Save on Server</span>
              </>
            )}
          </button>
        </div>

        {/* Status message */}
        {backupMessage && (
          <div className={`p-3 text-[9px] font-bold rounded-xl border flex items-center gap-2 ${
            backupMessage.success
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-red-50 border-red-100 text-red-800"
          }`}>
            <Info className="w-4 h-4" />
            <span>{backupMessage.text}</span>
          </div>
        )}

        {/* Server-Side Backups History List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-brand-850 uppercase tracking-widest">Server-side backups log (Max 5, auto-rotated)</span>
            <span className="text-[8px] font-bold text-brand-450">{dbInfo?.backups.length || 0} Saved</span>
          </div>

          {dbInfo && dbInfo.backups.length > 0 ? (
            <div className="border border-brand-100 rounded-xl overflow-hidden bg-brand-50/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-50 border-b border-brand-100 text-[8px] font-bold uppercase tracking-wider text-brand-450">
                      <th className="py-2.5 px-4">Backup File Name</th>
                      <th className="py-2.5 px-4">Size</th>
                      <th className="py-2.5 px-4">Created Timestamp</th>
                      <th className="py-2.5 px-4 text-right">Protection Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100 text-[9px] font-medium text-brand-800">
                    {dbInfo.backups.map((bk, i) => (
                      <tr key={bk.name} className="hover:bg-brand-50/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-brand-900">{bk.name}</td>
                        <td className="py-2.5 px-4">{formatBytes(bk.size)}</td>
                        <td className="py-2.5 px-4">{new Date(bk.createdAt).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase text-[7px]">
                            {i === 0 ? "Latest Active" : "Archived"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 border border-dashed border-brand-200 rounded-xl text-center bg-brand-50/10">
              <HardDrive className="w-8 h-8 text-brand-200 mx-auto mb-2" />
              <p className="text-[10px] text-brand-400 font-bold">No server-side backups cataloged yet.</p>
              <p className="text-[8px] text-brand-300 font-medium mt-0.5">Click "Snapshot & Save on Server" to trigger a protected snapshot.</p>
            </div>
          )}
        </div>
      </div>

      {/* Import Results Overlay/Banner */}
      {importResult && (
        <div className={`p-5 border rounded-2xl flex items-start gap-4 shadow-sm transition-all ${
          importResult.success
            ? "bg-emerald-50 border-emerald-100 text-emerald-900"
            : "bg-red-50 border-red-100 text-red-900"
        }`}>
          <div className="w-6 h-6 flex-shrink-0 mt-0.5">
            {importResult.success ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-500" />
            )}
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {importResult.success ? "Migration Process Completed" : "Migration Process Failed"}
            </h4>
            <p className="text-[10px] font-medium leading-relaxed">
              {importResult.message}
            </p>

            {importResult.success && importResult.titles && importResult.titles.length > 0 && (
              <div className="mt-3 bg-white/60 border border-emerald-200/55 rounded-xl p-3 space-y-1.5">
                <p className="text-[9px] font-bold text-emerald-900 uppercase tracking-widest">
                  Example Imported Titles ({importResult.importCount} Total):
                </p>
                <ul className="text-[9px] font-medium space-y-1 pl-4 list-decimal text-emerald-850">
                  {importResult.titles.map((title, idx) => (
                    <li key={idx} className="truncate max-w-xl">{title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
