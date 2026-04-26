/**
 * Seed script: creates demo employers, jobs, and candidates,
 * plus a couple of pre-swipes so "matches" can be tested immediately.
 *
 * Run with:  npx tsx scripts/seed.ts
 *
 * All demo users share the password: demo1234
 */

import { hashPassword } from "../lib/password";
import { getDb } from "../lib/db";
import {
  upsertCandidateProfile,
  upsertEmployerProfile,
  createJob,
} from "../lib/domain";
import { randomUUID } from "node:crypto";

type DemoUser = {
  id: string;
  email: string;
  role: "candidate" | "employer";
};

async function mkUser(
  email: string,
  role: "candidate" | "employer"
): Promise<DemoUser> {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM users WHERE email=?")
    .get(email) as DemoUser | undefined;
  if (existing) {
    // Ensure demo user is pre-verified (idempotent)
    db.prepare(
      "UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?"
    ).run(Date.now(), existing.id);
    return existing;
  }
  const id = randomUUID();
  const hash = await hashPassword("demo1234");
  const now = Date.now();
  db.prepare(
    "INSERT INTO users (id, email, password_hash, role, created_at, email_verified_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, email, hash, role, now, now);
  return { id, email, role };
}

async function main() {
  console.log("🌱 Seeding JobSwipe demo data...");
  const db = getDb();

  // --- Employers ---
  const pizzaria = await mkUser("pizzaria@demo.com", "employer");
  upsertEmployerProfile(pizzaria.id, {
    company_name: "פיצריה נפוליטנה",
    contact_name: "דני כהן",
    city: "תל אביב",
    description:
      "פיצריה איטלקית משפחתית במרכז ת״א. אווירה טובה, צוות צעיר, טיפים גבוהים.",
    logo_emoji: "🍕",
  });

  const market = await mkUser("market@demo.com", "employer");
  upsertEmployerProfile(market.id, {
    company_name: 'סופר "ירוק"',
    contact_name: "רחל לוי",
    city: "רמת גן",
    description: "רשת מינימרקט שכונתית. משמרות גמישות, קרוב לתחבורה ציבורית.",
    logo_emoji: "🛒",
  });

  const cleaning = await mkUser("cleaning@demo.com", "employer");
  upsertEmployerProfile(cleaning.id, {
    company_name: "חברת ניקיון BrightClean",
    contact_name: "מיכל אברהם",
    city: "חיפה",
    description:
      "ניקיון משרדים ומוסדות באזור חיפה והקריות. רכב חברה למי שנוסע.",
    logo_emoji: "🧹",
  });

  const delivery = await mkUser("delivery@demo.com", "employer");
  upsertEmployerProfile(delivery.id, {
    company_name: "שליחויות ExpressTLV",
    contact_name: "יוסי דגן",
    city: "תל אביב",
    description: "שליחויות במרכז ת״א. אפשרי עם רכב פרטי או אופניים חשמליים.",
    logo_emoji: "🛵",
  });

  // --- Jobs ---
  const job1 = createJob(pizzaria.id, {
    title: "מלצר/ית לסופי שבוע",
    category: "מלצרות ושירות",
    city: "תל אביב",
    hourly_wage: 45,
    hours_per_week: 20,
    shift_type: "משמרות ערב",
    description:
      "מחפשים מלצר/ית אנרגטי/ת למשמרות סוף שבוע. עבודה נעימה בצוות קטן. טיפים גבוהים (ממוצע 80₪/שעה כולל).",
    requirements: [
      "גיל 18+",
      "ניסיון קודם במלצרות — יתרון",
      "זמינות לסופי שבוע",
    ],
  });

  const job2 = createJob(pizzaria.id, {
    title: "עוזר/ת טבח",
    category: "מטבח ובישול",
    city: "תל אביב",
    hourly_wage: 42,
    hours_per_week: 35,
    shift_type: "משמרות ערב",
    description:
      "עוזר/ת טבח למטבח פיצה. עבודה מאומצת אבל מגניבה. הכשרה מלאה בבית.",
    requirements: ["גיל 18+", "מוכן/ה להתחייבות לחצי שנה לפחות"],
  });

  const job3 = createJob(market.id, {
    title: "קופאי/ת",
    category: "קופה וקמעונאות",
    city: "רמת גן",
    hourly_wage: 40,
    hours_per_week: 25,
    shift_type: "גמיש",
    description: "קופאי/ת לסופר שכונתי. משמרות גמישות, מעולה לסטודנטים.",
    requirements: ["גיל 17+", "עברית שוטפת"],
  });

  const job4 = createJob(cleaning.id, {
    title: "עובד/ת ניקיון משרדים",
    category: "ניקיון ואחזקה",
    city: "חיפה",
    hourly_wage: 45,
    hours_per_week: 30,
    shift_type: "משמרות בוקר",
    description:
      "ניקיון משרדים באזור מפרץ חיפה. עבודה סולידית, צוות קטן, מקום קבוע.",
    requirements: ["אמינות", "יכולת עבודה עצמאית"],
  });

  const job5 = createJob(delivery.id, {
    title: "שליח/ה עם אופניים חשמליים",
    category: "שליחויות ומשלוחים",
    city: "תל אביב",
    hourly_wage: 50,
    hours_per_week: 20,
    shift_type: "משמרות ערב",
    description:
      "שליחויות אוכל במרכז ת״א. אפשר אופניים של החברה או שלכם. בונוסים לפי מספר משלוחים.",
    requirements: [
      "גיל 18+",
      "יכולת ניווט טובה",
      "רישיון — לא חובה",
    ],
  });

  // --- Candidates ---
  const can1 = await mkUser("noa@demo.com", "candidate");
  upsertCandidateProfile(can1.id, {
    full_name: "נועה שמש",
    age: 22,
    city: "תל אביב",
    bio: "סטודנטית שנה ב' בסוציולוגיה. עובדת במלצרות כבר 3 שנים. אוהבת אנשים וקפה.",
    experience_years: 3,
    min_hourly_wage: 45,
    available_immediately: true,
    avatar_emoji: "🧑‍🍳",
    skills: ["מלצרות", "קופה", "שירות לקוחות", "אנגלית שוטפת"],
  });

  const can2 = await mkUser("amit@demo.com", "candidate");
  upsertCandidateProfile(can2.id, {
    full_name: "עמית אלון",
    age: 19,
    city: "תל אביב",
    bio: "משוחרר מהצבא, מחפש עבודה בינתיים לפני טיול. אחראי וזריז.",
    experience_years: 1,
    min_hourly_wage: 42,
    available_immediately: true,
    avatar_emoji: "💪",
    skills: ["שליחויות", "נהיגה", "אופניים חשמליים"],
  });

  const can3 = await mkUser("maya@demo.com", "candidate");
  upsertCandidateProfile(can3.id, {
    full_name: "מאיה כהן",
    age: 28,
    city: "רמת גן",
    bio: "אחרי שנת הפסקה. רוצה חזרה לעבודה חלקית גמישה.",
    experience_years: 5,
    min_hourly_wage: 40,
    available_immediately: true,
    avatar_emoji: "🧑‍💼",
    skills: ["קופה", "שירות לקוחות", "ניהול מלאי"],
  });

  const can4 = await mkUser("daniel@demo.com", "candidate");
  upsertCandidateProfile(can4.id, {
    full_name: "דניאל רחימי",
    age: 34,
    city: "חיפה",
    bio: "אב לשניים, מחפש עבודה יציבה בשעות בוקר. אמין, דייקן, לא מפספס יום.",
    experience_years: 8,
    min_hourly_wage: 45,
    available_immediately: true,
    avatar_emoji: "👤",
    skills: ["ניקיון", "אחזקה", "עבודת צוות"],
  });

  // --- Some pre-swipes so matches can be tested ---
  // noa likes job1 (pizzaria — מלצרות)
  db.prepare(
    `INSERT OR IGNORE INTO swipes (from_user_id, target_kind, target_id, direction, created_at)
     VALUES (?, 'job', ?, 'like', ?)`
  ).run(can1.id, job1.id, Date.now() - 1000 * 60 * 60);

  // amit likes job5 (delivery)
  db.prepare(
    `INSERT OR IGNORE INTO swipes (from_user_id, target_kind, target_id, direction, created_at)
     VALUES (?, 'job', ?, 'like', ?)`
  ).run(can2.id, job5.id, Date.now() - 1000 * 60 * 30);

  // daniel likes job4 (cleaning)
  db.prepare(
    `INSERT OR IGNORE INTO swipes (from_user_id, target_kind, target_id, direction, created_at)
     VALUES (?, 'job', ?, 'like', ?)`
  ).run(can4.id, job4.id, Date.now() - 1000 * 60 * 90);

  console.log("✅ Seed complete.\n");
  console.log("Demo accounts (password for all: demo1234):");
  console.log("  מעסיקים:");
  console.log("    pizzaria@demo.com  — פיצריה נפוליטנה");
  console.log("    market@demo.com    — סופר ירוק");
  console.log("    cleaning@demo.com  — BrightClean");
  console.log("    delivery@demo.com  — ExpressTLV");
  console.log("  מועמדים:");
  console.log("    noa@demo.com       — נועה שמש");
  console.log("    amit@demo.com      — עמית אלון");
  console.log("    maya@demo.com      — מאיה כהן");
  console.log("    daniel@demo.com    — דניאל רחימי");
  console.log(
    "\nTip: התחבר כ-pizzaria@demo.com, פתח את המשרה 'מלצר/ית לסופי שבוע' — תראה שנועה כבר עשתה לייק. אם תסמן לייק בחזרה, נוצר match."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
