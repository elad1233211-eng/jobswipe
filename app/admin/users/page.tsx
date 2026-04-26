import { listUsersForAdmin } from "@/lib/domain";
import AdminUserActions from "./AdminUserRow";
import Link from "next/link";

const PAGE_SIZE = 50;

export default async function AdminUsersPage(
  props: { searchParams: Promise<{ page?: string }> }
) {
  const sp = await props.searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  const users = listUsersForAdmin(PAGE_SIZE + 1, offset);
  const hasNext = users.length > PAGE_SIZE;
  const rows = users.slice(0, PAGE_SIZE);

  const candidates = rows.filter((u) => u.role === "candidate");
  const employers = rows.filter((u) => u.role === "employer");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          👥 משתמשים — עמוד {page}
        </h1>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/admin/users?page=${page - 1}`}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white"
            >
              ← הקודם
            </Link>
          )}
          {hasNext && (
            <Link
              href={`/admin/users?page=${page + 1}`}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white"
            >
              הבא →
            </Link>
          )}
        </div>
      </div>

      <UserTable title={`🧑‍💼 מועמדים (${candidates.length})`} users={candidates} />
      <UserTable title={`🏢 מעסיקים (${employers.length})`} users={employers} />
    </div>
  );
}

type UserList = Awaited<ReturnType<typeof listUsersForAdmin>>;

function UserTable({ title, users }: { title: string; users: UserList }) {
  if (users.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-300 mb-3">{title}</h2>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">שם</th>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">אימייל</th>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">אומת</th>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">הצטרף</th>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {users.map((u) => (
              <tr key={u.id} className={u.is_disabled ? "opacity-40" : ""}>
                <td className="px-4 py-2 text-white">{u.avatar_emoji} {u.display_name}</td>
                <td className="px-4 py-2 text-slate-300 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-2">
                  {u.email_verified_at ? (
                    <span className="text-green-400 text-xs">✅</span>
                  ) : (
                    <span className="text-amber-400 text-xs">⏳</span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-400 text-xs">
                  {new Date(u.created_at).toLocaleDateString("he-IL")}
                </td>
                <td className="px-4 py-2">
                  <AdminUserActions
                    userId={u.id}
                    displayName={u.display_name}
                    isDisabled={u.is_disabled}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
