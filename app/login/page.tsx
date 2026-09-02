import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-bg px-6">
      <div className="grid-backdrop absolute inset-0 opacity-40" aria-hidden />
      <div className="rise relative w-full max-w-sm">
        <div className="hairline bg-card p-8 shadow-lift">
          <div className="mb-8">
            <p className="eyebrow mb-3">ESTINAD · Internal</p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Control</h1>
            <p className="mt-2 text-sm text-muted">
              Commercial &amp; licensing operations console.
            </p>
          </div>
          <LoginForm oauthError={error} />
        </div>
        <p className="mt-4 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-faint">
          control.estinad.com
        </p>
      </div>
    </main>
  );
}
