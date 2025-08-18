-- Fix production database schema drift
-- Add missing columns that exist in development but not in production

-- Check if cost column exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'cost') THEN
        ALTER TABLE products ADD COLUMN cost DECIMAL(10,2);
        RAISE NOTICE 'Added cost column to products table';
    ELSE
        RAISE NOTICE 'Cost column already exists in products table';
    END IF;
END $$;

-- Check if compare_at_price column exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'compare_at_price') THEN
        ALTER TABLE products ADD COLUMN compare_at_price DECIMAL(10,2);
        RAISE NOTICE 'Added compare_at_price column to products table';
    ELSE
        RAISE NOTICE 'Compare_at_price column already exists in products table';
    END IF;
END $$;

-- Check if sku column exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'sku') THEN
        ALTER TABLE products ADD COLUMN sku VARCHAR;
        RAISE NOTICE 'Added sku column to products table';
    ELSE
        RAISE NOTICE 'SKU column already exists in products table';
    END IF;
END $$;

-- Check if dimensions column exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'dimensions') THEN
        ALTER TABLE products ADD COLUMN dimensions JSONB;
        RAISE NOTICE 'Added dimensions column to products table';
    ELSE
        RAISE NOTICE 'Dimensions column already exists in products table';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('cost', 'compare_at_price', 'sku', 'dimensions')
ORDER BY column_name;