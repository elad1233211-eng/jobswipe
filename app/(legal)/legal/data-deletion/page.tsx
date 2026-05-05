import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "מחיקת נתונים | JobSwipe",
  description: "בקשה למחיקת חשבון ונתונים אישיים ב-JobSwipe.",
};

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://jobswipe.up.railway.app";

export default function DataDeletionPage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-2">מחיקת נתונים אישיים</h1>
      <p className="text-sm text-slate-500 mb-6">עמוד זה מסביר כיצד למחוק את חשבונך ואת כל הנתונים שלך מ-JobSwipe.</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">מה נמחק?</h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>פרטי חשבון (אימייל, סיסמה מוצפנת)</li>
          <li>פרופיל מועמד או מעסיק</li>
          <li>משרות שפרסמת</li>
          <li>היסטוריית סווייפים ומאצ&#39;ים</li>
          <li>הודעות צ&apos;אט</li>
          <li>דיווחים שהגשת</li>
          <li>נתוני Push Notifications</li>
        </ul>
        <p className="mt-3 text-slate-600 text-sm">
          כל הנתונים נמחקים לצמיתות תוך 30 יום לאחר הבקשה ולא ניתן לשחזרם.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">מחיקה עצמית — מהירה ומיידית</h2>
        <p className="text-slate-700 mb-3">
          המסלול המהיר ביותר הוא מחיקה ישירה מהאפליקציה:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-slate-700">
          <li>התחבר לחשבון שלך ב-JobSwipe</li>
          <li>עבור לדף <strong>פרופיל</strong> (כרטיסיית "פרופיל" בתפריט התחתון)</li>
          <li>גלול למטה ולחץ על <strong>"מחיקת חשבון"</strong></li>
          <li>אשר את המחיקה — הנתונים נמחקים מיד</li>
        </ol>
        <Link
          href={`${APP_URL}/login`}
          className="inline-block mt-4 bg-pink-500 text-white font-semibold py-2 px-6 rounded-xl hover:bg-pink-600 transition-colors"
        >
          עבור לאפליקציה →
        </Link>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">בקשה בכתב (אם אין גישה לחשבון)</h2>
        <p className="text-slate-700">
          שלח אימייל לכתובת{" "}
          <a href="mailto:privacy@jobswipe.app" className="text-pink-500 underline">
            privacy@jobswipe.app
          </a>{" "}
          עם הפרטים הבאים:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-slate-700">
          <li>שם מלא</li>
          <li>כתובת אימייל שרשומה בחשבון</li>
          <li>בקשה מפורשת למחיקת כל הנתונים</li>
        </ul>
        <p className="mt-3 text-slate-600 text-sm">
          נעבד את הבקשה ונשלח אישור תוך 14 ימי עסקים.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">פרטי קשר</h2>
        <p className="text-slate-700">
          לכל שאלה בנושא פרטיות ומחיקת נתונים:{" "}
          <a href="mailto:privacy@jobswipe.app" className="text-pink-500 underline">
            privacy@jobswipe.app
          </a>
        </p>
      </section>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <Link href="/legal/privacy" className="text-pink-500 text-sm hover:underline">
          ← מדיניות פרטיות מלאה
        </Link>
      </div>
    </>
  );
}
