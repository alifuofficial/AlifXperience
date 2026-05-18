import Navbar from "@/components/Navbar";
import { User, Bookmark, MessageSquare, Settings, Bell } from "lucide-react";

export default function UserDashboard() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-brand-50/50 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-surface p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-inner">
                  <User className="w-12 h-12 text-brand-600" />
                </div>
                <h2 className="text-xl font-bold font-serif">Alex Johnson</h2>
                <p className="text-sm text-muted mb-4">Member since May 2026</p>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase rounded-md border border-brand-100">
                    Premium
                  </span>
                </div>
              </div>

              <nav className="bg-surface rounded-2xl border shadow-sm overflow-hidden">
                <button className="w-full flex items-center space-x-3 px-6 py-4 text-sm font-medium bg-brand-50 text-brand-600 border-l-4 border-brand-600">
                  <Bookmark className="w-4 h-4" />
                  <span>Saved Articles</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-6 py-4 text-sm font-medium text-muted hover:bg-slate-50 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span>Your Comments</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-6 py-4 text-sm font-medium text-muted hover:bg-slate-50 transition-colors">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-6 py-4 text-sm font-medium text-muted hover:bg-slate-50 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-surface p-8 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-2xl font-bold font-serif">Saved Articles</h1>
                  <span className="text-sm text-muted">4 articles saved</span>
                </div>

                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col md:flex-row gap-6 p-4 rounded-xl hover:bg-brand-50/30 transition-colors border border-transparent hover:border-brand-100 group">
                      <div className="w-full md:w-48 aspect-video bg-slate-200 rounded-lg overflow-hidden shrink-0" />
                      <div className="flex-1 space-y-2">
                         <div className="text-[10px] font-bold uppercase text-brand-600">Hardware</div>
                         <h3 className="text-xl font-bold group-hover:text-brand-600 transition-colors">The New Architecture of M5 Pro Chips</h3>
                         <p className="text-sm text-muted line-clamp-2">How Apple's latest chipsets are redefining the boundaries of power efficiency and AI performance.</p>
                         <div className="pt-2 flex items-center justify-between">
                            <span className="text-xs text-muted/60">Saved on May 16, 2026</span>
                            <button className="text-xs font-bold text-red-600 hover:underline">Remove</button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-brand-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
                 <div className="relative z-10 max-w-lg space-y-4">
                    <h2 className="text-2xl font-bold font-serif">Upgrade to AlifX Pro</h2>
                    <p className="text-brand-100">Get unlimited access to exclusive long-form investigative reports and ad-free browsing experience.</p>
                    <button className="bg-white text-brand-600 px-6 py-3 rounded-full font-bold text-sm hover:bg-brand-50 transition-all shadow-lg">
                       Explore Plans
                    </button>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
