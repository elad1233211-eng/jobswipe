import Link from "next/link";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-2">בואו נתחיל</h1>
      <p className="text-center text-slate-500 mb-6">
        יצירת חשבון חדש ב-JobSwipe
      </p>
      <SignupForm />
      <p className="text-center text-sm text-slate-500 mt-6">
        כבר יש לך חשבון?{" "}
        <Link href="/login" className="text-brand font-semibold">
          התחבר
        </Link>
      </p>
    </div>
  );
}
