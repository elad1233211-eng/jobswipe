import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) redirect("/");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-48 shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <span className="text-pink-400 font-bold text-lg">💼 Admin</span>
          <p className="text-xs text-slate-400 mt-1 truncate">{user.email}</p>
        </div>
        <nav className="flex flex-col p-2 gap-1 flex-1">
          <NavItem href="/admin" label="📊 סטטיסטיקות" />
          <NavItem href="/admin/reports" label="🚨 דוחות" />
          <NavItem href="/admin/users" label="👥 משתמשים" />
          <NavItem href="/admin/jobs" label="💼 משרות" />
        </nav>
        <div className="p-3 border-t border-slate-700">
          <Link href="/app/feed" className="text-xs text-slate-500 hover:text-slate-300">
            ← חזרה לאפליקציה
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
    >
      {label}
    </Link>
  );
}
