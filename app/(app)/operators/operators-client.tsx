"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteOperatorAction, removeOperatorAction } from "./actions";
import { ActionDialog } from "@/components/action-dialog";
import {
  Button,
  CardList,
  CardRow,
  Field,
  Input,
  Mono,
  Select,
  TableWrap,
  Tag,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { cn, formatRelative } from "@/lib/utils";
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

  /** Self / last-super guards render as mono eyebrows; otherwise the remove dialog. */
  const accessControl = (o: OperatorRow, isSelf: boolean, isLastSuper: boolean) => {
    if (isSelf) {
      return (
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">
          self
        </span>
      );
    }
    if (isLastSuper) {
      return (
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">
          last super admin
        </span>
      );
    }
    return (
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
    );
  };

  return (
    <div>
      <form onSubmit={invite} className="grid gap-4 px-4 py-4 sm:grid-cols-4">
        <Field label="Email *" htmlFor="op-email">
          <Input
            id="op-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@estinad.com"
            autoComplete="off"
          />
        </Field>
        <Field label="Name" htmlFor="op-name">
          <Input
            id="op-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional display name"
          />
        </Field>
        <Field label="Role" htmlFor="op-role">
          <Select
            id="op-role"
            className="w-full sm:w-full"
            value={role}
            onChange={(e) => setRole(e.target.value as PlatformAdminRole)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} — {r.hint}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? "Inviting…" : "Send invite"}
          </Button>
        </div>
      </form>

      {message ? (
        <div className="hairline-t px-4 py-3">
          <p role="status" className={cn("text-sm", message.ok ? "text-ok" : "text-danger")}>
            {message.text}
          </p>
        </div>
      ) : null}

      <div className="hairline-t">
        {/* Desktop roster */}
        <div className="hidden md:block">
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
                          {accessControl(o, isSelf, isLastSuper)}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </div>

        {/* Mobile roster */}
        <CardList>
          {operators.map((o) => {
            const isSelf = o.email.toLowerCase() === myEmail.toLowerCase();
            const isLastSuper = o.role === "super_admin" && superCount === 1;
            return (
              <CardRow key={o.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{o.name ?? o.email}</p>
                    {o.name ? (
                      <Mono className="mt-0.5 block text-[0.65rem] text-faint">{o.email}</Mono>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Tag>{o.role.replaceAll("_", " ")}</Tag>
                      {isSelf ? <Tag>you</Tag> : null}
                    </div>
                    <Mono className="mt-2 block text-[0.65rem] text-faint">
                      last login {o.lastLoginAt ? formatRelative(o.lastLoginAt) : "never"} · added{" "}
                      {formatRelative(o.createdAt)}
                    </Mono>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <div className="flex justify-end">
                      {accessControl(o, isSelf, isLastSuper)}
                    </div>
                  </div>
                </div>
              </CardRow>
            );
          })}
        </CardList>
      </div>
    </div>
  );
}
