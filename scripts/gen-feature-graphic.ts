/**
 * Generates the Play Store feature graphic at 1024×500.
 * Required for every Play Store listing. Output: playstore-feature-graphic.png
 *
 * librsvg (Sharp's SVG backend) handles RTL inconsistently, so:
 *   - Hebrew lines are pre-reversed and rendered with the default LTR flow
 *     anchored to the LEFT — visually right-to-left because the Hebrew glyphs
 *     themselves render in their natural reading direction.
 *   - We anchor the text block on the left with the phone mockup on the right
 *     for a balanced, readable layout regardless of script direction.
 */
import sharp from "sharp";
import path from "path";

const W = 1024;
const H = 500;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="55%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="80" cy="60" r="120" fill="rgba(255,255,255,0.07)"/>
  <circle cx="940" cy="440" r="180" fill="rgba(255,255,255,0.05)"/>

  <!-- LEFT: Text block, anchored at x=70 -->
  <text x="70" y="170" font-family="-apple-system, system-ui, 'Segoe UI', Arial, sans-serif"
        font-weight="900" font-size="88" fill="#ffffff">JobSwipe</text>

  <text x="70" y="230" font-family="-apple-system, system-ui, 'Segoe UI', Arial, sans-serif"
        font-weight="700" font-size="36" fill="#ffffff">מוצאים עבודה בסוויפ</text>

  <text x="70" y="290" font-family="-apple-system, system-ui, 'Segoe UI', Arial, sans-serif"
        font-weight="400" font-size="22" fill="rgba(255,255,255,0.95)">החלק ימינה למשרה.</text>
  <text x="70" y="318" font-family="-apple-system, system-ui, 'Segoe UI', Arial, sans-serif"
        font-weight="400" font-size="22" fill="rgba(255,255,255,0.95)">Match = שיחה ישירה עם המעסיק.</text>
  <text x="70" y="346" font-family="-apple-system, system-ui, 'Segoe UI', Arial, sans-serif"
        font-weight="400" font-size="22" fill="rgba(255,255,255,0.95)">בלי קורות חיים. בלי מתווכים.</text>

  <!-- Pink CTA pill -->
  <rect x="70" y="395" width="220" height="50" rx="25" ry="25" fill="#ffffff"/>
  <text x="180" y="427" text-anchor="middle" font-family="-apple-system, system-ui, 'Segoe UI', Arial, sans-serif"
        font-weight="700" font-size="20" fill="#ec4899">התחילו עכשיו ✨</text>

  <!-- RIGHT: Phone mockup at x=680 -->
  <g transform="translate(680, 50)">
    <!-- Phone outline with subtle shadow -->
    <rect x="2" y="2" width="240" height="400" rx="32" ry="32" fill="rgba(0,0,0,0.25)"/>
    <rect x="0" y="0" width="240" height="400" rx="32" ry="32" fill="#1f2937" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    <!-- Screen -->
    <rect x="12" y="16" width="216" height="368" rx="22" ry="22" fill="#f9fafb"/>
    <!-- Notch / dynamic island -->
    <rect x="95" y="18" width="50" height="7" rx="3.5" ry="3.5" fill="#1f2937"/>

    <!-- Card on screen -->
    <rect x="26" y="42" width="188" height="226" rx="16" ry="16" fill="#ffffff" stroke="rgba(0,0,0,0.06)"/>
    <!-- Category badge -->
    <rect x="38" y="56" width="74" height="22" rx="11" ry="11" fill="#fed7aa"/>
    <text x="75" y="71" text-anchor="middle" font-family="Arial" font-size="12" fill="#9a3412">מסעדנות</text>
    <!-- Job title (rendered LTR but Hebrew chars flow correctly) -->
    <text x="202" y="115" text-anchor="end" font-family="Arial" font-weight="700" font-size="17" fill="#1f2937">מלצר/ית</text>
    <text x="202" y="140" text-anchor="end" font-family="Arial" font-size="13" fill="#6b7280">תל אביב</text>
    <text x="202" y="158" text-anchor="end" font-family="Arial" font-size="13" fill="#6b7280">₪45/שעה</text>
    <!-- Description dots -->
    <circle cx="200" cy="185" r="2.5" fill="#22c55e"/>
    <text x="190" y="190" text-anchor="end" font-family="Arial" font-size="11" fill="#4b5563">ניסיון של שנה</text>
    <circle cx="200" cy="205" r="2.5" fill="#22c55e"/>
    <text x="190" y="210" text-anchor="end" font-family="Arial" font-size="11" fill="#4b5563">משמרות גמישות</text>
    <circle cx="200" cy="225" r="2.5" fill="#22c55e"/>
    <text x="190" y="230" text-anchor="end" font-family="Arial" font-size="11" fill="#4b5563">בונוסים יפים</text>

    <!-- Swipe buttons -->
    <circle cx="70" cy="320" r="26" fill="#fee2e2"/>
    <text x="70" y="328" text-anchor="middle" font-family="Arial" font-weight="700" font-size="22" fill="#ef4444">×</text>
    <circle cx="170" cy="320" r="26" fill="#dcfce7"/>
    <text x="170" y="328" text-anchor="middle" font-family="Arial" font-size="22">❤</text>
  </g>
</svg>`;

async function main() {
  const out = path.join(process.cwd(), "playstore-feature-graphic.png");
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`✓ ${out} (1024×500)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
