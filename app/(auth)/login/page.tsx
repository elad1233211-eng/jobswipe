import Link from "next/link";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;
  const reset = params?.reset === "1";

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-2">ברוך שובך</h1>
      <p className="text-center text-slate-500 mb-6">
        התחבר כדי להמשיך ב-JobSwipe
      </p>
      {reset && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center">
          ✅ הסיסמה אופסה בהצלחה — אפשר להתחבר עכשיו
        </div>
      )}
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
