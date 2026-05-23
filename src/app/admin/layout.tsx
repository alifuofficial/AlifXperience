import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-brand-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
