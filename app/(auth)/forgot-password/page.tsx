import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "שכחתי סיסמה | JobSwipe",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="text-center mb-6">
        <Link href="/" className="text-3xl font-black text-pink-500">
          💼❤️ JobSwipe
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">שכחתי סיסמה</h1>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
