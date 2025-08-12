import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { addresses } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
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
    
    let query = db.select().from(addresses).where(eq(addresses.userId, userId));
    
    if (isDefault) {
      query = query.where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
    }

    const userAddresses = await query;
    
    // Map to frontend expected format
    const mapped = userAddresses.map(addr => ({
      firstName: addr.firstName,
      lastName: addr.lastName,
      email: addr.email || "",
      phone: addr.phone || "",
      street1: addr.street,
      street2: "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.zipCode,
      country: addr.country || "US",
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

    const [savedAddress] = await db.insert(addresses)
      .values({
        userId,
        type: "shipping",
        firstName: validated.firstName,
        lastName: validated.lastName,
        street: validated.street1,
        city: validated.city,
        state: validated.state,
        zipCode: validated.postalCode,
        country: validated.country,
        isDefault: validated.isDefault,
      })
      .returning();

    res.json(savedAddress);
  } catch (error) {
    console.error("Error saving address:", error);
    res.status(500).json({ error: "Failed to save address" });
  }
});

export default router;