"use client";

import { useActionState } from "react";
import { signInAction, type AuthState } from "./actions";

const initial: AuthState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initial);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="email" className="eyebrow">
          Operator email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="operator@estinad.com"
          className="h-11 bg-surface px-3 hairline text-sm text-ink placeholder:text-faint"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="password" className="eyebrow">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 bg-surface px-3 hairline text-sm text-ink"
        />
      </div>

      {state.error ? (
        <p role="alert" className="border px-3 py-2 text-sm" style={{ color: "var(--status-danger-fg)", borderColor: "var(--status-danger-fg)" }}>
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-11 bg-ink px-5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Authenticating…" : "Enter control"}
      </button>
    </form>
  );
}
