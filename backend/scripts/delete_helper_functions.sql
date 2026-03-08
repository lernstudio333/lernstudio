-- Create temporary log table
CREATE TEMP TABLE tmp_function_cleanup_log (
    schema_name text,
    function_name text,
    args text,
    action text
);

DO $$
DECLARE
    rec RECORD;
    drop_sql text;
BEGIN
    FOR rec IN
        SELECT
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_catalog.pg_proc p
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        ORDER BY p.proname
    LOOP

        -- Only delete helper functions
        IF rec.function_name LIKE 'is_%'
           OR rec.function_name LIKE 'user_%'
        THEN

            drop_sql := format(
                'DROP FUNCTION IF EXISTS %I.%I(%s)',
                rec.schema_name,
                rec.function_name,
                rec.args
            );

            EXECUTE drop_sql;

            INSERT INTO tmp_function_cleanup_log
            VALUES (
                rec.schema_name,
                rec.function_name,
                rec.args,
                'deleted'
            );

        ELSE

            INSERT INTO tmp_function_cleanup_log
            VALUES (
                rec.schema_name,
                rec.function_name,
                rec.args,
                'ignored'
            );

        END IF;

    END LOOP;

END $$;

-- Return results so Supabase shows them
SELECT *
FROM tmp_function_cleanup_log
ORDER BY action, function_name;