import { Router } from "express";
import { z } from "zod";

const router = Router();

const AddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  street1: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string().default("US"),
});

// Get shipping quote
router.post("/quote", async (req, res) => {
  try {
    const { address } = req.body;
    const validated = AddressSchema.parse(address);

    // Simple quote calculation based on address
    const subtotal = 100; // This would come from cart total in real implementation
    let shippingPrice = 25;
    
    // Free shipping over $100
    if (subtotal > 100) {
      shippingPrice = 0;
    }

    // Different tax rates by state
    const taxRates: Record<string, number> = {
      CA: 0.0825,
      NY: 0.08,
      TX: 0.0625,
      FL: 0.06,
      // Default rate
    };
    
    const taxRate = taxRates[validated.state] || 0.08;
    const tax = subtotal * taxRate;
    const total = subtotal + shippingPrice + tax;

    const quote = {
      shippingMethods: [
        {
          id: "standard",
          label: "Standard Shipping (5-7 business days)",
          price: shippingPrice,
        },
      ],
      tax,
      subtotal,
      total,
    };

    res.json(quote);
  } catch (error) {
    console.error("Error calculating quote:", error);
    res.status(500).json({ error: "Failed to calculate quote" });
  }
});

export default router;