"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

const TipTapEditor = dynamic(() => import("@/components/TipTapEditor"), {
  ssr: false,
});
import {
  Mail,
  Users,
  Trash2,
  Plus,
  Search,
  Send,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export default function NewsletterPage() {
  const { data: session, status: sessionStatus } = useSession();
  const role = (session?.user as any)?.role;

  // Composing newsletter
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Subscribers list
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Adding manual subscriber
  const [newEmail, setNewEmail] = useState("");
  const [addingEmail, setAddingEmail] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  const [addSuccess, setAddSuccess] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch subscribers list
  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/newsletter");
      if (!res.ok) {
        let errText = `Status ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error) errText = errData.error;
        } catch {}
        throw new Error(`Failed to load subscribers: ${errText}`);
      }
      const data = await res.json();
      setSubscribers(data);
      setAddMsg("");
    } catch (err: any) {
      console.error("Error loading subscribers:", err);
      setAddMsg(err.message || "Failed to load subscribers.");
      setAddSuccess(false);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    if (role === "ADMIN") {
      fetchSubscribers();
    }
  }, [role]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Authenticating Session...</p>
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-full">
          <ShieldOff className="w-8 h-8" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-bold text-brand-900">Access Denied</h2>
          <p className="text-xs text-brand-400 mt-1 font-medium">You do not have the required permissions to access this management area. Please contact system administrator.</p>
        </div>
      </div>
    );
  }

  // Handle manual subscriber creation
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      setAddMsg("Please enter a valid email address.");
      setAddSuccess(false);
      return;
    }

    setAddingEmail(true);
    setAddMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to add email");

      setAddMsg(data.message || "Added successfully!");
      setAddSuccess(true);
      setNewEmail("");
      fetchSubscribers();
      setTimeout(() => {
        setAddMsg("");
        setShowAddForm(false);
      }, 2500);
    } catch (err: any) {
      setAddMsg(err.message);
      setAddSuccess(false);
    } finally {
      setAddingEmail(false);
    }
  };

  // Handle subscriber deletion
  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the newsletter list?`)) return;

    try {
      const res = await fetch(`/api/newsletter?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete subscriber");

      // Refresh list
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      if (currentPage > Math.ceil((subscribers.length - 1) / pageSize) && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle sending newsletter
  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setSendResult({ success: false, message: "Subject and Body content cannot be empty." });
      return;
    }

    if (
      !confirm(
        `Are you ready to send this newsletter blast to all ${subscribers.length} active subscribers?`
      )
    ) {
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send newsletter.");
      }

      setSendResult({
        success: true,
        message: `${data.message} ${data.details || ""}`,
      });
      // Clear fields on success
      setSubject("");
      setBody("");
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || "Failed to dispatch newsletter. Please check your SMTP settings.",
      });
    } finally {
      setSending(false);
    }
  };

  // Filter subscribers based on search query
  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredSubscribers.length / pageSize));
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-1">
            Communication Center
          </p>
          <h1 className="text-2xl font-black text-brand-900 tracking-tight">Newsletter Campaigns</h1>
          <p className="text-xs text-brand-400 font-medium mt-0.5">
            Manage your subscribers list and dispatch custom formatted newsletters through SMTP.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white bg-brand-900 hover:bg-accent-600 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Subscriber</span>
        </button>
      </div>

      {/* Manual Addition Form Collapse */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-brand-100/60 p-5 space-y-4 shadow-sm">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-brand-900">
            Manual Subscriber Addition
          </h2>
          <form onSubmit={handleAddSubscriber} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="reader@domain.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={addingEmail}
              className="flex-1 text-xs font-medium text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={addingEmail}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {addingEmail ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Save Email
                </>
              )}
            </button>
          </form>
          {addMsg && (
            <p
              className={`text-[9px] font-bold uppercase tracking-wider ${
                addSuccess ? "text-emerald-600" : "text-amber-500"
              }`}
            >
              {addMsg}
            </p>
          )}
        </div>
      )}

      {/* Analytics Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-brand-100/60 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-400">
              Total Subscribers
            </p>
            <h3 className="text-3xl font-black text-brand-900 tracking-tight">
              {loadingSubscribers ? "..." : subscribers.length}
            </h3>
            <p className="text-[9px] text-brand-300 font-medium">Active recipients list size</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-100/60 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-400">
              SMTP Status
            </p>
            <h3 className="text-lg font-black text-brand-900 tracking-tight uppercase flex items-center gap-1.5 pt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </h3>
            <p className="text-[9px] text-brand-300 font-medium">Linked to secure SMTP transport</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-100/60 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-400">
              Recent Growth
            </p>
            <h3 className="text-3xl font-black text-brand-900 tracking-tight">
              +{subscribers.filter((s) => {
                const joined = new Date(s.createdAt);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return joined >= thirtyDaysAgo;
              }).length}
            </h3>
            <p className="text-[9px] text-brand-300 font-medium">New signups (last 30 days)</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Newsletter Composer */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-brand-100/60 p-6 space-y-6 shadow-sm">
          <div className="border-b border-brand-50 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-900">
              Draft Newsletter Broadcast
            </h2>
            <p className="text-[10px] text-brand-400 font-medium mt-0.5">
              Draft your copy here — custom template wrapping applies to the email body automatically.
            </p>
          </div>

          <form onSubmit={handleSendNewsletter} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-400">
                Email Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Weekly Tech Recap: Next-Gen Quantum Cryptography Hubs"
                disabled={sending}
                className="w-full text-xs font-semibold text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all disabled:opacity-50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-400">
                Email Body Content
              </label>
              <TipTapEditor
                content={body}
                onChange={setBody}
                placeholder="We are thrilled to bring you our latest roundup of industry updates... In this newsletter we highlight the top tech breakthroughs of this week. Enjoy the read!"
              />
              <p className="text-[9px] text-brand-300 font-medium">
                Tiptap rich text editor enables headers, list alignments, anchors, underlines, highlights, and custom line styles.
              </p>
            </div>

            {sendResult && (
              <div
                className={`p-4 border rounded-xl flex items-start gap-3 transition-all ${
                  sendResult.success
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-red-50 border-red-100 text-red-800"
                }`}
              >
                <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                  {sendResult.success ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    {sendResult.success ? "Broadcast Dispatched" : "Dispatch Failed"}
                  </p>
                  <p className="text-[9px] font-medium leading-relaxed mt-0.5">
                    {sendResult.message}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || subscribers.length === 0}
                className="flex items-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-brand-900/10"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Newsletter Blast ({subscribers.length})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Subscribers Management Grid */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-brand-100/60 p-6 flex flex-col min-h-[400px] sm:min-h-[650px] shadow-sm">
          <div className="border-b border-brand-50 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-brand-900">
                Active Subscriber List
              </h2>
              <p className="text-[10px] text-brand-400 font-medium mt-0.5">
                All registered email contacts.
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-50 border border-brand-100 text-brand-400 rounded-full">
              {filteredSubscribers.length} Listed
            </span>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-300" />
            <input
              type="text"
              placeholder="Search subscribers email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
            />
          </div>

          {/* List Scroll */}
          <div className="flex-1 overflow-y-auto min-h-[300px] border border-brand-50 rounded-xl bg-brand-50/10 p-2 space-y-2">
            {loadingSubscribers ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="w-5 h-5 text-brand-300 animate-spin" />
                <p className="text-[9px] font-bold text-brand-300 uppercase tracking-widest">
                  Loading list...
                </p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Mail className="w-8 h-8 text-brand-200 mb-2 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                  No subscribers found
                </p>
                <p className="text-[9px] text-brand-300 mt-1 max-w-xs px-4 leading-relaxed font-medium">
                  {searchQuery ? "No matches for search query." : "Readers who join your email digest from the footer forms will show up here."}
                </p>
              </div>
            ) : (
              paginatedSubscribers.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-white border border-brand-100/50 rounded-lg hover:border-brand-200 transition-all shadow-sm group"
                >
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-xs font-bold text-brand-900 truncate pr-2">{sub.email}</p>
                    <p className="text-[9px] text-brand-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-300" />
                      <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                    title="Remove Subscriber"
                    className="p-1.5 text-brand-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredSubscribers.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-brand-100/60 mt-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-brand-400">
                {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredSubscribers.length)} of {filteredSubscribers.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | string)[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    typeof item === "string" ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-[10px] text-brand-300">...</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item as number)}
                        className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg text-[10px] font-bold uppercase transition-all ${
                          currentPage === item
                            ? "bg-brand-900 text-white"
                            : "border border-brand-200 text-brand-600 hover:bg-brand-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
