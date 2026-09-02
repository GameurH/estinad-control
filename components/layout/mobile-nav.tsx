"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Monogram } from "@/components/monogram";
import { getNav } from "./nav-items";

/**
 * Mobile navigation: a trigger button (fixed in the topbar area) plus a
 * slide-over panel mirroring the desktop sidebar. Rendered below md only.
 *
 * The open panel is portaled to document.body: the topbar carries a
 * backdrop-blur, which makes it the containing block for fixed-position
 * descendants and would confine the panel to the topbar's box.
 */
export function MobileNav({ showOperators = false }: { showOperators?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const nav = getNav(showOperators);
  const close = () => setOpen(false);

  // Scroll lock + Escape while the panel is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="hairline -m-1 inline-flex h-10 w-10 items-center justify-center p-2 text-muted transition-colors hover:text-ink md:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M1 3.5h14M1 8h14M1 12.5h14" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-50 md:hidden" role="presentation">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={close}
                aria-hidden
              />
              <div
                className="hairline-e absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-bg shadow-lift slide-in"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
              >
                <div className="hairline-b flex h-14 shrink-0 items-center justify-between px-5">
                  <Link href="/dashboard" onClick={close} className="flex items-center gap-3" aria-label="ESTINAD Control home">
                    <Monogram className="h-6 w-6" />
                    <span className="block">
                      <span className="block font-mono text-xs font-semibold tracking-[0.3em] text-ink">ESTINAD</span>
                      <span className="eyebrow mt-0.5 block">Control · Ops</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close navigation"
                    className="-m-1 p-1 text-faint transition-colors hover:text-ink"
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-3" aria-label="Primary mobile">
                  <ul>
                    {nav.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href || pathname.startsWith(`${href}/`);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            onClick={close}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex min-h-11 items-center gap-3 px-5 text-sm transition-colors",
                              active
                                ? "border-l-2 border-accent bg-surface pl-[18px] font-medium text-ink"
                                : "border-l-2 border-transparent pl-[18px] text-muted hover:text-ink",
                            )}
                          >
                            <Icon size={15} strokeWidth={1.75} aria-hidden />
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="hairline-t px-5 py-4">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-faint">
                    control.estinad.com
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
