-- Check the actual function that was created
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'track_price_change';

-- Also try to manually execute a statement that mimics what the trigger would do
-- Create a test scenario
DO $$
DECLARE
  test_horse_id UUID := '3b642e79-259e-4be1-85ab-2645e07b8331';
  old_price NUMERIC := 179999.00;
  new_price NUMERIC := 169999.00;
BEGIN
  RAISE NOTICE 'Testing manual price change logic...';
  RAISE NOTICE 'Old price: %, New price: %', old_price, new_price;

  IF old_price IS NOT NULL
     AND new_price IS NOT NULL
     AND old_price IS DISTINCT FROM new_price THEN

    RAISE NOTICE 'Inserting into price_history...';

    INSERT INTO price_history (
      horse_id,
      old_price,
      new_price,
      price_change,
      price_change_percent
    ) VALUES (
      test_horse_id,
      old_price,
      new_price,
      new_price - old_price,
      ROUND(((new_price - old_price) / old_price * 100)::NUMERIC, 2)
    );

    RAISE NOTICE 'Insert completed!';
  ELSE
    RAISE NOTICE 'Conditions not met';
  END IF;
END $$;

-- Check if that manual test created an entry
SELECT * FROM price_history ORDER BY created_at DESC LIMIT 2;
