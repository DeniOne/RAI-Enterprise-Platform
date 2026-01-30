/**
 * Production Session DTO
 * 
 * UI-friendly representation of PSEE session data.
 * Read-only, no business logic.
 */

export type SlaLevel = 'OK' | 'WARNING' | 'BREACH';

export interface ProductionSessionDto {
    /** Session ID (UUID) */
    id: string;
    
    /** Current session status */
    status: string;
    
    /** Current responsible role */
    role: string;
    
    /** Assigned user name (if any) */
    assignedUser?: string;
    
    /** Time spent in current status (seconds) */
    timeInStatusSec: number;
    
    /** SLA status indicator */
    slaLevel: SlaLevel;
    
    /** Session creation timestamp (ISO string) */
    createdAt: string;
    
    /** Last event timestamp (ISO string) */
    lastEventAt: string;
}

export interface ProductionSessionsResponse {
    data: ProductionSessionDto[];
    total: number;
}
