/**
 * TenantScope - Immutable value object representing a verified tenant context.
 * 10/10 Zero Trust Tenant Isolation (Phase 3)
 */
export class TenantScope {
    public readonly companyId: string;
    public readonly isSystem: boolean;

    constructor(companyId: string, isSystem: boolean = false) {
        if (!companyId || companyId.trim() === '') {
            throw new Error('TENANT_SCOPE_ERROR: companyId cannot be empty.');
        }
        this.companyId = companyId;
        this.isSystem = isSystem;
        Object.freeze(this);
    }

    /**
     * Factory method to create a system-wide scope.
     */
    public static system(): TenantScope {
        return new TenantScope('SYSTEM', true);
    }

    /**
     * Validates if the current scope has access to a target company.
     */
    public canAccess(targetCompanyId: string): boolean {
        if (this.isSystem) return true;
        return this.companyId === targetCompanyId;
    }

    public toJSON() {
        return {
            companyId: this.companyId,
            isSystem: this.isSystem,
        };
    }
}
