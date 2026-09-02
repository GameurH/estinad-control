"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteOperatorAction, removeOperatorAction } from "./actions";
import { ActionDialog } from "@/components/action-dialog";
import { Mono, TableWrap, Td, Th, Tr, Tag } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { PlatformAdminRole } from "@/types/database";

interface OperatorRow {
  id: string;
  email: string;
  name: string | null;
  role: PlatformAdminRole;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLES: { value: PlatformAdminRole; label: string; hint: string }[] = [
  { value: "admin", label: "Admin", hint: "Commercial ops, no operator management" },
  { value: "support", label: "Support", hint: "Read-only across the console" },
  { value: "super_admin", label: "Super admin", hint: "Everything incl. this page" },
];

const inputCls =
  "hairline h-9 w-full bg-surface px-3 text-sm text-ink placeholder:text-faint focus:outline-none";
const labelCls = "eyebrow mb-1.5 block";

export function OperatorsClient({
  operators,
  myEmail,
}: {
  operators: OperatorRow[];
  myEmail: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<PlatformAdminRole>("support");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const r = await inviteOperatorAction({ email, name, role });
      setMessage({ ok: r.ok, text: r.ok ? r.message! : r.error! });
      if (r.ok) {
        setEmail("");
        setName("");
        setRole("support");
        router.refresh();
      }
    });
  };

  const superCount = operators.filter((o) => o.role === "super_admin").length;

  return (
    <div>
      <form onSubmit={invite} className="grid gap-4 px-4 py-4 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <label htmlFor="op-email" className={labelCls}>Email *</label>
          <input
            id="op-email"
            type="email"
            required
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@estinad.com"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="op-name" className={labelCls}>Name</label>
          <input
            id="op-name"
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional display name"
          />
        </div>
        <div>
          <label htmlFor="op-role" className={labelCls}>Role</label>
          <select
            id="op-role"
            className={inputCls}
            value={role}
            onChange={(e) => setRole(e.target.value as PlatformAdminRole)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} — {r.hint}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="h-9 w-full bg-ink px-4 text-xs font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "Inviting…" : "Send invite"}
          </button>
        </div>
      </form>

      {message ? (
        <div className="hairline-t px-4 py-3">
          <p
            role="status"
            className="text-sm"
            style={{ color: message.ok ? "var(--status-ok-fg)" : "var(--status-danger-fg)" }}
          >
            {message.text}
          </p>
        </div>
      ) : null}

      <div className="hairline-t">
        <TableWrap>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>Operator</Th>
                <Th>Role</Th>
                <Th>Last login</Th>
                <Th>Added</Th>
                <Th className="text-right">Access</Th>
              </tr>
            </thead>
            <tbody>
              {operators.map((o) => {
                const isSelf = o.email.toLowerCase() === myEmail.toLowerCase();
                const isLastSuper = o.role === "super_admin" && superCount === 1;
                return (
                  <Tr key={o.id}>
                    <Td>
                      <span className="font-medium text-ink">{o.name ?? o.email}</span>
                      {o.name ? <Mono className="block text-[0.65rem] text-faint">{o.email}</Mono> : null}
                      {isSelf ? <Tag>you</Tag> : null}
                    </Td>
                    <Td>
                      <Tag>{o.role.replaceAll("_", " ")}</Tag>
                    </Td>
                    <Td>
                      <Mono>{o.lastLoginAt ? formatRelative(o.lastLoginAt) : "never"}</Mono>
                    </Td>
                    <Td>
                      <Mono>{formatRelative(o.createdAt)}</Mono>
                    </Td>
                    <Td>
                      <div className="flex justify-end">
                        {isSelf ? (
                          <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">
                            self
                          </span>
                        ) : isLastSuper ? (
                          <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">
                            last super admin
                          </span>
                        ) : (
                          <ActionDialog
                            label="Remove"
                            title={`Remove ${o.email}?`}
                            description="Deletes the operator record. Their access ends immediately (any live session is rejected on the next request). The auth user and audit history are kept."
                            confirmLabel="Remove access"
                            danger
                            requireText="REMOVE"
                            action={removeOperatorAction.bind(null, {
                              adminRowId: o.id,
                              email: o.email,
                            })}
                          />
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </div>
    </div>
  );
}
