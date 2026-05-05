import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "איפוס סיסמה | JobSwipe",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <>
      <div className="text-center mb-6">
        <Link href="/" className="text-3xl font-black text-pink-500">
          💼❤️ JobSwipe
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">בחר סיסמה חדשה</h1>
        <p className="text-slate-500 text-sm mt-1">הכנס סיסמה חדשה לחשבון שלך</p>
      </div>
      <ResetPasswordForm token={token} />
    </>
  );
}
