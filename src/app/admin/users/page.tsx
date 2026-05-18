"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users, Plus, Pencil, Trash2, Shield, ShieldOff,
  Loader2, X, Check, Eye, EyeOff, UserCircle, FileText, MessageSquare,
} from "lucide-react";

type Role = "ADMIN" | "USER" | "AUTHOR";
interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  _count: { posts: number; comments: number };
}

function RoleBadge({ role }: { role: Role }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-600/10 text-accent-700 text-[9px] font-bold uppercase tracking-wider">
        <Shield className="w-2.5 h-2.5" /> Admin
      </span>
    );
  }
  if (role === "AUTHOR") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/10 text-indigo-700 text-[9px] font-bold uppercase tracking-wider">
        <Pencil className="w-2.5 h-2.5" /> Author
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-100 text-brand-500 text-[9px] font-bold uppercase tracking-wider">
      <UserCircle className="w-2.5 h-2.5" /> User
    </span>
  );
}

function Avatar({ name, email }: { name: string | null; email: string }) {
  const initials = (name ?? email).slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-[10px] font-bold">{initials}</span>
    </div>
  );
}

// ─── Modal: Add / Edit User ────────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }: {
  user?: User;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "USER");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    setSaving(true); setErr("");
    try {
      const payload: any = { name, email, role };
      if (password) payload.password = password;
      await onSave(payload);
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-brand-900 uppercase tracking-wider">
            {user ? "Edit User" : "Add New User"}
          </h2>
          <button onClick={onClose} className="p-1.5 text-brand-300 hover:text-brand-900 hover:bg-brand-100 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-brand-400 block mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Full name (optional)"
              className="w-full text-xs font-medium text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-brand-400 block mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full text-xs font-medium text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-brand-400 block mb-1">
              {user ? "New Password (leave blank to keep)" : "Password *"}
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs font-medium text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-600 transition-colors"
              >
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-brand-400 block mb-2">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(["USER", "AUTHOR", "ADMIN"] as Role[]).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                    role === r
                      ? "bg-brand-900 text-white border-brand-900"
                      : "bg-brand-50 text-brand-500 border-brand-200 hover:border-brand-400"
                  }`}
                >
                  {r === "ADMIN" ? (
                    <Shield className="w-3 h-3" />
                  ) : r === "AUTHOR" ? (
                    <Pencil className="w-3 h-3" />
                  ) : (
                    <UserCircle className="w-3 h-3" />
                  )}
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {err && <p className="text-[9px] font-bold text-red-500">{err}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-500 border border-brand-200 rounded-lg hover:bg-brand-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !email.trim() || (!user && !password.trim())}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-brand-900 hover:bg-accent-600 text-white rounded-lg transition-all disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {user ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (role === "ADMIN") {
      fetchUsers();
    }
  }, [role]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      setUsers(await res.json());
    } catch { }
    finally { setLoading(false); }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-600" />
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

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed");
    setUsers((prev) => [json, ...prev]);
  };

  const handleUpdate = async (data: any) => {
    const user = modal as User;
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed");
    setUsers((prev) => prev.map((u) => u.id === user.id ? json : u));
  };

  const toggleRole = async (user: User) => {
    setTogglingId(user.id);
    const newRole: Role = user.role === "USER" ? "AUTHOR" : user.role === "AUTHOR" ? "ADMIN" : "USER";
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (e: any) { alert(e.message); }
    finally { setTogglingId(null); }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete "${user.name ?? user.email}"? This cannot be undone.`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e: any) { alert(e.message); }
    finally { setDeletingId(null); }
  };

  const currentUserId = (session?.user as any)?.id;
  const admins = users.filter((u) => u.role === "ADMIN").length;
  const totalPosts = users.reduce((s, u) => s + u._count.posts, 0);

  return (
    <>
      {modal && (
        <UserModal
          user={modal === "create" ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={modal === "create" ? handleCreate : handleUpdate}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-0.5">Management</p>
            <h1 className="text-2xl font-bold text-brand-900 tracking-tight">Users</h1>
          </div>
          <button
            onClick={() => setModal("create")}
            className="flex items-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Users", value: users.length, icon: Users },
            { label: "Admins", value: admins, icon: Shield },
            { label: "Total Posts", value: totalPosts, icon: FileText },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-brand-100/60 p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-accent-600/5 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-4 h-4 text-accent-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-brand-900 leading-none">{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-brand-100/60 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-100/60">
                <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-brand-400">User</th>
                <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-brand-400">Role</th>
                <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-widest text-brand-400">Posts</th>
                <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-widest text-brand-400">Comments</th>
                <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-brand-400">Joined</th>
                <th className="px-5 py-3 text-right text-[9px] font-bold uppercase tracking-widest text-brand-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="w-5 h-5 text-brand-300 animate-spin mx-auto" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Users className="w-8 h-8 text-brand-200 mx-auto mb-2" />
                  <p className="text-xs text-brand-300 font-medium">No users found</p>
                </td></tr>
              ) : users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr key={user.id} className="hover:bg-brand-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} email={user.email} />
                        <div>
                          <p className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                            {user.name ?? "—"}
                            {isSelf && <span className="text-[8px] font-bold text-accent-600 bg-accent-600/10 px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>}
                          </p>
                          <p className="text-[10px] text-brand-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-500">
                        <FileText className="w-3 h-3" />{user._count.posts}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-500">
                        <MessageSquare className="w-3 h-3" />{user._count.comments}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                        {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Toggle role */}
                        <button
                          onClick={() => toggleRole(user)}
                          disabled={togglingId === user.id || isSelf}
                          title={user.role === "ADMIN" ? "Revoke admin" : "Make admin"}
                          className="p-1.5 text-brand-300 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-all disabled:opacity-30"
                        >
                          {togglingId === user.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : user.role === "ADMIN"
                              ? <ShieldOff className="w-3.5 h-3.5" />
                              : <Shield className="w-3.5 h-3.5" />
                          }
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => setModal(user)}
                          title="Edit user"
                          className="p-1.5 text-brand-300 hover:text-brand-900 hover:bg-brand-100 rounded-lg transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={deletingId === user.id || isSelf}
                          title="Delete user"
                          className="p-1.5 text-brand-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
                        >
                          {deletingId === user.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
