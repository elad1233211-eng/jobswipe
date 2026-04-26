# פריסה — JobSwipe

מדריך פריסה מהיר ל-MVP. כל הכלים כאן **חינמיים ופתוחים** — ללא שירותי צד שלישי בתשלום.

---

## TL;DR

```bash
# 1. על שרת חדש (Ubuntu/Debian), התקן Docker:
curl -fsSL https://get.docker.com | sh

# 2. Clone + configure:
git clone <repo-url> jobswipe && cd jobswipe
echo "AUTH_SECRET=$(node -e 'console.log(require(\"crypto\").randomBytes(48).toString(\"base64url\"))')" > .env

# 3. Build + run:
docker compose up -d --build

# 4. (אופציונלי) מילוי נתוני דמו לצורך הדגמה:
docker compose exec app npm run seed

# 5. Health check:
curl http://localhost:3000/api/health
```

---

## דרישות שרת מינימליות

- **מערכת:** Ubuntu 22.04+ / Debian 12+ / כל הפצת Linux עם Docker.
- **זיכרון:** 512MB (1GB מומלץ).
- **דיסק:** 1GB ל-image + נפח ל-DB (SQLite יגדל לאט; לרוב פחות מ-100MB עד 10K משתמשים).
- **פורט:** 3000 פנימי. חשפו 80/443 דרך reverse proxy.

## משתני סביבה

| משתנה | חובה? | הערה |
|---|---|---|
| `AUTH_SECRET` | ✅ | מחרוזת אקראית של 32+ תווים. חובה להגדיר לפני build. |
| `PORT` | לא | ברירת מחדל 3000 |
| `HOSTNAME` | לא | ברירת מחדל `0.0.0.0` בתוך ה-container |

## Reverse proxy עם HTTPS (חינם, Caddy)

Caddy הוא reverse proxy חופשי שמקבל תעודה מ-Let's Encrypt אוטומטית:

```caddyfile
# /etc/caddy/Caddyfile
jobswipe.example.co.il {
    reverse_proxy localhost:3000
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    }
}
```

חלופה: `nginx` + `certbot`.

## גיבוי SQLite

SQLite הוא קובץ יחיד. גיבוי מלא = העתקה של `data/jobswipe.db`:

```bash
# באמצעות VACUUM INTO מתוך ה-container, בלי להפסיק את השירות:
docker compose exec app node -e "
  require('better-sqlite3')('/app/data/jobswipe.db')
    .exec('VACUUM INTO \"/app/data/backup-$(date +%F).db\"')
"

# או פשוט לעתק — SQLite ב-WAL מצב בטוח לקפסולת יחסי:
docker compose cp app:/app/data/jobswipe.db ./backups/jobswipe-$(date +%F).db
```

שלחו את הקובץ לכל אחסון חינמי (Backblaze B2 יש 10GB חינם, Cloudflare R2 10GB חינם, אפילו git-LFS פרטי למאגר גיבוי).

## עדכון גרסה

```bash
git pull
docker compose up -d --build
# הסכמה של SQLite רצה באתחול לפי IF NOT EXISTS — migration ידני אם שדות השתנו.
```

## ניטור ובריאות

- **`/api/health`** מחזיר JSON עם status + DB latency. ה-container עצמו מריץ `HEALTHCHECK` פנימי כל 30 שניות.
- **Uptime חיצוני חינמי:** [UptimeRobot](https://uptimerobot.com) או [HealthChecks.io](https://healthchecks.io) (self-host פתוח).
- **Logs:** `docker compose logs -f app`.

## רשימת תיוג לפני השקה פומבית

- [ ] `AUTH_SECRET` חזק ומגובה במקום בטוח.
- [ ] HTTPS מאחורי Caddy/nginx — לא חושף את פורט 3000 החוצה ישירות.
- [ ] יש תפקוד גיבוי יומי של `jobswipe.db`.
- [ ] כתובת האימייל בהצהרת הנגישות (`/legal/accessibility`) פעילה ומתויגת.
- [ ] פרטי יצירת קשר במדיניות הפרטיות (`/legal/privacy`) עודכנו לפרטי הישות המשפטית.
- [ ] לפחות חשבון מנהל אחד יוצר כדי לבדוק `/api/health` ותרחישי sanity.
- [ ] הגדרתם monitoring חיצוני על `/api/health`.
- [ ] בדקתם את ה-rate-limit: ניסיון login 11 פעם מחזיר הודעה בעברית במקום 500.

## פריסה על פלטפורמות ללא עלות

**Fly.io (חבילת חינמי לשירות MVP קטן):**

```bash
flyctl launch --dockerfile Dockerfile --no-deploy
flyctl volumes create data --size 1 --region fra
flyctl secrets set AUTH_SECRET=$(node -e 'console.log(require("crypto").randomBytes(48).toString("base64url"))')
flyctl deploy
```

**Railway / Render:** שניהם מזהים את `Dockerfile` אוטומטית. מדפיסים AUTH_SECRET במשתני הסביבה ומוסיפים persistent volume ב-`/app/data`.

**VPS חינמי:** Oracle Cloud Always-Free VM (ARM Ampere, 1vCPU/6GB RAM) — מארח את ה-stack הזה בנוחות.

## התראות תקלה בזמן אמת (חינמי)

- עטפו את `/api/health` בחוק של [Healthchecks.io](https://healthchecks.io) או [better-uptime.com](https://betterstack.com/better-uptime) (חבילת חינם).
- הוסיפו hook בדיסקורד/טלגרם ל-service.
