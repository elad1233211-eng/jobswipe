import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getJob } from "@/lib/domain";
import JobForm from "../../JobForm";

export default async function EditJobPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "employer") redirect("/app/feed");

  const job = getJob(id);
  if (!job || job.employer_id !== user.id) notFound();

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link
          href={`/app/employer/jobs/${id}`}
          className="text-slate-500"
        >
          ← חזרה למשרה
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-2">עריכת משרה</h1>
      <p className="text-slate-500 mb-6">שינויים יחולו מיידית על המשרה.</p>
      <JobForm
        mode="edit"
        jobId={id}
        defaults={{
          title: job.title,
          category: job.category,
          city: job.city,
          hourly_wage: job.hourly_wage,
          hours_per_week: job.hours_per_week,
          shift_type: job.shift_type,
          description: job.description,
          requirements: JSON.parse(job.requirements_json || "[]"),
        }}
      />
    </div>
  );
}
