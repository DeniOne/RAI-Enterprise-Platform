import { VisibilityRule } from './registry-visibility.rules';

export class RegistryRuleValidator {

    /**
     * Validates the visibility rules artifact on startup.
     * FAILS CLOSED: Throws an error if ANY rule is invalid.
     */
    validateRules(rules: VisibilityRule[]): void {
        const errors: string[] = [];

        rules.forEach((rule, index) => {
            // 1. Validate Regex Pattern
            try {
                if (!rule.targetPattern) throw new Error('Missing targetPattern');
                // Check if it creates a valid regex (we use simplified glob-like syntax in engine, but it must be compile-able)
                // The engine converts `*` to `.*` and wraps in `^$`.
                const regexString = '^' + rule.targetPattern.replace('*', '.*') + '$';
                new RegExp(regexString);
            } catch (e: any) {
                errors.push(`Rule #${index} (target: ${rule.targetPattern}): Invalid Pattern - ${e.message}`);
            }

            // 2. Validate Scope
            const validScopes = ['ENTITY', 'ATTRIBUTE', 'RELATIONSHIP', 'VIEW'];
            if (!validScopes.includes(rule.scope)) {
                errors.push(`Rule #${index}: Invalid Scope '${rule.scope}'. Must be one of ${validScopes.join(', ')}`);
            }

            // 3. Validate Effect
            if (rule.effect !== 'EXCLUDE' && rule.effect !== 'INCLUDE') {
                errors.push(`Rule #${index}: Invalid Effect '${rule.effect}'. Must be 'INCLUDE' or 'EXCLUDE'`);
            }
        });

        if (errors.length > 0) {
            const msg = `CRITICAL: Registry Visibility Rules are invalid. System cannot start safely.\n${errors.join('\n')}`;
            console.error(msg);
            throw new Error(msg); // Hard Stop
        }

        console.log(`Registry Visibility Rules validated (${rules.length} rules).`);
    }
}

export const registryRuleValidator = new RegistryRuleValidator();
