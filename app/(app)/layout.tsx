import { requireAdmin } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch {
    // Authenticated (e.g. Google) but not a platform admin: break the
    // login↔dashboard loop by signing out with a clear error.
    const auth = await createClient();
    await auth.auth.signOut();
    redirect("/login?error=access_denied");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar showOperators={admin.role === "super_admin"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={admin.email} name={admin.name} role={admin.role} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
