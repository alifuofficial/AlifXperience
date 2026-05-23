"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Settings, User, Globe, Search, Share2, MessageSquare,
  Bell, Shield, Save, Loader2, Check, AlertTriangle, Eye, EyeOff, ChevronRight, Mail, HardDrive,
  Megaphone, ImageIcon, Type, Image, FileText
} from "lucide-react";
import bcrypt from "bcryptjs";
import MediaSelectorModal from "@/components/MediaSelectorModal";

type Tab = "profile" | "site" | "seo" | "social" | "comments" | "ads" | "email_auth" | "storage" | "danger";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "site", label: "Site", icon: Globe },
  { id: "seo", label: "SEO", icon: Search },
  { id: "social", label: "Social", icon: Share2 },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "ads", label: "Analytics & Ads", icon: Bell },
  { id: "email_auth", label: "Email & Auth", icon: Mail },
  { id: "storage", label: "FTP Storage", icon: HardDrive },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

// ─── Field components ──────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-400">{label}</label>
      {children}
      {hint && <p className="text-[9px] text-brand-300 font-medium">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, disabled }: {
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      className="w-full text-xs font-medium text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all disabled:opacity-50"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className="w-full text-xs font-medium text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all resize-none"
    />
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-brand-50 last:border-0">
      <span className="text-xs font-medium text-brand-700">{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-accent-600" : "bg-brand-200"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function SaveBtn({ saving, saved, onClick, label = "Save Changes" }: {
  saving: boolean; saved: boolean; onClick: () => void; label?: string;
}) {
  return (
    <button onClick={onClick} disabled={saving}
      className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 ${
        saved ? "bg-emerald-500 text-white" : "bg-brand-900 hover:bg-accent-600 text-white"
      }`}
    >
      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
      {saved ? "Saved!" : label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-brand-100/60 p-6 space-y-5">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-brand-900 border-b border-brand-50 pb-3">{title}</h2>
      {children}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "USER";
  const isAdmin = role === "ADMIN";

  const filteredTabs = TABS.filter((t) => {
    if (isAdmin) return true;
    return t.id === "profile";
  });

  const [tab, setTab] = useState<Tab>("profile");

  // Settings state
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileTwitter, setProfileTwitter] = useState("");
  const [profileGithub, setProfileGithub] = useState("");
  const [profileLinkedin, setProfileLinkedin] = useState("");
  const [profileWebsite, setProfileWebsite] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showFtpPass, setShowFtpPass] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [profileErr, setProfileErr] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<"logoUrl" | "faviconUrl" | "profileAvatarUrl" | null>(null);
  const [testingFtp, setTestingFtp] = useState(false);
  const [ftpTestResult, setFtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [creatingFtpTestFile, setCreatingFtpTestFile] = useState(false);
  const [ftpTestFileResult, setFtpTestFileResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      const uid = (session.user as any).id;
      setProfileName((session.user as any).name ?? "");
      setProfileEmail(session.user.email ?? "");
      fetch(`/api/users/${uid}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (d) {
            setProfileBio(d.bio ?? "");
            setProfileAvatarUrl(d.avatarUrl ?? "");
            setProfileTwitter(d.twitterUrl ?? "");
            setProfileGithub(d.githubUrl ?? "");
            setProfileLinkedin(d.linkedinUrl ?? "");
            setProfileWebsite(d.websiteUrl ?? "");
          }
        })
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { setSettings(d); setLoadingSettings(false); })
      .catch(() => setLoadingSettings(false));
  }, []);

  const set = (key: string) => (val: string) => setSettings((prev) => ({ ...prev, [key]: val }));
  const setBool = (key: string) => (val: boolean) => setSettings((prev) => ({ ...prev, [key]: String(val) }));
  const bool = (key: string) => settings[key] === "true";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string, setLoader: (loading: boolean) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoader(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSettings((prev) => ({ ...prev, [key]: data.url }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoader(false);
    }
  };

  const testFtpConnection = async () => {
    setTestingFtp(true);
    setFtpTestResult(null);
    setFtpTestFileResult(null);

    const ftpHost = settings.ftpHost?.trim();
    const ftpPort = settings.ftpPort?.trim() || "21";
    const ftpUser = settings.ftpUser?.trim();
    const ftpPass = settings.ftpPass?.trim();

    if (!ftpHost || !ftpUser || !ftpPass) {
      setFtpTestResult({
        success: false,
        message: "Please fill in FTP Host, Username, and Password fields to run the connection test.",
      });
      setTestingFtp(false);
      return;
    }

    try {
      const res = await fetch("/api/settings/ftp-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ftpHost, ftpPort, ftpUser, ftpPass }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        setFtpTestResult({
          success: false,
          message: data.error || data.message || "Failed to establish a connection to the FTP server.",
        });
      } else {
        setFtpTestResult({
          success: true,
          message: data.message || "Successfully connected to the FTP server!",
        });
      }
    } catch (err: any) {
      setFtpTestResult({
        success: false,
        message: err.message || "An unexpected error occurred during connection testing.",
      });
    } finally {
      setTestingFtp(false);
    }
  };

  const createFtpTestFile = async () => {
    setCreatingFtpTestFile(true);
    setFtpTestFileResult(null);
    setFtpTestResult(null);

    const ftpHost = settings.ftpHost?.trim();
    const ftpPort = settings.ftpPort?.trim() || "21";
    const ftpUser = settings.ftpUser?.trim();
    const ftpPass = settings.ftpPass?.trim();
    const ftpRemotePath = settings.ftpRemotePath?.trim() || "/";
    const ftpPublicUrl = settings.ftpPublicUrl?.trim();

    if (!ftpHost || !ftpUser || !ftpPass) {
      setFtpTestFileResult({
        success: false,
        message: "Please fill in FTP Host, Username, and Password fields first.",
      });
      setCreatingFtpTestFile(false);
      return;
    }

    if (!ftpPublicUrl) {
      setFtpTestFileResult({
        success: false,
        message: "FTP Public URL is required to generate the test file URL.",
      });
      setCreatingFtpTestFile(false);
      return;
    }

    try {
      const res = await fetch("/api/settings/ftp-test-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ftpHost, ftpPort, ftpUser, ftpPass, ftpRemotePath, ftpPublicUrl }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        setFtpTestFileResult({
          success: false,
          message: data.error || data.message || "Failed to create test file.",
        });
      } else {
        setFtpTestFileResult({
          success: true,
          message: data.message || "Test file uploaded successfully!",
          url: data.url,
        });
      }
    } catch (err: any) {
      setFtpTestFileResult({
        success: false,
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setCreatingFtpTestFile(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true); setSavedSettings(false);
    try {
      await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 2500);
    } catch { }
    finally { setSavingSettings(false); }
  };

  const saveProfile = async () => {
    setProfileErr("");
    if (newPw && newPw !== confirmPw) { setProfileErr("Passwords don't match"); return; }
    if (newPw && newPw.length < 8) { setProfileErr("Password must be at least 8 characters"); return; }
    setSavingProfile(true);
    try {
      const payload: any = {
        name: profileName,
        email: profileEmail,
        bio: profileBio,
        avatarUrl: profileAvatarUrl,
        twitterUrl: profileTwitter,
        githubUrl: profileGithub,
        linkedinUrl: profileLinkedin,
        websiteUrl: profileWebsite,
      };
      if (newPw) payload.password = newPw;
      const res = await fetch(`/api/users/${(session?.user as any)?.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSavedProfile(true); setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setSavedProfile(false), 2500);
    } catch (e: any) { setProfileErr(e.message); }
    finally { setSavingProfile(false); }
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-brand-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar nav */}
      <nav className="w-48 flex-shrink-0 space-y-0.5">
        <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-brand-300 px-3 mb-3">Settings</p>
        {filteredTabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-[11px] font-bold uppercase tracking-wider group ${
              tab === t.id ? "bg-brand-900 text-white" : "text-brand-400 hover:text-brand-900 hover:bg-white"
            } ${t.id === "danger" && tab !== "danger" ? "text-red-400 hover:text-red-600 hover:bg-red-50" : ""}`}
          >
            <t.icon className="w-3.5 h-3.5 flex-shrink-0" />
            {t.label}
            {tab === t.id && <ChevronRight className="w-3 h-3 ml-auto" />}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 space-y-5 min-w-0">

        {/* ── Profile ──────────────────────────────────────────────────────── */}
        {tab === "profile" && (
          <>
            <Section title="Personal Information">
              <Field label="Display Name">
                <Input value={profileName} onChange={setProfileName} placeholder="Your name" />
              </Field>
              <Field label="Email Address">
                <Input value={profileEmail} onChange={setProfileEmail} type="email" placeholder="you@example.com" />
              </Field>
            </Section>

            <Section title="Author Bio">
              <Field label="Bio" hint="A short bio displayed on your articles.">
                <Textarea value={profileBio} onChange={setProfileBio} placeholder="Writer and editor covering technology, science, and culture." rows={3} />
              </Field>
              <Field label="Avatar Image" hint="Upload your profile picture or provide an external URL.">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 relative">
                    <Input value={profileAvatarUrl} onChange={setProfileAvatarUrl} placeholder="E.g. /uploads/avatar.png" />
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMediaTarget("profileAvatarUrl");
                        setIsMediaOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-brand-900 hover:bg-accent-600 rounded-lg cursor-pointer transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Media Library</span>
                    </button>
                    <label className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg cursor-pointer transition-all">
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <span>Upload</span>
                      )}
                      <input
                        type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingAvatar(true);
                          const formData = new FormData();
                          formData.append("file", file);
                          fetch("/api/upload", { method: "POST", body: formData })
                            .then((r) => r.json())
                            .then((data) => { if (data.url) setProfileAvatarUrl(data.url); })
                            .catch((err) => alert(err.message))
                            .finally(() => setUploadingAvatar(false));
                        }}
                        disabled={uploadingAvatar}
                      />
                    </label>
                    {profileAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setProfileAvatarUrl("")}
                        className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-lg transition-all"
                        title="Clear Avatar"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                {profileAvatarUrl && (
                  <div className="mt-2.5 p-3 bg-brand-50/50 border border-brand-100/50 rounded-xl flex items-center justify-center w-16 h-16">
                    <img src={profileAvatarUrl} alt="Avatar Preview" className="w-12 h-12 rounded-full object-cover" />
                  </div>
                )}
              </Field>
            </Section>

            <Section title="Social Links">
              <Field label="Twitter / X URL">
                <Input value={profileTwitter} onChange={setProfileTwitter} placeholder="https://twitter.com/yourhandle" />
              </Field>
              <Field label="GitHub URL">
                <Input value={profileGithub} onChange={setProfileGithub} placeholder="https://github.com/yourhandle" />
              </Field>
              <Field label="LinkedIn URL">
                <Input value={profileLinkedin} onChange={setProfileLinkedin} placeholder="https://linkedin.com/in/yourprofile" />
              </Field>
              <Field label="Website URL">
                <Input value={profileWebsite} onChange={setProfileWebsite} placeholder="https://yoursite.com" />
              </Field>
            </Section>

            <Section title="Change Password">
              <Field label="New Password" hint="Minimum 8 characters. Leave blank to keep current password.">
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"} value={newPw}
                    onChange={(e) => setNewPw(e.target.value)} placeholder="New password"
                    className="w-full text-xs font-medium text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-600"
                  >
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm New Password">
                <Input value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Confirm new password" />
              </Field>
              {profileErr && <p className="text-[9px] font-bold text-red-500">{profileErr}</p>}
            </Section>

            <div className="flex justify-end">
              <SaveBtn saving={savingProfile} saved={savedProfile} onClick={saveProfile} label="Update Profile" />
            </div>
          </>
        )}

        {/* ── Site ─────────────────────────────────────────────────────────── */}
        {tab === "site" && (
          <>
            <Section title="Site Identity">
              <Field label="Site Name">
                <Input value={settings.siteName ?? ""} onChange={set("siteName")} placeholder="NEXUS" />
              </Field>
              <Field label="Tagline">
                <Input value={settings.siteTagline ?? ""} onChange={set("siteTagline")} placeholder="The Future of Tech" />
              </Field>
              <Field label="Site Description">
                <Textarea value={settings.siteDescription ?? ""} onChange={set("siteDescription")} placeholder="A brief description of your site..." />
              </Field>
              <Field label="Site URL" hint="Used for canonical links and Open Graph tags.">
                <Input value={settings.siteUrl ?? ""} onChange={set("siteUrl")} placeholder="https://alifxperience.com" />
              </Field>
            </Section>

            <Section title="Appearance">
              <Field label="Logo Type">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { set("logoType")("text"); if (!settings.logotext) set("logotext")(settings.siteName || ""); }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                      (settings.logoType ?? "text") === "text"
                        ? "bg-brand-900 text-white border-brand-900"
                        : "bg-brand-50 text-brand-600 border-brand-200 hover:bg-brand-100"
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    Text Logo
                  </button>
                  <button
                    type="button"
                    onClick={() => set("logoType")("image")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                      settings.logoType === "image"
                        ? "bg-brand-900 text-white border-brand-900"
                        : "bg-brand-50 text-brand-600 border-brand-200 hover:bg-brand-100"
                    }`}
                  >
                    <Image className="w-3.5 h-3.5" />
                    Image Logo
                  </button>
                </div>
              </Field>

              {(settings.logoType ?? "text") === "text" ? (
                <Field label="Logo Text" hint="The text displayed as your site logo. Leave empty to use the site name.">
                  <Input value={settings.logotext ?? ""} onChange={set("logotext")} placeholder={settings.siteName || "NEXUS"} />
                </Field>
              ) : (
                <Field label="Logo Image" hint="Upload your site logo or provide an external URL.">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 relative">
                      <Input value={settings.logoUrl ?? ""} onChange={set("logoUrl")} placeholder="E.g. /uploads/logo.png" />
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMediaTarget("logoUrl");
                          setIsMediaOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-brand-900 hover:bg-accent-600 rounded-lg cursor-pointer transition-all"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Choose from Media</span>
                      </button>
                      <label className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg cursor-pointer transition-all">
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <span>Upload Logo</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUpload(e, "logoUrl", setUploadingLogo)}
                          disabled={uploadingLogo}
                        />
                      </label>
                      {settings.logoUrl && (
                        <button
                          type="button"
                          onClick={() => set("logoUrl")("")}
                          className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-lg transition-all"
                          title="Clear Logo"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {settings.logoUrl && (
                    <div className="mt-2.5 p-3 bg-brand-50/50 border border-brand-100/50 rounded-xl flex items-center justify-center max-w-xs">
                      <img src={settings.logoUrl} alt="Logo Preview" className="max-h-12 object-contain" />
                    </div>
                  )}
                </Field>
              )}

              <Field label="Footer Bio" hint="A short description shown in the footer next to your logo.">
                <Textarea value={settings.footerBio ?? ""} onChange={set("footerBio")} placeholder="The future of technology journalism — honest, independent, and always ahead." rows={2} />
              </Field>

              <Field label="Favicon Image" hint="Upload .ico or PNG icon file, or specify an external link.">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 relative">
                    <Input value={settings.faviconUrl ?? ""} onChange={set("faviconUrl")} placeholder="E.g. /favicon.ico" />
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMediaTarget("faviconUrl");
                        setIsMediaOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-brand-900 hover:bg-accent-600 rounded-lg cursor-pointer transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Choose from Media</span>
                    </button>
                    <label className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg cursor-pointer transition-all">
                      {uploadingFavicon ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <span>Upload Favicon</span>
                      )}
                      <input
                        type="file"
                        accept="image/*,.ico"
                        className="hidden"
                        onChange={(e) => handleUpload(e, "faviconUrl", setUploadingFavicon)}
                        disabled={uploadingFavicon}
                      />
                    </label>
                    {settings.faviconUrl && (
                      <button
                        type="button"
                        onClick={() => set("faviconUrl")("")}
                        className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-lg transition-all"
                        title="Clear Favicon"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                {settings.faviconUrl && (
                  <div className="mt-2.5 p-3 bg-brand-50/50 border border-brand-100/50 rounded-xl flex items-center justify-center w-12 h-12">
                    <img src={settings.faviconUrl} alt="Favicon Preview" className="w-6 h-6 object-contain" />
                  </div>
                )}
              </Field>

              <Field label="Posts Per Page">
                <Input value={settings.postsPerPage ?? "10"} onChange={set("postsPerPage")} type="number" placeholder="10" />
              </Field>
            </Section>

            <Section title="System & Widgets">
              <Toggle value={bool("maintenanceMode")} onChange={setBool("maintenanceMode")} label="Maintenance Mode — make the site temporarily unavailable to visitors" />
              <Toggle value={bool("newsTickerEnabled")} onChange={setBool("newsTickerEnabled")} label="News Ticker — show/hide the animated breaking news marquee on top of pages" />
              <Toggle value={bool("showPostViews")} onChange={setBool("showPostViews")} label="Show Post Views — display view counts publicly on single post pages" />
            </Section>

            <div className="flex justify-end">
              <SaveBtn saving={savingSettings} saved={savedSettings} onClick={saveSettings} />
            </div>
          </>
        )}

        {/* ── SEO ──────────────────────────────────────────────────────────── */}
        {tab === "seo" && (
          <>
            <Section title="Default Meta Tags">
              <Field label="Meta Title" hint="Shown in browser tab and search results. ~60 characters recommended.">
                <Input value={settings.metaTitle ?? ""} onChange={set("metaTitle")} placeholder="NEXUS | The Future of Tech" />
                <p className="text-[9px] text-brand-300 font-medium mt-1">{(settings.metaTitle ?? "").length} / 60 chars</p>
              </Field>
              <Field label="Meta Description" hint="Shown in search results. ~160 characters recommended.">
                <Textarea value={settings.metaDescription ?? ""} onChange={set("metaDescription")} placeholder="A modern technology magazine..." rows={3} />
                <p className="text-[9px] text-brand-300 font-medium mt-1">{(settings.metaDescription ?? "").length} / 160 chars</p>
              </Field>
              <Field label="Default Keywords" hint="Comma-separated keywords.">
                <Input value={settings.metaKeywords ?? ""} onChange={set("metaKeywords")} placeholder="technology, AI, hardware..." />
              </Field>
            </Section>

            <Section title="Search Crawling & Index Files">
              <div className="space-y-4">
                <p className="text-xs text-brand-500 leading-relaxed font-medium">
                  Dynamic indexing files are generated automatically. Search engine bots (like Googlebot) read these index assets to crawl, scan, and list your pages.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sitemap Card */}
                  <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-900">Dynamic Sitemap</span>
                      </div>
                      <p className="text-[10px] text-brand-400 font-medium">
                        Lists all published posts and pages automatically. Submitting this link inside Google Search Console indexes your site instantly.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <code className="bg-white border border-brand-100 rounded px-2.5 py-1.5 text-[10px] font-mono text-brand-600 truncate">
                        {settings.siteUrl ? `${settings.siteUrl.replace(/\/$/, "")}/sitemap.xml` : "https://alifxperience.com/sitemap.xml"}
                      </code>
                      <div className="flex items-center gap-2">
                        <a
                          href="/sitemap.xml"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center bg-white hover:bg-brand-100 border border-brand-200 rounded px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-brand-700 transition-all flex items-center justify-center gap-1"
                        >
                          <Globe className="w-3 h-3" /> View Sitemap
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const url = settings.siteUrl ? `${settings.siteUrl.replace(/\/$/, "")}/sitemap.xml` : `${window.location.origin}/sitemap.xml`;
                            navigator.clipboard.writeText(url);
                            alert("Sitemap link copied to clipboard!");
                          }}
                          className="px-3 py-1.5 bg-brand-900 hover:bg-accent-600 text-white rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3 h-3" /> Copy URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Robots Card */}
                  <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-900">Robots Directive</span>
                      </div>
                      <p className="text-[10px] text-brand-400 font-medium">
                        Instructs search engine bots which directories to allow or disallow, and points crawlers directly to your sitemap file.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <code className="bg-white border border-brand-100 rounded px-2.5 py-1.5 text-[10px] font-mono text-brand-600 truncate">
                        {settings.siteUrl ? `${settings.siteUrl.replace(/\/$/, "")}/robots.txt` : "https://alifxperience.com/robots.txt"}
                      </code>
                      <div className="flex items-center gap-2">
                        <a
                          href="/robots.txt"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center bg-white hover:bg-brand-100 border border-brand-200 rounded px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-brand-700 transition-all flex items-center justify-center gap-1"
                        >
                          <Globe className="w-3 h-3" /> View Robots
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const url = settings.siteUrl ? `${settings.siteUrl.replace(/\/$/, "")}/robots.txt` : `${window.location.origin}/robots.txt`;
                            navigator.clipboard.writeText(url);
                            alert("Robots link copied to clipboard!");
                          }}
                          className="px-3 py-1.5 bg-brand-900 hover:bg-accent-600 text-white rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3 h-3" /> Copy URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <div className="flex justify-end">
              <SaveBtn saving={savingSettings} saved={savedSettings} onClick={saveSettings} />
            </div>
          </>
        )}
        {/* ── Analytics & Ads ──────────────────────────────────────────────── */}
        {tab === "ads" && (
          <>
            {/* Google Analytics */}
            <Section title="Google Analytics 4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-2">
                <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <path d="M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0z" fill="#4285F4" />
                    <path d="M12 7v5l3.5 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-800">How to get your GA4 IDs & API Keys</p>
                  <ol className="text-[9px] text-blue-600 font-medium mt-1 space-y-1.5 list-decimal list-inside">
                    <li><strong>Measurement ID:</strong> Copy the <code className="font-mono bg-blue-100 px-1 rounded">G-XXXXXXXXXX</code> stream ID from GA4 Web Stream.</li>
                    <li><strong>Property ID:</strong> Find the numeric Property ID under Admin → Property Settings.</li>
                    <li><strong>Reporting API Setup:</strong> Create a Service Account in Google Cloud Console, download the JSON key file, and input the Client Email and Private Key below.</li>
                    <li><strong>Important:</strong> Share your GA4 property read access with the Service Account email.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <Field label="Measurement ID" hint="Format: G-XXXXXXXXXX — tracks page views, sessions, and user behaviour automatically.">
                  <div className="relative">
                    <Input
                      value={settings.googleAnalyticsId ?? ""}
                      onChange={set("googleAnalyticsId")}
                      placeholder="G-XXXXXXXXXX"
                    />
                    {settings.googleAnalyticsId?.startsWith("G-") && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                        <Check className="w-3 h-3" /> Live
                      </span>
                    )}
                  </div>
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="GA4 Property ID" hint="E.g. 123456789 (Found under GA4 Admin → Property Settings).">
                    <Input
                      value={settings.gaPropertyId ?? ""}
                      onChange={set("gaPropertyId")}
                      placeholder="123456789"
                    />
                  </Field>
                  <Field label="Service Account Email" hint="E.g. analytics@project.iam.gserviceaccount.com">
                    <Input
                      value={settings.gaClientEmail ?? ""}
                      onChange={set("gaClientEmail")}
                      placeholder="name@project-id.iam.gserviceaccount.com"
                    />
                  </Field>
                </div>

                <Field label="Service Account Private Key" hint="Must include -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----">
                  <textarea
                    value={settings.gaPrivateKey ?? ""}
                    onChange={(e) => set("gaPrivateKey")(e.target.value)}
                    placeholder="-----BEGIN PRIVATE KEY-----\n..."
                    rows={4}
                    className="w-full font-mono text-[9px] leading-relaxed text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all resize-y"
                  />
                </Field>
              </div>

              {settings.googleAnalyticsId && !settings.googleAnalyticsId.startsWith("G-") && (
                <p className="text-[9px] font-bold text-amber-500 mt-2">⚠ ID should start with G- (GA4 format).</p>
              )}

              {settings.gaPropertyId && settings.gaClientEmail && settings.gaPrivateKey && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg mt-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-bold text-emerald-700">
                    Real-time Reporting API configured successfully — fetching Google Analytics metrics.
                  </p>
                </div>
              )}
            </Section>

            {/* Google AdSense */}
            <Section title="Google AdSense">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg mb-2">
                <div className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-800">How to get your Publisher ID</p>
                  <ol className="text-[9px] text-amber-700 font-medium mt-1 space-y-0.5 list-decimal list-inside">
                    <li>Go to adsense.google.com → Account → Account information</li>
                    <li>Copy your Publisher ID (starts with <code className="font-mono bg-amber-100 px-1 rounded">ca-pub-</code>)</li>
                    <li>Paste it below — the AdSense script loads automatically on all pages</li>
                  </ol>
                </div>
              </div>
              <Field label="Publisher ID" hint="Format: ca-pub-XXXXXXXXXXXXXXXX — enables auto ads across your entire site.">
                <div className="relative">
                  <Input
                    value={settings.googleAdsenseId ?? ""}
                    onChange={set("googleAdsenseId")}
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  />
                  {settings.googleAdsenseId?.startsWith("ca-pub-") && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                      <Check className="w-3 h-3" /> Valid
                    </span>
                  )}
                </div>
              </Field>
              {settings.googleAdsenseId && !settings.googleAdsenseId.startsWith("ca-pub-") && (
                <p className="text-[9px] font-bold text-amber-500">⚠ Publisher ID should start with ca-pub-</p>
              )}
              {settings.googleAdsenseId?.startsWith("ca-pub-") && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-bold text-emerald-700">
                    AdSense script is active — publisher <code className="font-mono">{settings.googleAdsenseId}</code>
                  </p>
                </div>
              )}

              {/* Auto ads note */}
              <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg">
                <p className="text-[9px] font-bold text-brand-600 mb-1">Auto Ads (recommended)</p>
                <p className="text-[9px] text-brand-400 font-medium leading-relaxed">
                  With Auto Ads enabled in your AdSense dashboard, Google automatically places and optimises ads across your site without any additional code.
                  Go to <strong>AdSense → Ads → By site</strong> and enable <strong>Auto ads</strong> for your domain.
                </p>
              </div>

              {/* ads.txt Integration */}
              <div className="mt-4 p-4 bg-brand-50 border border-brand-100 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${settings.googleAdsenseId?.startsWith("ca-pub-") ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-900">ads.txt Directory File</span>
                </div>
                <p className="text-[10px] text-brand-400 font-medium leading-relaxed">
                  AdSense crawlers strictly require an <code className="font-mono bg-white px-1 border border-brand-100 rounded">ads.txt</code> file to verify dynamic seller authorization. Your system hosts and updates this file automatically at your domain root.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <code className="bg-white border border-brand-100 rounded px-2.5 py-1.5 text-[9px] font-mono text-brand-600 truncate">
                    {settings.siteUrl ? `${settings.siteUrl.replace(/\/$/, "")}/ads.txt` : "https://alifxperience.com/ads.txt"}
                  </code>
                  <div className="flex items-center gap-2">
                    <a
                      href="/ads.txt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center bg-white hover:bg-brand-100 border border-brand-200 rounded px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-brand-700 transition-all flex items-center justify-center gap-1"
                    >
                      <Globe className="w-3 h-3" /> View ads.txt
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const url = settings.siteUrl ? `${settings.siteUrl.replace(/\/$/, "")}/ads.txt` : `${window.location.origin}/ads.txt`;
                        navigator.clipboard.writeText(url);
                        alert("ads.txt URL copied to clipboard!");
                      }}
                      className="px-3.5 py-1.5 bg-brand-900 hover:bg-accent-600 text-white rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" /> Copy URL
                    </button>
                  </div>
                </div>
              </div>
            </Section>

            {/* Managed Ad Space Redirect Note */}
            <Section title="Managed Sponsor Placements">
              <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-accent-700">
                    <Megaphone className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Dynamic Ad Server Connected</span>
                  </div>
                  <p className="text-xs text-brand-900 font-bold">Manage Campaigns & Native Trackers</p>
                  <p className="text-[10px] text-brand-400 font-medium leading-relaxed max-w-lg">
                    Ad placements, multi-company rotations, entry popups, and detailed impression/click CTR trackers are now managed under the unified Ads Management Console.
                  </p>
                </div>
                <Link
                  href="/admin/ads"
                  className="px-4 py-2.5 bg-brand-900 hover:bg-accent-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all shadow-md cursor-pointer shrink-0"
                >
                  Go to Ads Console
                </Link>
              </div>
            </Section>

            <div className="flex justify-end">
              <SaveBtn saving={savingSettings} saved={savedSettings} onClick={saveSettings} />
            </div>
          </>
        )}


        {/* ── Social ───────────────────────────────────────────────────────── */}
        {tab === "social" && (
          <>
            <Section title="Social Media Profiles">
              {[
                { key: "twitterUrl", label: "Twitter / X", placeholder: "https://twitter.com/nexusmag" },
                { key: "linkedinUrl", label: "LinkedIn", placeholder: "https://linkedin.com/company/nexus" },
                { key: "githubUrl", label: "GitHub", placeholder: "https://github.com/nexus" },
                { key: "youtubeUrl", label: "YouTube", placeholder: "https://youtube.com/@nexus" },
              ].map((f) => (
                <Field key={f.key} label={f.label}>
                  <Input value={settings[f.key] ?? ""} onChange={set(f.key)} placeholder={f.placeholder} />
                </Field>
              ))}
            </Section>

            <div className="flex justify-end">
              <SaveBtn saving={savingSettings} saved={savedSettings} onClick={saveSettings} />
            </div>
          </>
        )}

        {/* ── Comments ─────────────────────────────────────────────────────── */}
        {tab === "comments" && (
          <>
            <Section title="Comment Settings">
              <Toggle value={bool("allowComments")} onChange={setBool("allowComments")} label="Enable comments on posts" />
              <Toggle value={bool("requireCommentApproval")} onChange={setBool("requireCommentApproval")} label="Require manual approval before comments appear" />
            </Section>

            <div className="flex justify-end">
              <SaveBtn saving={savingSettings} saved={savedSettings} onClick={saveSettings} />
            </div>
          </>
        )}


        {/* ── Email & Auth ─────────────────────────────────────────────────── */}
        {tab === "email_auth" && (
          <>
            {/* User Registration Settings */}
            <Section title="User Authentication & Registration">
              <div className="space-y-4">
                <Toggle
                  value={bool("allowRegistration")}
                  onChange={setBool("allowRegistration")}
                  label="Enable Public User Registration"
                />
                
                <Field
                  label="Default New User Role"
                  hint="The role assigned to newly registered users by default."
                >
                  <select
                    value={settings.defaultUserRole ?? "USER"}
                    onChange={(e) => set("defaultUserRole")(e.target.value)}
                    className="w-full text-xs font-medium text-brand-900 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                  >
                    <option value="USER">Reader / Subscriber</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* SMTP Settings */}
            <Section title="SMTP Mail Configuration">
              <div className="flex items-start gap-3 p-3 bg-brand-50 border border-brand-100 rounded-lg mb-2">
                <div className="w-5 h-5 mt-0.5 flex-shrink-0 text-brand-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-800">SMTP Integration Benefits</p>
                  <p className="text-[9px] text-brand-500 font-medium leading-relaxed mt-0.5">
                    Configure your SMTP credentials to send user invitation links, password reset emails, comment approval alerts, and newsletters directly from your custom domain.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Field label="SMTP Host" hint="E.g. smtp.mailgun.org, smtp.gmail.com, mail.yourdomain.com">
                    <Input
                      value={settings.smtpHost ?? ""}
                      onChange={set("smtpHost")}
                      placeholder="smtp.example.com"
                    />
                  </Field>
                </div>
                <div>
                  <Field label="SMTP Port" hint="E.g. 587, 465, 25">
                    <Input
                      value={settings.smtpPort ?? "587"}
                      onChange={set("smtpPort")}
                      placeholder="587"
                    />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="SMTP Username">
                  <Input
                    value={settings.smtpUser ?? ""}
                    onChange={set("smtpUser")}
                    placeholder="user@example.com"
                  />
                </Field>
                <Field label="SMTP Password">
                  <div className="relative">
                    <input
                      type={showSmtpPass ? "text" : "password"}
                      value={settings.smtpPass ?? ""}
                      onChange={(e) => set("smtpPass")(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full text-xs font-medium text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-600"
                    >
                      {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Field label="SMTP Secure Connection">
                    <select
                      value={settings.smtpSecure ?? "tls"}
                      onChange={(e) => set("smtpSecure")(e.target.value)}
                      className="w-full text-xs font-medium text-brand-900 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                    >
                      <option value="tls">STARTTLS (587)</option>
                      <option value="ssl">SSL / TLS (465)</option>
                      <option value="none">None (25 / 2525)</option>
                    </select>
                  </Field>
                </div>
                <div>
                  <Field label="Sender Email Address" hint="Must match configured domain or address.">
                    <Input
                      value={settings.smtpSenderEmail ?? ""}
                      onChange={set("smtpSenderEmail")}
                      placeholder="noreply@yourdomain.com"
                    />
                  </Field>
                </div>
                <div>
                  <Field label="Sender Display Name" hint="The visible from name.">
                    <Input
                      value={settings.smtpSenderName ?? "NEXUS Tech"}
                      onChange={set("smtpSenderName")}
                      placeholder="NEXUS Support"
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* Google One Tap Auto-Subscribe */}
            <Section title="Google One Tap Auto-Subscribe">
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-2">
                <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/>
                    <path d="M12 7v5l3.5 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-800">Auto-Capture Visitor Gmail on Visit</p>
                  <p className="text-[9px] text-blue-600 font-medium mt-0.5">
                    When enabled, a Google sign-in prompt appears automatically. Users who sign in will be subscribed to your newsletter automatically.
                  </p>
                  <ol className="text-[9px] text-blue-600 font-medium mt-1 space-y-0.5 list-decimal list-inside">
                    <li>Create a project in <strong>Google Cloud Console</strong></li>
                    <li>Enable <strong>Google+ API</strong> or <strong>Google Identity Services</strong></li>
                    <li>Create <strong>OAuth 2.0 credentials</strong> (Web application)</li>
                    <li>Add your domain to <strong>Authorized JavaScript origins</strong></li>
                    <li>Copy the <strong>Client ID</strong> and paste below</li>
                  </ol>
                </div>
              </div>

              <Field label="Google OAuth Client ID" hint="Paste your Google Cloud OAuth Client ID here">
                <Input
                  value={settings.googleClientId ?? ""}
                  onChange={set("googleClientId")}
                  placeholder="123456789-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                />
              </Field>
              
              {settings.googleClientId && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg mt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-bold text-emerald-700">
                    Google One Tap is active — visitors will be prompted to sign in with Google
                  </p>
                </div>
              )}
            </Section>

            <div className="flex justify-end">
              <SaveBtn saving={savingSettings} saved={savedSettings} onClick={saveSettings} />
            </div>
          </>
        )}


        {/* ── FTP Storage ─────────────────────────────────────────────────── */}
        {tab === "storage" && (
          <>
            {/* Storage Integration Switch */}
            <Section title="External Storage Settings">
              <div className="space-y-4">
                <Toggle
                  value={bool("ftpEnabled")}
                  onChange={setBool("ftpEnabled")}
                  label="Enable FTP Media Storage Integration"
                />
                <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg">
                  <p className="text-[10px] font-bold text-brand-700">How FTP Uploading Works</p>
                  <p className="text-[9px] text-brand-400 font-medium leading-relaxed mt-0.5">
                    When enabled, all newly uploaded images and media files (e.g. logo, favicons, editor assets) are automatically moved to your dedicated high-speed FTP server instead of your local workspace. The public web server will automatically fetch assets from your Public CDN or Website base URL configured below.
                  </p>
                </div>
              </div>
            </Section>

            {/* FTP Credentials & Paths */}
            <Section title="FTP Server Connection">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Field label="FTP Host / Server Address" hint="E.g. ftp.yourdomain.com, cdn-storage.net">
                    <Input
                      value={settings.ftpHost ?? ""}
                      onChange={set("ftpHost")}
                      placeholder="ftp.example.com"
                    />
                  </Field>
                </div>
                <div>
                  <Field label="FTP Port" hint="Default is 21 for normal FTP.">
                    <Input
                      value={settings.ftpPort ?? "21"}
                      onChange={set("ftpPort")}
                      placeholder="21"
                    />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="FTP Username">
                  <Input
                    value={settings.ftpUser ?? ""}
                    onChange={set("ftpUser")}
                    placeholder="ftp_user_nexus"
                  />
                </Field>
                <Field label="FTP Password">
                  <div className="relative">
                    <input
                      type={showFtpPass ? "text" : "password"}
                      value={settings.ftpPass ?? ""}
                      onChange={(e) => set("ftpPass")(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full text-xs font-medium text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFtpPass(!showFtpPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-600"
                    >
                      {showFtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Remote Folder Path" hint="Directory on the remote host, e.g. /public_html/uploads">
                  <Input
                    value={settings.ftpRemotePath ?? "/"}
                    onChange={set("ftpRemotePath")}
                    placeholder="/"
                  />
                </Field>
                <Field label="Public Access URL" hint="Base web address to resolve remote uploads, e.g. https://cdn.example.com">
                  <Input
                    value={settings.ftpPublicUrl ?? ""}
                    onChange={set("ftpPublicUrl")}
                    placeholder="https://cdn.example.com/uploads"
                  />
                </Field>
              </div>

              {/* Connection Test feedback */}
              {ftpTestResult && (
                <div className={`mt-4 p-4 border rounded-xl flex items-start gap-3 transition-all ${
                  ftpTestResult.success 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                    : "bg-red-50 border-red-100 text-red-800"
                }`}>
                  <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                    {ftpTestResult.success ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      {ftpTestResult.success ? "Connection Successful" : "Connection Failed"}
                    </p>
                    <p className="text-[9px] font-medium leading-relaxed mt-0.5">
                      {ftpTestResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Test File feedback */}
              {ftpTestFileResult && (
                <div className={`mt-4 p-4 border rounded-xl flex items-start gap-3 transition-all ${
                  ftpTestFileResult.success
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-red-50 border-red-100 text-red-800"
                }`}>
                  <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                    {ftpTestFileResult.success ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      {ftpTestFileResult.success ? "Test File Uploaded" : "Test File Failed"}
                    </p>
                    <p className="text-[9px] font-medium leading-relaxed mt-0.5">
                      {ftpTestFileResult.message}
                    </p>
                    {ftpTestFileResult.success && ftpTestFileResult.remotePath && ftpTestFileResult.filename && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-[9px]">
                          <div>
                            <span className="font-medium">Remote Path:</span>
                            <span className="font-mono">{ftpTestFileResult.remotePath}</span>
                          </div>
                          <div>
                            <span className="font-medium">Filename:</span>
                            <span className="font-mono">{ftpTestFileResult.filename}</span>
                          </div>
                          {ftpTestFileResult.fileSize !== undefined && (
                            <div>
                              <span className="font-medium">File Size:</span>
                              <span className="font-mono">{ftpTestFileResult.fileSize} bytes</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {ftpTestFileResult.url && (
                      <div className="mt-2 flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 border border-emerald-200/60">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-600 shrink-0">URL:</span>
                        <a
                          href={ftpTestFileResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-accent-600 hover:text-accent-700 underline truncate"
                        >
                          {ftpTestFileResult.url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Section>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={testFtpConnection}
                disabled={testingFtp || savingSettings}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border border-brand-200 text-brand-700 bg-white hover:bg-brand-50 rounded-lg disabled:opacity-50 transition-all cursor-pointer font-medium"
              >
                {testingFtp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <span>Test Connection</span>
                )}
              </button>
              <button
                type="button"
                onClick={createFtpTestFile}
                disabled={creatingFtpTestFile || savingSettings}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border border-accent-300 text-accent-700 bg-accent-50 hover:bg-accent-100 rounded-lg disabled:opacity-50 transition-all cursor-pointer font-medium"
              >
                {creatingFtpTestFile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Create Test File</span>
                  </>
                )}
              </button>
              <SaveBtn saving={savingSettings} saved={savedSettings} onClick={saveSettings} />
            </div>
          </>
        )}

        {/* ── Danger Zone ──────────────────────────────────────────────────── */}
        {tab === "danger" && (
          <div className="bg-white rounded-xl border border-red-200 p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-red-100">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-red-600">Danger Zone</h2>
                <p className="text-[9px] text-red-400 font-medium mt-0.5">These actions are irreversible. Proceed with caution.</p>
              </div>
            </div>

            {[
              {
                label: "Clear All Drafts",
                desc: "Permanently delete all unpublished draft posts. Published posts are not affected.",
                action: async () => {
                  if (!confirm("Delete all drafts permanently? This cannot be undone.")) return;
                  await fetch("/api/posts?draftsOnly=1", { method: "DELETE" });
                  alert("All drafts deleted.");
                },
              },
              {
                label: "Clear All Comments",
                desc: "Remove all comments across all posts. Posts remain untouched.",
                action: async () => {
                  if (!confirm("Delete all comments permanently? This cannot be undone.")) return;
                  await fetch("/api/comments?all=1", { method: "DELETE" });
                  alert("All comments deleted.");
                },
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 py-3 border-b border-red-50 last:border-0">
                <div>
                  <p className="text-xs font-bold text-brand-900">{item.label}</p>
                  <p className="text-[9px] text-brand-400 font-medium mt-0.5 max-w-md">{item.desc}</p>
                </div>
                <button
                  onClick={item.action}
                  className="flex-shrink-0 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                >
                  {item.label}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <MediaSelectorModal
        isOpen={isMediaOpen}
        onClose={() => {
          setIsMediaOpen(false);
          setMediaTarget(null);
        }}
        onSelect={(item) => {
          if (mediaTarget) {
            if (mediaTarget === "profileAvatarUrl") {
              setProfileAvatarUrl(item.url);
            } else {
              setSettings((prev) => ({ ...prev, [mediaTarget]: item.url }));
            }
          }
          setIsMediaOpen(false);
          setMediaTarget(null);
        }}
        allowedTypes="image"
      />
    </div>
  );
}
