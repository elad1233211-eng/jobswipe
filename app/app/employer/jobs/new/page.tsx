import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import JobForm from "../JobForm";

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "employer") redirect("/app/feed");

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/app/employer" className="text-slate-500">
          ← חזרה
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-2">משרה חדשה</h1>
      <p className="text-slate-500 mb-6">
        ככל שהפרטים ברורים יותר — יותר מועמדים רלוונטיים.
      </p>
      <JobForm mode="create" />
    </div>
  );
}
