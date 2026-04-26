import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyEmailToken } from "@/lib/domain";

export default async function VerifyTokenPage(
  props: { params: Promise<{ token: string }> }
) {
  const { token } = await props.params;
  const userId = verifyEmailToken(token);

  if (userId) {
    // Success — send them straight into the app
    redirect("/app/feed?verified=1");
  }

  // Expired or invalid token
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-sm w-full text-center space-y-4 shadow-sm">
        <div className="text-5xl">⏰</div>
        <h1 className="text-xl font-bold text-slate-900">הקישור פג תוקף</h1>
        <p className="text-slate-600 text-sm">
          הקישור לאימות לא תקין או שפג תוקפו (24 שעות).
          <br />
          אפשר לשלוח קישור חדש מהאפליקציה.
        </p>
        <Link
          href="/verify-email"
          className="block w-full py-2 px-4 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition text-center"
        >
          שלח קישור חדש
        </Link>
        <Link href="/app/feed" className="block text-sm text-slate-400 hover:text-slate-600">
          חזרה לאפליקציה →
        </Link>
      </div>
    </div>
  );
}
