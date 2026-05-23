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
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}