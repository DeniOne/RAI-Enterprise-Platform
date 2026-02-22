-- 20260223000000_zero_trust_rls_hardening.sql
-- 10/10 Tenant Isolation Hardening: Global RLS Enforcement

DO $$
DECLARE
    t text;
    tables_to_harden text[] := ARRAY[
        'field_observations', 'cmr_deviation_reviews', 'cmr_risks', 'tasks', 'tech_maps', 
        'accounts', 'machinery', 'risk_signals', 'risk_assessments', 'risk_state_history', 
        'decision_records', 'consulting_budget_plans', 'event_consumptions', 'users', 
        'invitations', 'technology_cards', 'fields', 'seasons', 'tenant_states', 
        'audit_logs', 'account_balances', 'governance_configs', 'business_rules', 
        'holdings', 'rapeseeds', 'season_snapshots', 'role_definitions', 'memory_entries', 
        'employee_profiles', 'divergence_records', 'agronomic_strategies', 'generation_records', 
        'consulting_budget_items', 'crm_deals', 'crm_scorecards', 'crm_contracts', 
        'cmr_decisions', 'cmr_insurance_coverages', 'hr_okr_cycles', 'hr_kpi_indicators', 
        'hr_pulse_surveys', 'hr_human_assessment_snapshots', 'ledger_entries', 'economic_events', 
        'budgets', 'consulting_cash_accounts', 'harvest_results', 'consulting_strategic_goals', 
        'consulting_execution_records', 'rai_drift_reports', 'rai_learning_events', 
        'rai_training_runs', 'rai_model_versions', 'gr_interactions', 'regulatory_bodies', 
        'legal_documents', 'legal_requirements', 'compliance_checks', 'rai_soil_metrics', 
        'policy_signals', 'research_programs', 'knowledge_nodes', 'knowledge_edges', 
        'vision_observations', 'satellite_observations', 'level_f_cert_audit', 
        'rai_sustainability_baselines', 'rai_biodiversity_metrics', 'rai_governance_locks', 
        'rai_override_requests', 'stock_items', 'harvest_performance_contracts', 
        'harvest_plans', 'stock_transactions'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_harden
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);

        -- Drop existing policy if any (to avoid duplicates)
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', t);

        -- Create global isolation policy
        EXECUTE format('
            CREATE POLICY tenant_isolation_policy ON %I
            USING ("companyId" = current_setting(''app.current_company_id'', true));
        ', t);
        
        RAISE NOTICE 'RLS Hardened table: %', t;
    END LOOP;
END $$;
