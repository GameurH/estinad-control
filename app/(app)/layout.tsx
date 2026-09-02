import { requireAdmin } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin().catch(() => redirect("/login"));

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={admin.email} name={admin.name} role={admin.role} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
