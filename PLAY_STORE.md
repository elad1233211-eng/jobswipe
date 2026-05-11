# Google Play Store — JobSwipe Listing

This file is the source-of-truth for the Play Store listing copy.
Copy/paste each field into Play Console when submitting the app.

---

## App name

**JobSwipe — מוצאים עבודה בסוויפ**

(30 chars max — current: under limit ✓)

---

## Short description

**טינדר לעבודה. החלק ימינה למשרות, מצא Match וקבל הצעה.**

(80 chars max — current: under limit ✓)

---

## Full description

```
💼❤️ JobSwipe — האפליקציה הראשונה בישראל לחיפוש עבודה בסוויפ.

תחפש משרה כמו שאתה מחפש שותף — בלי קורות חיים מסורבלים, בלי טפסים.
החלק ימינה למשרות שמעניינות אותך, החלק שמאלה לדלג.
כשמעסיק גם החליק עליך ימינה — יש Match, ופותחים שיחה.

🔥 למה JobSwipe?
• מהיר וקל — סוויפ אחד, לא שעה של מילוי טפסים
• ישיר — שיחה ב-DM עם המעסיק, בלי מתווכים
• ממוקד — משרות שירות, לוגיסטיקה, מסעדנות, קמעונאות, נקיון, קונסטרוקציה ועוד
• בעברית — אפליקציה ישראלית עם תמיכה מלאה ב-RTL

👷 למחפשי עבודה:
- מלא פרופיל פעם אחת — תמונה, ניסיון, כישורים
- החלק על משרות לפי עיר, קטגוריה, ושכר שעתי
- קבל הודעות ישירות מהמעסיק כשיש Match

🏢 למעסיקים:
- פרסם משרה בלי קורות חיים — מועמדים מוצגים כפרופילים מהירים
- בחר את המתאימים בסוויפ
- שוחח ישירות עם מועמדים מתאימים

החלק. תאמת. תתחיל לעבוד.

JobSwipe — מוצאים עבודה בסוויפ 🇮🇱
```

(4000 chars max — current: under limit ✓)

---

## Category

- **Primary:** Business
- **Secondary:** Productivity

## Tags

- Job search · חיפוש עבודה · משרות · קריירה · מועמדים · מעסיקים · גיוס

## Content rating

- **PEGI 3 / Everyone** (no violence, no gambling, no user-generated mature content moderated)

---

## Required URLs

| Field | URL |
|---|---|
| Privacy Policy | https://jobswipe-production.up.railway.app/legal/privacy |
| Terms of Service | https://jobswipe-production.up.railway.app/legal/terms |
| Data Deletion | https://jobswipe-production.up.railway.app/legal/data-deletion |
| Support email | elad1233211@gmail.com |
| Support website | https://jobswipe-production.up.railway.app |

---

## Data safety form (Play Console)

Answer these in the Data safety section:

- **Does your app collect or share user data?** Yes
- **Data types collected:**
  - Personal info: Email, Name
  - Photos and videos: Profile photo (optional, base64 in our DB)
  - Location: City (free-text, not GPS)
  - Messages: In-app chat between matched users
  - App activity: Swipes (used for matching)
- **Data is encrypted in transit?** Yes (HTTPS only)
- **Can users request data deletion?** Yes — via in-app and at /legal/data-deletion
- **Data is shared with third parties?** No
- **All collection is for app functionality** — none for advertising, analytics, or sale.

---

## Required graphic assets

| Asset | Size | Status | Source |
|---|---|---|---|
| App icon (hi-res) | 512×512 PNG | ✓ Done | `playstore-icon-512.png` |
| Feature graphic | 1024×500 PNG | ✓ Done | `playstore-feature-graphic.png` (regenerate: `npx tsx scripts/gen-feature-graphic.ts`) |
| Phone screenshots (min 2, max 8) | 1170×2532 PNG | ✓ Done (4) | `playstore-screenshots/01..07-*.png` (regenerate: `npm run gen-screenshots`) |
| 7-inch tablet screenshots (optional) | 1200×1920 | — Optional | — |
| 10-inch tablet screenshots (optional) | 1920×1200 | — Optional | — |

---

## Suggested screenshots (in order)

1. **Hero / landing page** — show the swipe card UI, large headline
2. **Job swipe card** — actual job with category badge, requirements
3. **Match modal / Matches list** — celebrate the match moment
4. **Chat with employer** — conversation thread
5. **Candidate profile** — photo, skills, experience
6. **Employer dashboard** — listing jobs

Capture from a real Android device or Android Studio emulator at 1080×1920.

---

## Pre-submission checklist

- [ ] Generate signed AAB: `./gradlew bundleRelease` (after creating keystore)
- [ ] Test the AAB on a real device (sideload via `adb install`)
- [ ] Create Google Play Console account ($25 one-time)
- [ ] Create new app listing in Play Console
- [ ] Fill all listing fields above
- [ ] Upload graphics (icon ✓, feature graphic, screenshots)
- [ ] Complete Data Safety form
- [ ] Set content rating
- [ ] Set countries (Israel only initially? all countries?)
- [ ] Internal testing track first → closed testing → production
- [ ] Submit for review (1-7 days)

---

## Versioning policy

| Field | Value |
|---|---|
| Version code | Increment by 1 on every Play Store release |
| Version name | Semantic: 1.0.0 → 1.0.1 (patch) → 1.1.0 (feature) |

Update both in `android/app/build.gradle`:
```groovy
versionCode 2          // was 1
versionName "1.0.1"    // was "1.0"
```
