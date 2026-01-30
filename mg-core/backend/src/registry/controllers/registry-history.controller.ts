import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';

export class RegistryHistoryController {

    /**
     * GET /api/registry/entities/:urn/history
     * Returns ordered list of Audit Events (Append-only Log).
     */
    async getHistory(req: Request, res: Response) {
        try {
            const { urn } = req.params;

            const events = await prisma.registryAuditEvent.findMany({
                where: { entity_urn: urn },
                orderBy: { created_at: 'desc' }
            });

            res.json(events);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/registry/entities/:urn/snapshots/:snapshotId
     * Returns Immutable Projection at Point-in-Time.
     * 
     * NOTE: Since we don't have a dedicated Snapshots table, 
     * 'snapshotId' is effectively an AuditEventId or a Logical Version.
     * We attempt to return the state AS captured in that event (if payload has it),
     * OR we return 404/501 if deep reconstruction is not feasible without Event Sourcing.
     * 
     * For STEP 13 MVP: We assume the Audit Event Payload determines the 'Snapshot' view.
     */
    async getSnapshot(req: Request, res: Response) {
        try {
            const { urn, snapshotId } = req.params;

            // 1. Fetch the specific event acting as the 'Snapshot Anchor'
            const event = await prisma.registryAuditEvent.findUnique({
                where: { id: snapshotId }
            });

            if (!event || event.entity_urn !== urn) {
                res.status(404).json({ message: 'Snapshot not found' });
                return;
            }

            // 2. Server-Side Projection Construction
            // In a real Event Sourced system, we would replay up to this event.
            // Here, we check if the event payload contains the state (e.g. 'previous_state' or 'new_state').
            // If not, we might only be able to show "Change Details".

            // However, the Requirement is "Full read-only entity card at T".
            // If data is missing, we must fail gracefully or approximate.

            // Fallback for MVP: 
            // If payload has 'state', use it.
            // If NOT, we return the CURRENT state but marked as "Warning: Reconstruction Incomplete" 
            // (Strictly speaking, this violates "Immutable", so better to return 501 if we can't do it).

            // Let's assume critical snapshot events DO have state in payload.
            const payload = event.payload as any;
            const snapshotState = payload?.new_state || payload?.state || payload?.attributes;

            if (!snapshotState) {
                // Return just the event details if full state unavailable
                res.status(200).json({
                    meta: { type: 'PARTIAL_SNAPSHOT', event_id: event.id, timestamp: event.created_at },
                    data: payload // Best effort
                });
                return;
            }

            res.json({
                meta: { type: 'FULL_SNAPSHOT', event_id: event.id, timestamp: event.created_at },
                data: snapshotState
            });

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export const registryHistoryController = new RegistryHistoryController();
