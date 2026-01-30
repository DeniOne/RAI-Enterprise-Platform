/**
 * GENERATED CONTRACT TYPES — DO NOT MODIFY
 * Source: documentation/ai/mg-chat/*.json
 * 
 * These types represent the canonical MG Chat conversational contracts.
 * Any modification must be done in the source JSON files and validated by lint.
 */

// =============================================================================
// INTENT MAP TYPES
// =============================================================================

export interface MGIntentPrinciples {
    ai_role: 'advisory_only';
    no_auto_actions: true;
    human_confirmation_required: true;
    one_screen_response?: boolean;
    max_cta_buttons?: number;
}

export interface MGIntentResponse {
    type: 'summary' | 'list' | 'details' | 'confirmation' | 'choice' | 'input' | 'info' | 'explanation' | 'support' | 'action';
    data_sources?: string[];
    template: string;
    actions?: string[];
}

export interface MGIntent {
    id: string;
    category: 'navigation' | 'tasks' | 'support' | 'shifts' | 'motivation' | 'analytics' | 'emotional' | 'utility';
    examples?: string[];
    requires_context?: string[];
    confirmation_required?: boolean;
    response: MGIntentResponse;
}

export interface MGIntentMap {
    version: string;
    agent: 'MatrixGinChat';
    language: 'ru' | 'en';
    principles: MGIntentPrinciples;
    intents: MGIntent[];
}

// =============================================================================
// UX COMPONENTS MAP TYPES
// =============================================================================

export interface MGRenderRules {
    max_buttons_per_row: number;
    max_rows: number;
    use_inline_keyboard: boolean;
    use_reply_keyboard: boolean;
    confirmation_required_for: ('danger' | 'state_change')[];
}

export interface MGButton {
    text: string;
    action_id: string;
    style?: 'primary' | 'danger' | 'default';
}

export interface MGComponent {
    type: 'inline_keyboard' | 'reply_keyboard';
    layout: MGButton[][];
}

export interface MGUxComponentMap {
    version: string;
    platform: 'telegram';
    render_rules: MGRenderRules;
    components: Record<string, MGComponent>;
}

// =============================================================================
// ERROR UX MAP TYPES
// =============================================================================

export interface MGErrorPrinciples {
    no_shaming: true;
    no_moralizing: true;
    de_escalation_first: true;
    always_offer_exit: true;
    never_block_user: true;
}

export interface MGErrorResponse {
    text: string;
    actions?: string[];
}

export interface MGErrorIntent {
    id: string;
    trigger: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    response: MGErrorResponse;
}

export interface MGErrorUxMap {
    version: string;
    agent: 'MatrixGinChat';
    platform: 'telegram';
    principles: MGErrorPrinciples;
    error_intents: MGErrorIntent[];
}

// =============================================================================
// COMBINED CONTRACTS
// =============================================================================

export interface MGChatContracts {
    readonly intents: MGIntentMap;
    readonly ux: MGUxComponentMap;
    readonly errors: MGErrorUxMap;
}
