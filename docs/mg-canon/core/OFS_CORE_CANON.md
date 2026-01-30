# OFS CORE CANON (Organizational & Functional Structure)

> [!WARNING]
> **ACCESS LEVEL: FROZEN**
> This core module maps the physical and logical reality of the organization.
> Modifications require HR & Architect approval.

## 1. Core Responsibility
OFS is responsible for:
- **OrgUnit Hierarchy**: Strict parent-child tree (Department -> Department).
- **Functional Matrix**: Mapping responsibilities to Departments.
- **Role Binding**: `Employee` - `Department` - `Position` linkage.
- **Reporting Lines**: Direct supervisors and functional managers.

## 2. Canonical Data Model
- **Department**: Single node in the hierarchy. Must have `parent_id` (except Root).
- **Employee**: Links `User` identity to `Department`.
- **Position**: Normalized list of job titles.
- **RoleCompetencyMatrix**: Defines Requirements/Permissions for a specific Role in a Department.

## 3. Structural Rules
1. **Single Head**: A Department must have exactly one Head (except temporary vacancy).
2. **Hierarchy Integrity**: No circular dependencies in Dept tree.
3. **Inheritance**: Access rights flow down the tree (Head sees Sub-Dept data).

## 4. Forbidden Modifications
1. ❌ **Do NOT** introduce "Matrix Structure" (multiple parents) on the *Department* level. Use `Project` or `TriangleAssignment` for cross-functional teams.
2. ❌ **Do NOT** delete Departments with active Employees or historical records. Use `is_active=false`.
3. ❌ **Do NOT** allow `Employee` creation without `Department` assignment (except generic pool).

## 5. Extension Points
- **Adpaters**: Integrate with payroll or ERP via `Employee.employee_number`.
- **Metadata**: `Department.functions` and `Department.kpis` (JSON) are open for domain-specific logic.
