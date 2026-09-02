"use client";

import { useActionState, useState } from "react";
import { signInAction, type AuthState } from "./actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Button, Field, Input } from "@/components/ui";

const initial: AuthState = {};

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
      />
    </svg>
  );
}

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initial);
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const error =
    oauthError === "access_denied"
      ? "This account does not have console access."
      : oauthError === "oauth_failed"
        ? "Google sign-in failed. Try again or use email and password."
        : state.error || googleError;

  const signInWithGoogle = async () => {
    setGoogleError(null);
    setGooglePending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setGoogleError(
          "Google sign-in is not available yet (provider not configured). Use email and password.",
        );
        setGooglePending(false);
      }
      // On success the browser redirects to /auth/callback.
    } catch {
      setGoogleError("Google sign-in failed. Try again or use email and password.");
      setGooglePending(false);
    }
  };

  return (
    <div className="grid gap-5">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={signInWithGoogle}
        disabled={googlePending || pending}
        className="w-full"
      >
        <GoogleIcon />
        {googlePending ? "Redirecting to Google…" : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <span className="eyebrow">or email</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={formAction} className="grid gap-5">
        <Field label="Operator email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="operator@estinad.com"
            className="h-11"
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-11"
          />
        </Field>

        <Button type="submit" variant="primary" size="lg" disabled={pending || googlePending}>
          {pending ? "Authenticating…" : "Sign in"}
        </Button>
      </form>

      {error ? (
        <p
          role="alert"
          className="border border-danger bg-danger-bg px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
