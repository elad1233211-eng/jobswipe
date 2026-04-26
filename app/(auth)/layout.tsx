import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-gradient">
      <div className="w-full max-w-md bg-white rounded-3xl card-shadow p-8">
        {children}
      </div>
      <nav className="mt-4 flex flex-wrap gap-x-3 gap-y-1 justify-center text-xs text-white/90">
        <Link href="/legal/privacy" className="hover:underline">
          פרטיות
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/legal/terms" className="hover:underline">
          תנאי שימוש
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/legal/accessibility" className="hover:underline">
          נגישות
        </Link>
      </nav>
    </div>
  );
}
