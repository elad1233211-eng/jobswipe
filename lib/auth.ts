import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { getDb, type Role, type UserRow } from "./db";
import { hashPassword, verifyPassword } from "./password";

export { hashPassword, verifyPassword };

const COOKIE_NAME = "jobswipe_session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me-12345678"
);
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  sub: string;
  role: Role;
  email: string;
};

async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(SECRET);
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      sub: payload.sub as string,
      role: payload.role as Role,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function createSession(user: UserRow): Promise<void> {
  const token = await signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const session = await getSession();
  if (!session) return null;
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(session.sub) as UserRow | undefined;
  return row ?? null;
}

export async function requireUser(): Promise<UserRow> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}

export async function registerUser(
  email: string,
  password: string,
  role: Role
): Promise<UserRow> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalized);
  if (existing) throw new Error("EMAIL_TAKEN");

  const id = randomUUID();
  const hash = await hashPassword(password);
  const now = Date.now();
  db.prepare(
    "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, normalized, hash, role, now);

  return {
    id,
    email: normalized,
    password_hash: hash,
    role,
    created_at: now,
    email_verified_at: null,
    is_disabled: 0,
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<UserRow> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(normalized) as UserRow | undefined;
  if (!row) throw new Error("INVALID_CREDENTIALS");
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) throw new Error("INVALID_CREDENTIALS");
  if (row.is_disabled) throw new Error("ACCOUNT_DISABLED");
  return row;
}
