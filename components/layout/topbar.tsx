import { signOutAction } from "@/app/login/actions";
import { Button } from "@/components/ui";
import { SearchTrigger } from "./search-trigger";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export function Topbar({
  email, name, role, showOperators,
}: {
  email: string; name: string | null; role: string; showOperators?: boolean;
}) {
  return (
    <header className="hairline-b sticky top-0 z-40 bg-bg/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav showOperators={showOperators} />
          <SearchTrigger />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="min-w-0 text-right">
            <p className="truncate text-xs font-medium leading-4 text-ink">{name ?? email}</p>
            <p className="truncate font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted">
              {role.replaceAll("_", " ")}
            </p>
          </div>
          <ThemeToggle />
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
