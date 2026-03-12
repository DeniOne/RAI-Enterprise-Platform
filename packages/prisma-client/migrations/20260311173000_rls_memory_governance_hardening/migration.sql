-- 20260311173000_rls_memory_governance_hardening
-- Zero-trust RLS coverage for newly added memory / governance / agent-control tables.

DO $$
DECLARE
    t text;
    strict_tables text[] := ARRAY[
        'expert_reviews',
        'incident_runbook_executions',
        'runtime_governance_events',
        'rai_autonomy_overrides',
        'rai_agent_lifecycle_overrides',
        'pending_actions',
        'agent_config_change_requests',
        'eval_runs',
        'performance_metrics',
        'memory_interactions',
        'memory_episodes',
        'memory_profiles'
    ];
    nullable_global_tables text[] := ARRAY[
        'system_incidents',
        'engrams',
        'semantic_facts',
        'agent_configurations',
        'agent_capability_bindings',
        'agent_tool_bindings',
        'agent_connector_bindings'
    ];
BEGIN
    FOREACH t IN ARRAY strict_tables
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', t);
        EXECUTE format(
            'CREATE POLICY tenant_isolation_policy ON %I
             FOR ALL
             USING ("companyId" = current_setting(''app.current_company_id'', true))
             WITH CHECK ("companyId" = current_setting(''app.current_company_id'', true));',
            t
        );
    END LOOP;

    FOREACH t IN ARRAY nullable_global_tables
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', t);
        EXECUTE format(
            'CREATE POLICY tenant_isolation_policy ON %I
             FOR ALL
             USING ("companyId" IS NULL OR "companyId" = current_setting(''app.current_company_id'', true))
             WITH CHECK ("companyId" IS NULL OR "companyId" = current_setting(''app.current_company_id'', true));',
            t
        );
    END LOOP;
END $$;
