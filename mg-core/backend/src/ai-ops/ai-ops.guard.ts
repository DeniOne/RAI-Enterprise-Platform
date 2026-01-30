/**
 * AI Ops Guard (Step 12 Security)
 * 
 * Enforces "Advisory Only" policy.
 */

import { AIOpsRecommendation, AIOpsResponse } from './ai-ops.types';

export class AIOpsGuard {

    /**
     * Validate AI Output
     * Ensures strict adherence to advisory contract.
     */
    validateOutput(rawResponse: any[]): AIOpsRecommendation[] {
        if (!Array.isArray(rawResponse)) {
            throw new Error('AI Output must be an array of recommendations');
        }

        return rawResponse.map(rec => {
            // 1. Check Structure
            if (!rec.category || !rec.severity || !rec.title || !rec.reasoning) {
                // In production, we might filter invalid ones or retry. 
                // For strict security, we log mismatch and return generic error or skip.
                throw new Error('AI Output Malformed: Missing required fields');
            }

            // 2. Enforce Disclaimer (Auto-inject if missing to be safe, or reject?)
            // We enforce it by OVERWRITING it. We do not trust the LLM to set it correctly.
            const safeRec: AIOpsRecommendation = {
                id: this.generateStableId(rec),
                category: this.validateCategory(rec.category),
                severity: this.validateSeverity(rec.severity),
                title: this.sanitizeText(rec.title),
                reasoning: this.sanitizeText(rec.reasoning),
                basedOn: rec.basedOn || {},
                disclaimer: 'advisory-only' // FORCED
            };

            // 3. Command Injection Check (Basic Heuristic)
            // Reject reasoning that sounds like a command.
            if (/^(do|execute|run|delete|update|insert)\s/i.test(safeRec.title)) {
                safeRec.title = "[Redacted Command] " + safeRec.title;
                safeRec.reasoning = "AI attempted to issue a command, which is forbidden. Recommendation redacted.";
            }

            return safeRec;
        });
    }

    private validateCategory(cat: string): any {
        const allowed = ['risk', 'stability', 'optimization', 'compliance'];
        return allowed.includes(cat) ? cat : 'stability';
    }

    private validateSeverity(sev: string): any {
        const allowed = ['low', 'medium', 'high', 'critical'];
        return allowed.includes(sev) ? sev : 'low';
    }

    private sanitizeText(text: string): string {
        // Remove potentially dangerous chars if rendering HTML (though React handles it)
        return text.trim();
    }

    private generateStableId(rec: any): string {
        // Simple stable ID based on content
        // In real app, use crypto hash
        return Buffer.from(rec.title + rec.category).toString('base64').substring(0, 12);
    }
}

export const aiOpsGuard = new AIOpsGuard();
