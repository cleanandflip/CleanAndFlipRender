import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { addresses } from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../auth";

const router = Router();

const AddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  street1: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string().default("US"),
  isDefault: z.boolean().default(false),
});

// Get user addresses (default only for checkout autofill)
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const isDefault = req.query.default === "true";
    
    // EMERGENCY FIX: Use raw SQL to handle schema mismatch until migration
    const userAddresses = await db.execute(sql`
      SELECT 
        id,
        user_id as "userId",
        COALESCE(type, 'shipping') as label,
        CONCAT(first_name, ' ', last_name) as "fullName",
        first_name as "firstName",
        last_name as "lastName",
        street,
        city,
        state,
        zip_code as "zipCode",
        country,
        is_default as "isDefault",
        created_at as "createdAt"
      FROM addresses 
      WHERE user_id = ${userId}
      ${isDefault ? sql`AND is_default = true` : sql``}
      ORDER BY is_default DESC, created_at DESC
    `);
    
    // Map to frontend expected format  
    const mapped = (userAddresses.rows as any[]).map(addr => ({
      id: addr.id,
      firstName: addr.firstName || "",
      lastName: addr.lastName || "",
      street: addr.street || "",
      city: addr.city || "", 
      state: addr.state || "",
      zipCode: addr.zipCode || "",
      postalCode: addr.zipCode || "",
      country: addr.country || "US",
      isDefault: addr.isDefault || false,
      isLocal: false // TODO: Add local delivery check
    }));
    
    res.json(isDefault ? mapped[0] : mapped);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

// Save address
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const validated = AddressSchema.parse(req.body);

    // If setting as default, unset other defaults first
    if (validated.isDefault) {
      await db.update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, userId));
    }

    // EMERGENCY FIX: Use raw SQL for insert too
    const savedAddress = await db.execute(sql`
      INSERT INTO addresses (
        user_id, type, first_name, last_name, street, city, state, zip_code, country, is_default
      ) VALUES (
        ${userId}, 'shipping', ${validated.firstName}, ${validated.lastName}, 
        ${validated.street1}, ${validated.city}, ${validated.state}, 
        ${validated.postalCode}, ${validated.country}, ${validated.isDefault}
      ) RETURNING *
    `);

    res.json(savedAddress.rows[0]);
  } catch (error) {
    console.error("Error saving address:", error);
    res.status(500).json({ error: "Failed to save address" });
  }
});

export default router;