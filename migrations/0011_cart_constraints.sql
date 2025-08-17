-- Add cart foreign key constraints (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cart_items_product') THEN
    ALTER TABLE "cart_items"
    ADD CONSTRAINT "fk_cart_items_product"
    FOREIGN KEY ("product_id")
    REFERENCES "products"("id")
    ON DELETE CASCADE
    NOT VALID;
    ALTER TABLE "cart_items" VALIDATE CONSTRAINT "fk_cart_items_product";
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cart_items_user') THEN
    ALTER TABLE "cart_items"
    ADD CONSTRAINT "fk_cart_items_user"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE SET NULL
    NOT VALID;
    ALTER TABLE "cart_items" VALIDATE CONSTRAINT "fk_cart_items_user";
  END IF;
END$$;

-- Enforce uniqueness per owner/product (prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_cart_owner_product_enhanced"
ON "cart_items" (owner_id, product_id);