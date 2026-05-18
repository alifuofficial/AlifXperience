"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Users,
  BarChart3,
  Settings,
  Home,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Mail,
  ImageIcon,
  Megaphone,
  Menu,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Posts", href: "/admin/posts", icon: FileText },
  { label: "Media", href: "/admin/media", icon: ImageIcon },
  { label: "Menus", href: "/admin/menus", icon: Menu },
  { label: "Ads", href: "/admin/ads", icon: Megaphone },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Tools", href: "/admin/tools", icon: Wrench },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "USER";
  const isAdmin = role === "ADMIN";

  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navItems.filter((item) => {
    if (isAdmin) return true;
    return ["Overview", "Posts", "Media", "Settings"].includes(item.label);
  });

  return (
    <aside
      className={`relative flex-shrink-0 bg-brand-900 flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-300 ease-in-out ${
        collapsed ? "w-[64px]" : "w-[220px]"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-50 w-6 h-6 bg-white border border-brand-100 rounded-full shadow-md flex items-center justify-center hover:bg-brand-50 transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-brand-600" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-brand-600" />
        )}
      </button>

      {/* Logo */}
      <div className={`border-b border-white/5 overflow-hidden transition-all duration-300 ${collapsed ? "px-3 py-6" : "px-6 py-6"}`}>
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-600/40 flex-shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="text-white text-sm font-bold tracking-tight leading-none">AlifX</p>
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5">Admin Panel</p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-0.5 overflow-y-auto transition-all duration-300 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest px-3 mb-3">Main Menu</p>
        )}
        {filteredNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg transition-all duration-200 group relative ${
                collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              } ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  active ? "text-accent-400" : "group-hover:text-white/70"
                }`}
              />
              {!collapsed && (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                  {active && <span className="ml-auto w-1 h-1 rounded-full bg-accent-400" />}
                </>
              )}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2 py-1 bg-brand-800 text-white text-[10px] font-bold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-150 z-50 shadow-xl">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`border-t border-white/5 py-4 space-y-0.5 transition-all duration-300 ${collapsed ? "px-2" : "px-3"}`}>
        <Link
          href="/"
          title={collapsed ? "View Site" : undefined}
          className={`flex items-center gap-3 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all group relative ${
            collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
          }`}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-[11px] font-bold uppercase tracking-wider">View Site</span>}
          {collapsed && (
            <span className="absolute left-full ml-3 px-2 py-1 bg-brand-800 text-white text-[10px] font-bold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl">
              View Site
            </span>
          )}
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title={collapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center gap-3 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all group relative ${
            collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-[11px] font-bold uppercase tracking-wider">Sign Out</span>}
          {collapsed && (
            <span className="absolute left-full ml-3 px-2 py-1 bg-brand-800 text-white text-[10px] font-bold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
