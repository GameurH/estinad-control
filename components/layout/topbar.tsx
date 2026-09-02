import { signOutAction } from "@/app/login/actions";
import { SearchTrigger } from "./search-trigger";

export function Topbar({
  email,
  name,
  role,
}: {
  email: string;
  name: string | null;
  role: string;
}) {
  return (
    <header className="hairline-b sticky top-0 z-40 bg-bg/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-4 px-6 lg:px-8">
        <SearchTrigger />

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium leading-4 text-ink">{name ?? email}</p>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted">
              {role.replaceAll("_", " ")}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="hairline h-8 bg-bg px-3 text-xs text-muted transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
