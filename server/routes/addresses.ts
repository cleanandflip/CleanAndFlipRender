import { Router } from "express";
import { db } from "../db";
import { addresses } from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../auth";
import { AddressSchema, toAddressDTO, type AddressDTO } from "../types/address";

const router = Router();

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
    
    // Map to frontend expected format using canonical DTO
    const mapped = (userAddresses.rows as any[]).map(addr => toAddressDTO(addr));
    
    res.json(isDefault ? mapped[0] : mapped);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

// Save address with proper validation
router.post("/", requireAuth, async (req: any, res, next) => {
  const parsed = AddressSchema.safeParse(req.body);
  if (!parsed.success) {
    // Return 400 with detailed validation errors, not 500
    return res.status(400).json({ 
      error: "VALIDATION_FAILED", 
      issues: parsed.error.flatten() 
    });
  }

  try {
    const userId = req.user.id;
    const dto = parsed.data;

    // If setting as default, unset other defaults first
    if (dto.isDefault) {
      await db.execute(sql`
        UPDATE addresses SET is_default = false WHERE user_id = ${userId}
      `);
    }

    // Insert new address using canonical DTO fields
    const savedAddress = await db.execute(sql`
      INSERT INTO addresses (
        user_id, type, first_name, last_name, street, city, state, zip_code, country, is_default
      ) VALUES (
        ${userId}, 'shipping', ${dto.firstName}, ${dto.lastName}, 
        ${dto.street1}, ${dto.city}, ${dto.state}, 
        ${dto.postalCode}, ${dto.country}, ${dto.isDefault || false}
      ) RETURNING *
    `);

    const result = toAddressDTO(savedAddress.rows[0]);
    res.json(result);
  } catch (error) {
    console.error("Database error saving address:", error);
    return next(error); // Let error handler deal with 500s
  }
});

export default router;