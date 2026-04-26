import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-3xl font-bold mb-2">הדף לא נמצא</h1>
      <p className="text-slate-600 mb-6">
        ייתכן שהקישור פג תוקף, או שהדף הוסר.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold"
      >
        חזרה לדף הבית
      </Link>
    </main>
  );
}
