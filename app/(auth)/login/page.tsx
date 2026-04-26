import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-2">ברוך שובך</h1>
      <p className="text-center text-slate-500 mb-6">
        התחבר כדי להמשיך ב-JobSwipe
      </p>
      <LoginForm />
      <p className="text-center text-sm text-slate-500 mt-6">
        אין לך חשבון?{" "}
        <Link href="/signup" className="text-brand font-semibold">
          הירשם
        </Link>
      </p>
    </div>
  );
}
