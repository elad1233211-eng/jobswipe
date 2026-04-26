import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { countUnseenMatches } from "@/lib/domain";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ unseen: 0 });
  return NextResponse.json({ unseen: countUnseenMatches(user.id) });
}
