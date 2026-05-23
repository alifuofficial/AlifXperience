"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Search, Menu, X, Zap, ChevronDown, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";

interface MenuItem {
  id: string;
  name: string;
  href: string;
  children?: MenuItem[];
}

interface SiteSettings {
  siteName: string;
  logoType: string;
  logotext: string;
  logoUrl: string;
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // Dynamic Navigation Menus with initial defaults
  const [menus, setMenus] = useState<MenuItem[]>([
    { id: "1", name: "Home", href: "/" },
    { id: "2", name: "AI & ML", href: "/category/ai" },
    { id: "3", name: "Hardware", href: "/category/hardware" },
    { id: "4", name: "Security", href: "/category/security" },
    { id: "5", name: "Space", href: "/category/space" },
    { id: "6", name: "Reviews", href: "/category/software" },
    { id: "7", name: "About Us", href: "/about" }
  ]);

  // Site settings for logo
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: "NEXUS",
    logoType: "text",
    logotext: "",
    logoUrl: "",
  });

  // Mobile navigation collapsible expansion state
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/menus?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setMenus(data);
        }
      })
      .catch((err) => console.error("Navbar menu load failure:", err));
  }, []);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) setSiteSettings(data);
      })
      .catch((err) => console.error("Navbar settings load failure:", err));
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsSearchOpen(false); setIsMobileMenuOpen(false); }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const toggleMobileSub = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setMobileExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-brand-100"
          : "bg-white border-b border-brand-100"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              {(siteSettings.logoType === "image" && siteSettings.logoUrl) ? (
                <div className="relative h-8 w-32">
                  <Image src={siteSettings.logoUrl} alt={siteSettings.siteName} fill className="object-contain object-left" priority sizes="128px" />
                </div>
              ) : (
                <>
                  <div className="w-7 h-7 bg-accent-600 rounded flex items-center justify-center shadow-sm shadow-accent-600/30">
                    <Zap className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                  <span className="text-sm font-black tracking-tight text-brand-900 uppercase">
                    {siteSettings.logotext || siteSettings.siteName}
                  </span>
                </>
              )}
            </Link>

            {/* Desktop Dynamic Hover Nav with Recursion */}
            <div className="hidden lg:flex items-center gap-6 h-full">
              {menus.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                return (
                  <div key={item.id} className="relative group h-full flex items-center">
                    <Link
                      href={item.href}
                      className="text-[11px] font-bold uppercase tracking-widest text-brand-500 hover:text-accent-600 transition-colors flex items-center gap-1.5 py-4 cursor-pointer"
                    >
                      <span>{item.name}</span>
                      {hasChildren && <ChevronDown className="w-3 h-3 text-brand-400 group-hover:text-accent-600 transition-transform duration-200" />}
                    </Link>

                    {/* Level 1 Sub-menu Dropdown */}
                    {hasChildren && (
                      <div className="absolute top-full left-0 mt-0 pt-1 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                        <div className="bg-white border border-brand-100 rounded-xl shadow-xl py-2 min-w-[210px] backdrop-blur-md">
                          {item.children?.map((sub) => {
                            const hasSubChildren = sub.children && sub.children.length > 0;
                            return (
                              <div key={sub.id} className="relative group/sub flex items-center px-1">
                                <Link
                                  href={sub.href}
                                  className="w-full text-[10px] font-bold uppercase tracking-wider text-brand-500 hover:text-accent-600 hover:bg-brand-50 px-3 py-2.5 rounded-lg transition-all flex items-center justify-between"
                                >
                                  <span>{sub.name}</span>
                                  {hasSubChildren && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
                                </Link>

                                {/* Level 2 Sub-sub-menu Dropdown */}
                                {hasSubChildren && (
                                  <div className="absolute top-0 left-full ml-0 pl-1 opacity-0 translate-x-2 pointer-events-none group-hover/sub:opacity-100 group-hover/sub:translate-x-0 group-hover/sub:pointer-events-auto transition-all duration-200 z-50">
                                    <div className="bg-white border border-brand-100 rounded-xl shadow-xl py-2 min-w-[210px]">
                                      {sub.children?.map((subSub) => (
                                        <div key={subSub.id} className="px-1">
                                          <Link
                                            href={subSub.href}
                                            className="block text-[10px] font-bold uppercase tracking-wider text-brand-500 hover:text-accent-600 hover:bg-brand-50 px-3 py-2.5 rounded-lg transition-all"
                                          >
                                            {subSub.name}
                                          </Link>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-brand-400 hover:text-brand-900 hover:bg-brand-100 rounded-lg transition-all"
              >
                {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>

              {isAuthenticated ? (
                <Link
                  href="/admin"
                  className="hidden sm:flex text-[9px] font-bold uppercase tracking-widest text-brand-500 hover:text-brand-900 border border-brand-200 px-3 py-1.5 rounded hover:bg-brand-50 transition-all"
                >
                  Dashboard
                </Link>
              ) : !isLoading ? (
                <Link
                  href="/auth/signin"
                  className="hidden sm:flex text-[9px] font-bold uppercase tracking-widest text-white bg-accent-600 hover:bg-brand-900 px-4 py-2 rounded transition-all"
                >
                  Subscribe
                </Link>
              ) : null}

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-brand-500 hover:text-brand-900 hover:bg-brand-100 rounded-lg transition-all"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="border-t border-brand-100 bg-white px-4 py-3">
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-300" />
              <input
                autoFocus
                type="text"
                placeholder="Search articles, topics, authors…"
                className="w-full pl-10 pr-4 py-2.5 bg-brand-50 border border-brand-200 rounded-lg text-sm text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-medium"
              />
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu with Collapsible Sub-menu Trees */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-5 border-b border-brand-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {(siteSettings.logoType === "image" && siteSettings.logoUrl) ? (
              <div className="relative h-6 w-24">
                <Image src={siteSettings.logoUrl} alt={siteSettings.siteName} fill className="object-contain object-left" sizes="96px" />
              </div>
            ) : (
              <>
                <div className="w-6 h-6 bg-accent-600 rounded flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white fill-white" />
                </div>
                <span className="text-xs font-black tracking-widest text-brand-900 uppercase">
                  {siteSettings.logotext || siteSettings.siteName}
                </span>
              </>
            )}
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-brand-400 hover:text-brand-900">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-160px)]">
          {menus.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = !!mobileExpanded[item.id];
            
            return (
              <div key={item.id} className="space-y-1">
                {hasChildren ? (
                  <div>
                    <button
                      onClick={(e) => toggleMobileSub(item.id, e)}
                      className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-brand-500 hover:text-accent-600 hover:bg-brand-50 px-3 py-2.5 rounded-lg transition-all text-left"
                    >
                      <span>{item.name}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-brand-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    
                    {/* Mobile Level 1 Sub-menu expansion */}
                    {isExpanded && (
                      <div className="pl-4 border-l border-brand-100 ml-3 space-y-1.5 mt-1 pb-1">
                        {item.children?.map((sub) => {
                          const hasSubChildren = sub.children && sub.children.length > 0;
                          const isSubExpanded = !!mobileExpanded[sub.id];
                          
                          return (
                            <div key={sub.id} className="space-y-1">
                              {hasSubChildren ? (
                                <div>
                                  <button
                                    onClick={(e) => toggleMobileSub(sub.id, e)}
                                    className="w-full flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-brand-500 hover:text-accent-600 hover:bg-brand-50 px-3 py-2 rounded-lg transition-all text-left"
                                  >
                                    <span>{sub.name}</span>
                                    <ChevronDown className={`w-3 h-3 text-brand-400 transition-transform ${isSubExpanded ? "rotate-180" : ""}`} />
                                  </button>
                                  
                                  {/* Mobile Level 2 Sub-sub-menu expansion */}
                                  {isSubExpanded && (
                                    <div className="pl-4 border-l border-slate-100 ml-3 space-y-1 mt-1 pb-1">
                                      {sub.children?.map((subSub) => (
                                        <Link
                                          key={subSub.id}
                                          href={subSub.href}
                                          onClick={() => setIsMobileMenuOpen(false)}
                                          className="block text-[9px] font-bold uppercase tracking-wider text-brand-400 hover:text-accent-600 hover:bg-brand-50 px-3 py-2 rounded-lg transition-all"
                                        >
                                          {subSub.name}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Link
                                  href={sub.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="block text-[9px] font-bold uppercase tracking-widest text-brand-500 hover:text-accent-600 hover:bg-brand-50 px-3 py-2 rounded-lg transition-all"
                                >
                                  {sub.name}
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-[10px] font-bold uppercase tracking-widest text-brand-500 hover:text-accent-600 hover:bg-brand-50 px-3 py-2.5 rounded-lg transition-all"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-brand-100 bg-white">
          <Link href="/auth/signin" className="block w-full text-center text-[9px] font-bold uppercase tracking-widest text-white bg-accent-600 hover:bg-brand-900 px-4 py-3 rounded transition-all">
            Subscribe
          </Link>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-brand-900/20 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  );
}