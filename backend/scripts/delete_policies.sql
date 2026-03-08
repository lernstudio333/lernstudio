-- Temporary log table so Supabase can display results
CREATE TEMP TABLE tmp_policy_cleanup_log (
    schema_name text,
    table_name text,
    policy_name text,
    action text
);

DO $$
DECLARE
  rec RECORD;
  drop_sql text;

  -- safety switch
  dry_run boolean := false;

BEGIN
  FOR rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    ORDER BY schemaname, tablename, policyname
  LOOP

    drop_sql := format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      rec.policyname,
      rec.schemaname,
      rec.tablename
    );

    IF dry_run THEN

        INSERT INTO tmp_policy_cleanup_log
        VALUES (
            rec.schemaname,
            rec.tablename,
            rec.policyname,
            'would_delete'
        );

    ELSE

        EXECUTE drop_sql;

        INSERT INTO tmp_policy_cleanup_log
        VALUES (
            rec.schemaname,
            rec.tablename,
            rec.policyname,
            'deleted'
        );

    END IF;

  END LOOP;

END $$;

-- Show results in Supabase
SELECT *
FROM tmp_policy_cleanup_log
ORDER BY schema_name, table_name, policy_name;