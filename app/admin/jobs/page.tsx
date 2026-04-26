import { listJobsForAdmin } from "@/lib/domain";
import { toggleJobActiveAdminAction } from "@/app/actions/admin";
import Link from "next/link";

const PAGE_SIZE = 50;

export default async function AdminJobsPage(
  props: { searchParams: Promise<{ page?: string }> }
) {
  const sp = await props.searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  const jobs = listJobsForAdmin(PAGE_SIZE + 1, offset);
  const hasNext = jobs.length > PAGE_SIZE;
  const rows = jobs.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">💼 משרות — עמוד {page}</h1>
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`/admin/jobs?page=${page - 1}`} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white">
              ← הקודם
            </Link>
          )}
          {hasNext && (
            <Link href={`/admin/jobs?page=${page + 1}`} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white">
              הבא →
            </Link>
          )}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">כותרת</th>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">חברה</th>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">עיר</th>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">לייקים</th>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">התאמות</th>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">סטטוס</th>
              <th className="text-right px-4 py-2 text-slate-400 font-medium">פעולה</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {rows.map((j) => (
              <tr key={j.id} className={!j.is_active ? "opacity-50" : ""}>
                <td className="px-4 py-2 text-white font-medium">{j.title}</td>
                <td className="px-4 py-2 text-slate-300">{j.logo_emoji} {j.company_name}</td>
                <td className="px-4 py-2 text-slate-400">{j.city}</td>
                <td className="px-4 py-2 text-slate-300">{j.like_count}</td>
                <td className="px-4 py-2">
                  {j.match_count > 0 ? (
                    <span className="text-pink-400 font-medium">{j.match_count}</span>
                  ) : (
                    <span className="text-slate-500">0</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${j.is_active ? "bg-green-900/40 text-green-400" : "bg-slate-700 text-slate-400"}`}>
                    {j.is_active ? "פעילה" : "מושבתת"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <form action={toggleJobActiveAdminAction.bind(null, j.id, j.employer_id, !j.is_active)}>
                    <button className="text-xs bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded">
                      {j.is_active ? "השבת" : "הפעל"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
