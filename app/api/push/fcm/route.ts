import { getCurrentUser } from "@/lib/auth";
import { saveDeviceToken, removeDeviceToken } from "@/lib/domain";
import { z } from "zod";

// FCM tokens are typically ~152 chars; cap at 1024 to defend against
// authenticated abuse (the (user_id, token) UNIQUE constraint already
// prevents duplicates).
const registerSchema = z.object({
  token: z.string().min(1).max(1024),
  platform: z.enum(["android", "ios"]).default("android"),
});

/** POST /api/push/fcm — register a device token */
export async function POST(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  saveDeviceToken(user.id, parsed.data.token, parsed.data.platform);
  return Response.json({ ok: true });
}

/** DELETE /api/push/fcm — unregister a device token */
export async function DELETE(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z.object({ token: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  removeDeviceToken(user.id, parsed.data.token);
  return Response.json({ ok: true });
}
