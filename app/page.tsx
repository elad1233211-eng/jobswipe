import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "candidate" ? "/app/feed" : "/app/employer");
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="bg-brand-gradient text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-4">💼❤️</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            מוצאים עבודה בסוויפ אחד
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            JobSwipe היא פלטפורמת גיוס מהירה שמחברת בין עובדים למעסיקים.
            <br />
            בלי קורות חיים מסובכים. התאמה אמיתית תוך דקות.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-white text-pink-600 font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition"
            >
              מתחילים 🚀
            </Link>
            <Link
              href="/login"
              className="bg-white/15 backdrop-blur border border-white/40 text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-white/25 transition"
            >
              כבר יש לי חשבון
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">איך זה עובד?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Step
              emoji="📝"
              title="1. מקימים פרופיל"
              text="כמה שדות פשוטים — מי אתם, מאיפה, מה אתם מחפשים. זהו."
            />
            <Step
              emoji="👆"
              title="2. סוויפ על משרות"
              text="ימינה = מעניין, שמאלה = ממשיכים הלאה. כמו שאתם מכירים."
            />
            <Step
              emoji="💬"
              title="3. מתחברים"
              text="כששני הצדדים עשו לייק — נפתח צ'אט ישיר להתחיל שיחה."
            />
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <Card
            title="למחפשי/ות עבודה"
            emoji="🧑‍🍳"
            bullets={[
              "מתאים לכל סוגי המשרות — מלצרות, שליחים, מחסנים, ניקיון, קופאים ועוד",
              "בלי קורות חיים, בלי טפסים ארוכים",
              "פונים רק אליך כשיש עניין משני הצדדים",
            ]}
          />
          <Card
            title="למעסיקים/ות"
            emoji="🏢"
            bullets={[
              "פרסום משרה תוך דקה",
              "מועמדים פעילים שמחפשים עבודה עכשיו",
              "שיחה ישירה, בלי מתווכים, בלי עמלות על התאמה",
            ]}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6 text-center text-slate-500 text-sm">
        <nav className="flex flex-wrap gap-x-4 gap-y-2 justify-center mb-3">
          <Link href="/legal/privacy" className="hover:text-pink-600">
            פרטיות
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/legal/terms" className="hover:text-pink-600">
            תנאי שימוש
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/legal/accessibility" className="hover:text-pink-600">
            נגישות
          </Link>
        </nav>
        <p>© {new Date().getFullYear()} JobSwipe · MVP · נבנה בישראל 🇮🇱</p>
      </footer>
    </main>
  );
}

function Step({
  emoji,
  title,
  text,
}: {
  emoji: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 card-shadow text-center">
      <div className="text-5xl mb-3">{emoji}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-600">{text}</p>
    </div>
  );
}

function Card({
  title,
  emoji,
  bullets,
}: {
  title: string;
  emoji: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{emoji}</span>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <ul className="space-y-2 text-slate-700">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-brand">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
