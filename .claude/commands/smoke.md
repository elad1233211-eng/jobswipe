---
description: בדיקת smoke מהירה — מפעיל dev server, דופק curl על מסלולים קריטיים, ומדווח
---

בדוק שהאפליקציה חיה:

1. אם dev server לא רץ על 3000 — הפעל `npm run dev` ב-background והמתן עד `/api/health` מחזיר 200.
2. דפוק curl על: `/`, `/login`, `/signup`, `/legal/privacy`, `/legal/terms`, `/legal/accessibility`, `/api/health`, וכתובת לא קיימת כדי לאמת 404.
3. החזר טבלה: נתיב | קוד HTTP | תקין/לא.
4. אם משהו מחזיר קוד לא צפוי — קרא את הלוג של ה-dev server ודווח על השורה הרלוונטית.
5. אל תכבה את ה-dev server אם הפעלת אותו — השאר אותו זמין לבדיקות ידניות שלי.

טען את הסקיל `jobswipe-ops` לפני שאתה מתחיל.
