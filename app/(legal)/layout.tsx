import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 max-w-3xl mx-auto">
          <span className="text-2xl">💼❤️</span>
          <span className="font-bold">JobSwipe</span>
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <article className="prose-rtl bg-white rounded-2xl border border-slate-200 p-6 md:p-10 leading-relaxed text-slate-800">
          {children}
        </article>
        <nav className="mt-6 flex flex-wrap gap-3 justify-center text-sm text-slate-500">
          <Link href="/legal/privacy" className="hover:text-pink-600">
            פרטיות
          </Link>
          <span>·</span>
          <Link href="/legal/terms" className="hover:text-pink-600">
            תנאי שימוש
          </Link>
          <span>·</span>
          <Link href="/legal/accessibility" className="hover:text-pink-600">
            נגישות
          </Link>
          <span>·</span>
          <Link href="/" className="hover:text-pink-600">
            ← חזרה לדף הבית
          </Link>
        </nav>
      </main>
    </div>
  );
}
