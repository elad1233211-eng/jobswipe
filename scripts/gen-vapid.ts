/**
 * Generates VAPID key pair for Web Push notifications.
 * Run with:  npx tsx scripts/gen-vapid.ts
 * Then add the output to .env.local.
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("\n✅ VAPID keys generated. Add these to your .env.local:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
console.log("\nKeep VAPID_PRIVATE_KEY secret. NEXT_PUBLIC_VAPID_PUBLIC_KEY is safe to expose.\n");
