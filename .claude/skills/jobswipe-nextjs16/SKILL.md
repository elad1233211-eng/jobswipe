---
name: jobswipe-nextjs16
description: Load this skill before touching any Next.js file in JobSwipe — pages, layouts, server actions, route handlers, error boundaries, or next.config.ts. Next.js 16 has breaking changes from training-data versions; this skill lists the specific patterns this codebase uses so you don't reintroduce deprecated APIs. Triggers include edits to app/**/*.tsx, next.config.ts, server actions, route handlers, or any error/loading file.
---

# Next.js 16 patterns used in JobSwipe

**Always** consult `node_modules/next/dist/docs/` for the authoritative spec (AGENTS.md enforces this). This skill only lists the patterns this repo has already settled on.

## Async APIs are truly async

`cookies()`, `headers()`, `params`, `searchParams` all return Promises.

```tsx
// page.tsx
export default async function Page(props: PageProps<"/app/employer/jobs/[id]">) {
  const { id } = await props.params;
  // ...
}

// Server Action using headers
const h = await (await import("next/headers")).headers();
```

The `PageProps<"/route">` generic is globally typed — use it instead of hand-writing the shape.

## Error boundaries use `unstable_retry`, not `reset`

```tsx
// app/error.tsx — mirror for any nested error.tsx
"use client";
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) { /* ... */ }
```

Same prop on `app/global-error.tsx`. `global-error.tsx` MUST render its own `<html>` and `<body>` because it replaces the root layout.

## Server Actions

- File-level `"use server"` at the top.
- For the `useActionState(action, initialState)` pattern, action signature is `(prevState, formData) => newState`.
- For actions that need extra args (e.g. `jobId`), bind from the client: `updateJobAction.bind(null, jobId)`. Server signature is `(jobId, prevState, formData)`.
- Return error/success as values. Don't throw — that triggers the error boundary instead of showing an inline message.
- After mutating, call `revalidatePath("/route")` from `next/cache` if the caller isn't redirected.

Examples already in the repo: `app/actions/{auth,profile,swipe,safety}.ts`.

## Route Handlers

- Files: `app/api/<segment>/route.ts`.
- Export named HTTP method: `export async function GET() { ... }`.
- Return `Response.json(body, { status, headers })`.
- Not cached by default. Use `export const dynamic = "force-static"` for GET if you want it cached.
- Example: `app/api/health/route.ts`.

## next.config.ts

Current contents (don't remove without discussion):

```ts
{
  serverExternalPackages: ["better-sqlite3"], // native module, never bundle
  output: "standalone",                        // Dockerfile depends on .next/standalone
  poweredByHeader: false,
  async headers() { /* CSP-lite security headers */ },
}
```

If adding `reactStrictMode` or similar, prefer putting it here rather than per-page.

## Forbidden / legacy patterns — do not reintroduce

- `pages/` directory — project is pure App Router.
- `getServerSideProps`, `getStaticProps` — use Server Components or `fetch` with options.
- `reset` prop on error boundaries — it's `unstable_retry` now.
- Synchronous `cookies()` / `headers()` — always await.
- `NextApiRequest`/`NextApiResponse` types — route handlers use Web `Request`/`Response`.
- Importing `better-sqlite3` from a Client Component or anything bundled for the browser — must live only under `lib/` and be consumed by Server-only code.

## When adding a new route

1. Decide: page, route handler, or server action?
2. Create file.
3. If it reads session: `const user = await getCurrentUser()` (or `requireUser()` to auto-401).
4. If it mutates: wrap in a server action; rate-limit if anonymous or hot-path.
5. Add to `app/app/layout.tsx` bottom nav only if it should be user-facing.
6. Run `npm run build` before claiming done.
