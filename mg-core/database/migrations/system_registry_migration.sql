-- =========================================================================================================
-- SYSTEM REGISTRY SCHEMA MIGRATION
-- =========================================================================================================
-- Purpose: Create foundation entities for MatrixGin v2.x
-- Scope:   Schemas `registry`, `security`, `legal`
-- Type:    Manual (📝) Entities ONLY
-- Rules:   NO soft-delete, NO cascade delete, NO JSONB, Strict Audit Columns
-- =========================================================================================================

-- 1. SETUP EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE SCHEMAS
CREATE SCHEMA IF NOT EXISTS registry;
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS legal;

-- =========================================================================================================
-- 3. COMMON DDL HELPERS (Conceptual - applied manually to each table to stay explicit)
--    Standard Columns:
--      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY
--      code text NOT NULL UNIQUE
--      name text NOT NULL
--      description text
--      lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived'))
--      created_at timestamptz NOT NULL DEFAULT now()
--      updated_at timestamptz NOT NULL DEFAULT now()
--      created_by uuid
--      source text NOT NULL DEFAULT 'registry'
-- =========================================================================================================


-- =========================================================================================================
-- SCHEMA: SECURITY
-- Entities: UserAccount, Role, Permission, RolePermission, AccessScope
-- =========================================================================================================

-- Table: security.user_account
CREATE TABLE security.user_account (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived', 'banned')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE security.user_account IS 'Core system identity for login. foundation entity.';

-- Table: security.role
CREATE TABLE security.role (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE security.role IS 'Security role for RBAC. foundation entity.';

-- Table: security.permission
CREATE TABLE security.permission (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE security.permission IS 'Atomic permission unit. foundation entity.';

-- Table: security.role_permission
CREATE TABLE security.role_permission (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL, -- usually 'Role-Permission link'
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    role_id uuid NOT NULL REFERENCES security.role(id) ON DELETE RESTRICT,
    permission_id uuid NOT NULL REFERENCES security.permission(id) ON DELETE RESTRICT
);
COMMENT ON TABLE security.role_permission IS 'Association between Role and Permission. foundation entity.';

-- Table: security.access_scope
CREATE TABLE security.access_scope (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE security.access_scope IS 'Scope definition for access control boundaries. foundation entity.';


-- =========================================================================================================
-- SCHEMA: LEGAL
-- Entities: LegalEntity, Document
-- =========================================================================================================

-- Table: legal.legal_entity
CREATE TABLE legal.legal_entity (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE legal.legal_entity IS 'Official legal entity (Juridical Person). foundation entity.';

-- Table: legal.document
CREATE TABLE legal.document (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE legal.document IS 'Legal document template or registry record. foundation entity.';


-- =========================================================================================================
-- SCHEMA: REGISTRY (General Foundation)
-- =========================================================================================================

-- SYSTEM / META
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.policy_rule
CREATE TABLE registry.policy_rule (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.policy_rule IS 'System wide policy rule. foundation entity.';

-- Table: registry.retention_policy
CREATE TABLE registry.retention_policy (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.retention_policy IS 'Data retention policy definition. foundation entity.';


-- HUMAN / ACTORS
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.person
CREATE TABLE registry.person (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.person IS 'Human being entity. foundation entity.';

-- Table: registry.employee
CREATE TABLE registry.employee (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    person_id uuid REFERENCES registry.person(id) ON DELETE RESTRICT
);
COMMENT ON TABLE registry.employee IS 'Company employee record, linked to Person. foundation entity.';

-- Table: registry.external_actor
CREATE TABLE registry.external_actor (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.external_actor IS 'Clients, Partners, Vendors etc. foundation entity.';

-- Table: registry.ai_agent
CREATE TABLE registry.ai_agent (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived', 'decommissioned')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.ai_agent IS 'AI Agent actor. foundation entity.';


-- ORGANIZATIONAL STRUCTURE
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.organization
CREATE TABLE registry.organization (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.organization IS 'Top level organization entity. foundation entity.';

-- Table: registry.org_unit_type
CREATE TABLE registry.org_unit_type (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.org_unit_type IS 'Type of unit (Department, Squad, Tribe etc). foundation entity.';

-- Table: registry.org_unit
CREATE TABLE registry.org_unit (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    org_unit_type_id uuid NOT NULL REFERENCES registry.org_unit_type(id) ON DELETE RESTRICT,
    parent_org_unit_id uuid REFERENCES registry.org_unit(id) ON DELETE RESTRICT
);
COMMENT ON TABLE registry.org_unit IS 'Structural unit in the organization graph. foundation entity.';

-- Table: registry.structural_role
CREATE TABLE registry.structural_role (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.structural_role IS 'Role defined by structure (e.g. Head of Dept). foundation entity.';

-- Table: registry.org_relation
CREATE TABLE registry.org_relation (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    from_unit_id uuid NOT NULL REFERENCES registry.org_unit(id) ON DELETE RESTRICT,
    to_unit_id uuid NOT NULL REFERENCES registry.org_unit(id) ON DELETE RESTRICT,
    relation_type text -- e.g. 'reports_to', 'collaborates_with'
);
COMMENT ON TABLE registry.org_relation IS 'Graph edge between org units. foundation entity.';


-- FUNCTIONAL LAYER
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.function_group
CREATE TABLE registry.function_group (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.function_group IS 'Grouping of functions (Domain). foundation entity.';

-- Table: registry.function
CREATE TABLE registry.function (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    function_group_id uuid REFERENCES registry.function_group(id) ON DELETE RESTRICT
);
COMMENT ON TABLE registry.function IS 'Atomic business function. foundation entity.';


-- POSITION / WORK MODEL
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.position
CREATE TABLE registry.position (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    org_unit_id uuid REFERENCES registry.org_unit(id) ON DELETE RESTRICT
);
COMMENT ON TABLE registry.position IS 'Defined open slot or seat in an org unit. foundation entity.';

-- Table: registry.appointment
CREATE TABLE registry.appointment (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    position_id uuid NOT NULL REFERENCES registry.position(id) ON DELETE RESTRICT,
    employee_id uuid NOT NULL REFERENCES registry.employee(id) ON DELETE RESTRICT,
    start_date timestamptz,
    end_date timestamptz
);
COMMENT ON TABLE registry.appointment IS 'Assignment of an employee to a position. foundation entity.';


-- STATUS & QUALIFICATION
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.status
CREATE TABLE registry.status (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.status IS 'Strategic status of an actor. foundation entity.';

-- Table: registry.status_rule
CREATE TABLE registry.status_rule (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.status_rule IS 'Rules defining status transitions. foundation entity.';

-- Table: registry.qualification
CREATE TABLE registry.qualification (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.qualification IS 'Area of expertise / competency. foundation entity.';

-- Table: registry.qualification_level
CREATE TABLE registry.qualification_level (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    qualification_id uuid REFERENCES registry.qualification(id) ON DELETE RESTRICT,
    level_order int -- numeric representations of proficiency
);
COMMENT ON TABLE registry.qualification_level IS 'Levels within a qualification (e.g. Junior, Senior). foundation entity.';


-- VALUE / CPK
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.cpk (Valuable Final Product)
CREATE TABLE registry.cpk (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.cpk IS 'Valuable Final Product definition. foundation entity.';

-- Table: registry.cpk_hierarchy
CREATE TABLE registry.cpk_hierarchy (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    parent_cpk_id uuid NOT NULL REFERENCES registry.cpk(id) ON DELETE RESTRICT,
    child_cpk_id uuid NOT NULL REFERENCES registry.cpk(id) ON DELETE RESTRICT
);
COMMENT ON TABLE registry.cpk_hierarchy IS 'Structural relationship between products. foundation entity.';

-- Table: registry.cpk_owner
CREATE TABLE registry.cpk_owner (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    cpk_id uuid NOT NULL REFERENCES registry.cpk(id) ON DELETE RESTRICT,
    owner_position_id uuid REFERENCES registry.position(id) ON DELETE RESTRICT
);
COMMENT ON TABLE registry.cpk_owner IS 'Ownership mapping of CPK to a position. foundation entity.';


-- TASK & OPERATIONS
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.task_type
CREATE TABLE registry.task_type (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.task_type IS 'Classification of tasks. foundation entity.';

-- Table: registry.task_state
CREATE TABLE registry.task_state (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.task_state IS 'Possible states for a task. foundation entity.';

-- Table: registry.workflow
CREATE TABLE registry.workflow (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.workflow IS 'Defined sequence of operations. foundation entity.';


-- ECONOMY
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.value_token
CREATE TABLE registry.value_token (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.value_token IS 'Currency or token type. foundation entity.';

-- Table: registry.reward_rule
CREATE TABLE registry.reward_rule (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.reward_rule IS 'Rule for calculating rewards. foundation entity.';

-- Table: registry.penalty_rule
CREATE TABLE registry.penalty_rule (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.penalty_rule IS 'Rule for calculating penalties. foundation entity.';


-- KNOWLEDGE & UNIVERSITY
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.faculty
CREATE TABLE registry.faculty (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.faculty IS 'University faculty. foundation entity.';

-- Table: registry.program
CREATE TABLE registry.program (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    faculty_id uuid REFERENCES registry.faculty(id) ON DELETE RESTRICT
);
COMMENT ON TABLE registry.program IS 'Educational program. foundation entity.';

-- Table: registry.course
CREATE TABLE registry.course (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    program_id uuid REFERENCES registry.program(id) ON DELETE RESTRICT
);
COMMENT ON TABLE registry.course IS 'Educational course. foundation entity.';

-- Table: registry.knowledge_unit
CREATE TABLE registry.knowledge_unit (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    course_id uuid REFERENCES registry.course(id) ON DELETE RESTRICT
);
COMMENT ON TABLE registry.knowledge_unit IS 'Atomic unit of knowledge. foundation entity.';

-- Table: registry.expert
CREATE TABLE registry.expert (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry',
    
    person_id uuid REFERENCES registry.person(id) ON DELETE RESTRICT
);
COMMENT ON TABLE registry.expert IS 'Recognized domain expert. foundation entity.';

-- Table: registry.methodology
CREATE TABLE registry.methodology (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.methodology IS 'Standardized way of doing things. foundation entity.';

-- Table: registry.research_artifact
CREATE TABLE registry.research_artifact (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.research_artifact IS 'Output of research activities. foundation entity.';


-- CONTENT & ARCHIVE
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.content_item
CREATE TABLE registry.content_item (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.content_item IS 'General content entity registry. foundation entity.';

-- Table: registry.tag
CREATE TABLE registry.tag (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.tag IS 'Categorization tag. foundation entity.';


-- INTEGRATION
-- ---------------------------------------------------------------------------------------------------------
-- Table: registry.integration
CREATE TABLE registry.integration (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.integration IS 'External system configuration. foundation entity.';

-- Table: registry.webhook
CREATE TABLE registry.webhook (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.webhook IS 'Webhook definition. foundation entity.';

-- Table: registry.data_import
CREATE TABLE registry.data_import (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    source text NOT NULL DEFAULT 'registry'
);
COMMENT ON TABLE registry.data_import IS 'Import definition or profile. foundation entity.';
