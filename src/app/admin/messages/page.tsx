"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Sparkles, 
  Mail, 
  Phone, 
  Calendar, 
  Trash2, 
  Eye, 
  X,
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  Inbox,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role;

  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");

  // Selected message for Modal details view
  const [activeMessage, setActiveMessage] = useState<ContactSubmission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact");
      if (!res.ok) throw new Error("Failed to load contact submissions");
      const data = await res.json();
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "ADMIN") {
      fetchSubmissions();
    }
  }, [role]);

  // Delete message submission
  const handleDeleteMessage = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete message");
      }

      setSubmissions(prev => prev.filter(item => item.id !== id));
      setSuccess("Message submission deleted successfully.");
      setDeletingId(null);
      if (activeMessage?.id === id) {
        setActiveMessage(null);
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Could not delete contact message.");
    }
  };

  // Helper relative time formatter
  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (err) {
      return "Some time ago";
    }
  };

  // Helper topic colored badge style mapping
  const getTopicBadgeStyles = (topic: string) => {
    switch (topic) {
      case "Tech Development Project":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Digital Marketing":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Editorial Tips / Co-Authorship":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "General Inquiry":
        return "bg-sky-50 text-sky-700 border-sky-100";
      default:
        return "bg-brand-50 text-brand-700 border-brand-100";
    }
  };

  // Auth states check
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="w-8 h-8 text-accent-500 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Authenticating Session...</p>
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-white border border-brand-100 rounded-3xl space-y-4">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 animate-bounce">
          <X className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black uppercase tracking-wider text-brand-900">Access Denied</h2>
          <p className="text-[11px] text-brand-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
            You do not have administrative authorization permissions to access this contact messages database.
          </p>
        </div>
      </div>
    );
  }

  // Filter Submissions logic
  const filteredSubmissions = submissions.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.message.toLowerCase().includes(search.toLowerCase()) ||
      (item.phone && item.phone.includes(search));

    const matchesTopic = selectedTopic === "All" || item.topic === selectedTopic;

    return matchesSearch && matchesTopic;
  });

  // Calculate high-level stats counters
  const totalCount = submissions.length;
  const projectCount = submissions.filter(s => s.topic === "Tech Development Project").length;
  const marketingCount = submissions.filter(s => s.topic === "Digital Marketing").length;
  const editorialCount = submissions.filter(s => s.topic === "Editorial Tips / Co-Authorship").length;
  const generalCount = submissions.filter(s => s.topic === "General Inquiry" || s.topic === "Other").length;

  return (
    <div className="space-y-8 relative">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 text-accent-700 rounded-full mb-2 border border-accent-100">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[8.5px] font-black uppercase tracking-wider">Administrative Vault</span>
          </div>
          <h1 className="text-2xl font-black text-brand-900 tracking-tight uppercase">User Messages Inbox</h1>
          <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mt-1">
            Review and respond to all incoming software, marketing, and editorial contact submissions
          </p>
        </div>

        <button 
          onClick={fetchSubmissions}
          disabled={loading}
          className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-brand-650 bg-white border border-brand-200 rounded-lg hover:bg-brand-50 hover:text-brand-900 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Messages
        </button>
      </div>

      {/* Notification Toasts */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wider leading-none">{success}</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 flex items-center gap-3">
          <X className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wider leading-none">{error}</p>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-brand-100 shadow-sm space-y-2">
          <p className="text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Total Inbox</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-brand-900">{totalCount}</span>
            <Inbox className="w-5 h-5 text-brand-300" />
          </div>
        </div>

        {/* Development Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-brand-100 shadow-sm space-y-2">
          <p className="text-[8.5px] font-bold uppercase tracking-widest text-indigo-400">Dev Projects</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-650">{projectCount}</span>
            <span className="text-[9px] bg-indigo-50 text-indigo-650 font-bold px-1.5 py-0.5 rounded border border-indigo-100 uppercase">Tech</span>
          </div>
        </div>

        {/* Marketing Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-brand-100 shadow-sm space-y-2">
          <p className="text-[8.5px] font-bold uppercase tracking-widest text-amber-500">Marketing</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{marketingCount}</span>
            <span className="text-[9px] bg-amber-50 text-amber-600 font-bold px-1.5 py-0.5 rounded border border-amber-100 uppercase">Growth</span>
          </div>
        </div>

        {/* Editorial Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-brand-100 shadow-sm space-y-2">
          <p className="text-[8.5px] font-bold uppercase tracking-widest text-emerald-500">Editorial</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-650">{editorialCount}</span>
            <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Content</span>
          </div>
        </div>

        {/* General/Other Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-brand-100 shadow-sm space-y-2 col-span-2 lg:col-span-1">
          <p className="text-[8.5px] font-bold uppercase tracking-widest text-sky-400">General & Other</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-sky-650">{generalCount}</span>
            <span className="text-[9px] bg-sky-50 text-sky-650 font-bold px-1.5 py-0.5 rounded border border-sky-100 uppercase">Misc</span>
          </div>
        </div>

      </div>

      {/* Main Inbox Panel */}
      <div className="bg-white rounded-3xl border border-brand-100 shadow-sm overflow-hidden space-y-4 py-5">
        
        {/* Filter controls header */}
        <div className="px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-brand-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sender name, email address, message body..."
              className="w-full pl-10 pr-4 py-2 bg-brand-50/50 border border-brand-200 rounded-xl text-xs text-brand-900 placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-brand-400 text-[10px] font-bold uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" /> Topic Filter
            </div>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-2 text-xs text-brand-900 focus:outline-none font-bold uppercase"
            >
              <option value="All">All Topics</option>
              <option value="General Inquiry">General Inquiry</option>
              <option value="Tech Development Project">Tech Development Project</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Editorial Tips / Co-Authorship">Editorial Tips / Co-Authorship</option>
              <option value="Other">Other</option>
            </select>
          </div>

        </div>

        {/* Datatable Rendering */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-accent-500 animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Loading incoming messages database...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto text-brand-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700">No Messages Found</p>
                <p className="text-[10px] text-brand-450 uppercase font-semibold">Try modifying your search or filter inputs</p>
              </div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-y border-brand-50 bg-brand-50/30 text-left">
                  <th className="py-3 px-6 text-[8px] font-black uppercase tracking-wider text-brand-400">Sender Details</th>
                  <th className="py-3 px-6 text-[8px] font-black uppercase tracking-wider text-brand-400">Topic</th>
                  <th className="py-3 px-6 text-[8px] font-black uppercase tracking-wider text-brand-400">Message Preview</th>
                  <th className="py-3 px-6 text-[8px] font-black uppercase tracking-wider text-brand-400">Date Sent</th>
                  <th className="py-3 px-6 text-[8px] font-black uppercase tracking-wider text-brand-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filteredSubmissions.map((item) => (
                  <tr key={item.id} className="hover:bg-brand-50/20 transition-all group">
                    
                    {/* Sender column */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <p className="text-[11.5px] font-black text-brand-900 uppercase tracking-wide leading-none">{item.name}</p>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-medium text-brand-400 leading-none">{item.email}</span>
                          {item.phone && (
                            <span className="text-[9px] font-bold text-accent-600 uppercase tracking-widest leading-none mt-0.5">{item.phone}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Topic column */}
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-1 text-[8.5px] font-bold border rounded-full uppercase tracking-wider ${getTopicBadgeStyles(item.topic)}`}>
                        {item.topic}
                      </span>
                    </td>

                    {/* Message Preview column */}
                    <td className="py-4 px-6">
                      <p className="text-xs text-brand-500 font-medium max-w-xs truncate">
                        {item.message}
                      </p>
                    </td>

                    {/* Date Sent column */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-semibold text-brand-650">{formatRelativeTime(item.createdAt)}</p>
                        <p className="text-[8.5px] text-brand-400 font-bold uppercase tracking-wider">
                          {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </td>

                    {/* Actions column */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveMessage(item)}
                          title="Read full message"
                          className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 hover:bg-accent-600 hover:text-white flex items-center justify-center transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => setDeletingId(item.id)}
                          title="Delete message"
                          className="w-8 h-8 rounded-lg bg-brand-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* View Details Slide-Over/Modal */}
      {activeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-brand-100 shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-brand-900 p-6 text-white relative">
              <button 
                onClick={() => setActiveMessage(null)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center"
              >
                <X className="w-4.5 h-4.5" />
              </button>
              
              <div className="space-y-1">
                <span className={`inline-block px-2.5 py-0.5 text-[8px] font-black border uppercase tracking-wider rounded-full ${getTopicBadgeStyles(activeMessage.topic)}`}>
                  {activeMessage.topic}
                </span>
                <h3 className="text-lg font-black uppercase tracking-tight leading-none mt-2">{activeMessage.name}</h3>
                <p className="text-[10px] text-brand-300 font-bold uppercase tracking-widest mt-0.5">Contact Form Inquiry</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* Metadata Details */}
              <div className="grid grid-cols-2 gap-4 bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-accent-500" /> Email Address
                  </p>
                  <p className="text-xs text-brand-900 font-bold break-all">{activeMessage.email}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-accent-500" /> Phone Number
                  </p>
                  <p className="text-xs text-brand-900 font-bold">
                    {activeMessage.phone || <span className="text-brand-300 font-bold italic">Not provided</span>}
                  </p>
                </div>

                <div className="col-span-2 space-y-1 pt-2 border-t border-brand-100">
                  <p className="text-[8px] font-black uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-accent-500" /> Submitted At
                  </p>
                  <p className="text-xs text-brand-700 font-bold">
                    {new Date(activeMessage.createdAt).toLocaleString(undefined, { 
                      weekday: "short", 
                      month: "short", 
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric", 
                      minute: "2-digit" 
                    })}
                  </p>
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-2">
                <p className="text-[8.5px] font-black uppercase tracking-wider text-brand-400 block border-b border-brand-50 pb-1.5">
                  Message Content
                </p>
                <div className="p-4 bg-brand-50/30 border border-brand-100 rounded-2xl text-xs text-brand-800 leading-relaxed font-medium whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                  {activeMessage.message}
                </div>
              </div>

              {/* Action Response Hooks */}
              <div className="flex gap-3">
                <Link
                  href={`mailto:${activeMessage.email}?subject=Re: AlifXperience - ${activeMessage.topic}`}
                  className="flex-1 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-black uppercase tracking-widest text-[9.5px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-600/10"
                >
                  Reply via Email <ArrowUpRight className="w-4 h-4" />
                </Link>

                <button 
                  onClick={() => {
                    setDeletingId(activeMessage.id);
                  }}
                  className="w-12 h-12 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl text-rose-600 flex items-center justify-center transition-all border border-rose-100"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-brand-100 shadow-2xl p-6 space-y-5 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mx-auto animate-pulse">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h4 className="text-sm font-black uppercase tracking-wider text-brand-950">Delete Message Submission?</h4>
              <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                Are you absolutely sure? This message will be permanently deleted from the administrative database logs.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded-lg text-[9.5px] font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              
              <button 
                onClick={() => handleDeleteMessage(deletingId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9.5px] font-black uppercase tracking-widest transition-all shadow-md shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
