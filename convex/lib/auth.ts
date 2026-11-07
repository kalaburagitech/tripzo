import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

export const USER_SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

type AnyCtx = QueryCtx | MutationCtx;

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)));
}

const HASH_ROUNDS = 2000;

/** Salted, iterated SHA-256. Stored as `sha256$<rounds>$<salt>$<hex>`. */
export async function hashPassword(password: string, salt = randomToken(16)): Promise<string> {
  let h = await sha256(`${salt}:${password}`);
  for (let i = 1; i < HASH_ROUNDS; i++) h = await sha256(`${salt}:${h}`);
  return `sha256$${HASH_ROUNDS}$${salt}$${h}`;
}

/**
 * Verifies a password. Accounts created before hashing was introduced stored
 * plaintext; those still verify and `needsUpgrade` tells the caller to re-hash.
 */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  if (!stored.startsWith("sha256$")) {
    return { ok: stored === password, needsUpgrade: true };
  }
  const [, roundsStr, salt, expected] = stored.split("$");
  let h = await sha256(`${salt}:${password}`);
  for (let i = 1; i < Number(roundsStr); i++) h = await sha256(`${salt}:${h}`);
  return { ok: h === expected, needsUpgrade: false };
}

async function findSession(ctx: AnyCtx, token: string | undefined | null) {
  if (!token) return null;
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return session;
}

export async function getUser(ctx: AnyCtx, token: string | undefined | null): Promise<Doc<"users"> | null> {
  const session = await findSession(ctx, token);
  if (!session || session.kind !== "USER" || !session.userId) return null;
  return await ctx.db.get(session.userId);
}

export async function requireUser(ctx: AnyCtx, token: string): Promise<Doc<"users">> {
  const user = await getUser(ctx, token);
  if (!user) throw new Error("Your session has expired. Please log in again.");
  return user;
}

export type AdminRole = Doc<"adminUsers">["role"];

export async function getAdmin(ctx: AnyCtx, token: string | undefined | null): Promise<Doc<"adminUsers"> | null> {
  const session = await findSession(ctx, token);
  if (!session || session.kind !== "ADMIN" || !session.adminId) return null;
  const admin = await ctx.db.get(session.adminId);
  if (!admin || !admin.isActive) return null;
  return admin;
}

export async function requireAdmin(
  ctx: AnyCtx,
  token: string,
  roles: AdminRole[] = ["SUPER_ADMIN"]
): Promise<Doc<"adminUsers">> {
  const admin = await getAdmin(ctx, token);
  if (!admin) throw new Error("Your portal session has expired. Please sign in again.");
  if (!roles.includes(admin.role)) throw new Error("You do not have permission to perform this action.");
  return admin;
}

/**
 * Resolves the operator a portal user may act on. Operator admins are pinned to
 * their own company; super admins may act on any operator they name.
 */
export async function requireOperatorAccess(
  ctx: AnyCtx,
  token: string,
  operatorId?: Id<"operators">
): Promise<{ admin: Doc<"adminUsers">; operator: Doc<"operators"> }> {
  const admin = await requireAdmin(ctx, token, ["SUPER_ADMIN", "OPERATOR_ADMIN"]);
  let targetId: Id<"operators"> | undefined;
  if (admin.role === "OPERATOR_ADMIN") {
    if (!admin.operatorId) throw new Error("This login is not linked to a bus operator.");
    if (operatorId && operatorId !== admin.operatorId) {
      throw new Error("You can only manage your own operator account.");
    }
    targetId = admin.operatorId;
  } else {
    targetId = operatorId;
  }
  if (!targetId) throw new Error("Operator not specified.");
  const operator = await ctx.db.get(targetId);
  if (!operator) throw new Error("Operator not found");
  return { admin, operator };
}

export function isOperatorLive(op: Doc<"operators">): boolean {
  return op.status === "APPROVED" || op.status === "ACTIVE";
}

export function requireLiveOperator(op: Doc<"operators">) {
  if (!isOperatorLive(op)) {
    throw new Error(
      `Your operator account is ${op.status.toLowerCase().replace("_", " ")}. It must be approved by Tripzo before you can publish buses and trips.`
    );
  }
}

export async function createSession(
  ctx: MutationCtx,
  kind: "USER" | "ADMIN",
  id: Id<"users"> | Id<"adminUsers">
): Promise<string> {
  const token = randomToken();
  const now = Date.now();
  await ctx.db.insert("sessions", {
    token,
    kind,
    userId: kind === "USER" ? (id as Id<"users">) : undefined,
    adminId: kind === "ADMIN" ? (id as Id<"adminUsers">) : undefined,
    expiresAt: now + (kind === "USER" ? USER_SESSION_TTL_MS : ADMIN_SESSION_TTL_MS),
    createdAt: now,
  });
  return token;
}

export async function deleteSession(ctx: MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
  if (session) await ctx.db.delete(session._id);
}
