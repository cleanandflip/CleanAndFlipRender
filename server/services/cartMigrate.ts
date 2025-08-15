import { storage } from "../storage";
import { consolidateAndClampCart } from "./cartService";

export async function migrateLegacySidCartIfPresent(req: any) {
  // If an old "sid" cookie is present and differs from connect.sid owner,
  // move those items to the new owner, then consolidate.
  const legacySid = req.cookies?.sid;
  const newOwner = req.sessionID;
  if (!legacySid || !newOwner || legacySid === newOwner) return;

  const legacyItems = await storage.getCartItemsByOwner(legacySid);
  if (!legacyItems?.length) return;

  console.log(`[CART MIGRATE] Moving ${legacyItems.length} items from legacy sid ${legacySid} to ${newOwner}`);

  // Re-key rows to new owner (safe to update one-by-one)
  for (const it of legacyItems) {
    await storage.rekeyCartItemOwner(it.id, newOwner);
  }
  await consolidateAndClampCart(newOwner);
  
  console.log(`[CART MIGRATE] Migration completed for ${newOwner}`);
}