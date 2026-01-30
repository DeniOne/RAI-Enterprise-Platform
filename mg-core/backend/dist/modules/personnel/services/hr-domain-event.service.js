"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HRDomainEventService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const hr_event_validator_1 = require("../domain/hr-event-validator");
let HRDomainEventService = class HRDomainEventService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Emit HR domain event (append-only)
     * CRITICAL: Validates actor role before emission
     */
    async emit(params) {
        const { eventType, aggregateType, aggregateId, actorId, actorRole, payload, previousState, newState, legalBasis, } = params;
        // CRITICAL: Validate actor role
        (0, hr_event_validator_1.validateActorRole)(eventType, actorRole);
        // Emit event (INSERT-only, immutable)
        await this.prisma.hRDomainEvent.create({
            data: {
                eventType,
                aggregateType,
                aggregateId,
                actorId,
                actorRole,
                payload,
                previousState,
                newState,
                legalBasis,
            },
        });
    }
    /**
     * Get all events for an aggregate (for audit)
     */
    async getEventsByAggregate(aggregateId, aggregateType) {
        return this.prisma.hRDomainEvent.findMany({
            where: {
                aggregateId,
                ...(aggregateType && { aggregateType }),
            },
            orderBy: { occurredAt: 'asc' },
        });
    }
    /**
     * Replay events to reconstruct aggregate state
     * CRITICAL: READ-ONLY operation, NO side-effects, NO mutations
     * Used ONLY for audit and state verification
     *
     * @returns Immutable event log (chronological order)
     */
    async replayEvents(aggregateId) {
        const events = await this.getEventsByAggregate(aggregateId);
        // CRITICAL: Return read-only event log
        // This method MUST NOT trigger any writes or side-effects
        return Object.freeze(events.map(event => Object.freeze({
            timestamp: event.occurredAt,
            type: event.eventType,
            actor: event.actorId,
            role: event.actorRole,
            payload: event.payload,
            legalBasis: event.legalBasis,
        })));
    }
};
exports.HRDomainEventService = HRDomainEventService;
exports.HRDomainEventService = HRDomainEventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], HRDomainEventService);
