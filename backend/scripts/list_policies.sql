SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
ORDER BY schemaname, tablename;


