import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הצהרת נגישות | JobSwipe",
  description: "הצהרת הנגישות של פלטפורמת JobSwipe.",
};

const LAST_UPDATED = "23 באפריל 2026";

export default function AccessibilityPage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-2">הצהרת נגישות</h1>
      <p className="text-sm text-slate-500 mb-6">עדכון אחרון: {LAST_UPDATED}</p>

      <p>
        אנו מאמינים בזכות שווה של כל אדם לקבל שירות נגיש, ופועלים בהתאם לחוק
        שוויון זכויות לאנשים עם מוגבלות, התשנ"ח–1998, ולתקנות שוויון זכויות
        לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג–2013.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">רמת ההנגשה</h2>
      <p>
        השירות נבנה במטרה לעמוד בתקן הישראלי ת"י 5568 ברמה AA, המבוסס על
        WCAG 2.1.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">התאמות שכבר בוצעו</h2>
      <ul className="list-disc pr-6 space-y-1">
        <li>תמיכה מלאה בעברית עם כיווניות RTL.</li>
        <li>טקסטים בניגודיות גבוהה על רקע לבן.</li>
        <li>שימוש בגדלי גופן רספונסיביים, כולל בנייד.</li>
        <li>טפסים עם תוויות (label) קשורות לכל שדה.</li>
        <li>אפשרות לפעול עם מקלדת בלבד (Tab, Enter).</li>
        <li>הודעות שגיאה ברורות ומפורטות לאחר שליחת טפסים.</li>
        <li>הימנעות מהבזקים או אנימציות פוגעניות. אנימציית סוויפ הקלפים ניתנת
            לדילוג באמצעות לחיצה על הכפתורים במקום גרירה.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">פערים ידועים</h2>
      <p>
        השירות בשלב MVP. ייתכנו פערים בתיאורי תמונה (אנו עושים שימוש באמוג'י
        כאווטאר), בהקראה מלאה של אנימציות, ובכמה מסכים שטרם עברו ביקורת נגישות
        מלאה. אנו פועלים לתקן זאת בקצב השוטף.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">פנייה לרכז נגישות</h2>
      <p>
        אם נתקלתם בקושי בנגישות השירות, אנא פנו אלינו ונפעל לתקן בהקדם:
      </p>
      <ul className="list-disc pr-6 space-y-1">
        <li>דוא"ל: <code>access@jobswipe.example</code> (יש להחליף לכתובת אמיתית בעת השקה)</li>
        <li>זמן מענה: עד 7 ימי עסקים.</li>
      </ul>
    </>
  );
}
