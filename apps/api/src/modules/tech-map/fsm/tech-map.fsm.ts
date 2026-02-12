import { Injectable, ForbiddenException } from '@nestjs/common';
import { TechMapStatus, UserRole } from '@rai/prisma-client';

export interface TransitionRequest {
    currentStatus: TechMapStatus;
    targetStatus: TechMapStatus;
    userRole: UserRole;
    userId: string;
}

@Injectable()
export class TechMapStateMachine {

    canTransition(req: TransitionRequest): boolean {
        const { currentStatus, targetStatus, userRole } = req;

        switch (currentStatus) {
            case TechMapStatus.DRAFT:
                if (targetStatus === TechMapStatus.REVIEW) {
                    return true;
                }
                break;

            case TechMapStatus.REVIEW:
                if (targetStatus === TechMapStatus.DRAFT) {
                    return true;
                }
                if (targetStatus === TechMapStatus.APPROVED) {
                    return TechMapStateMachine.isPrivileged(userRole);
                }
                break;

            case TechMapStatus.APPROVED:
                if (targetStatus === TechMapStatus.ACTIVE) {
                    return TechMapStateMachine.isStrategic(userRole);
                }
                if (targetStatus === TechMapStatus.DRAFT) {
                    return TechMapStateMachine.isOperational(userRole);
                }
                break;

            case TechMapStatus.ACTIVE:
                if (targetStatus === TechMapStatus.ARCHIVED) {
                    return TechMapStateMachine.isStrategic(userRole);
                }
                break;

            default:
                return false;
        }

        return false;
    }

    private static isPrivileged(role: UserRole): boolean {
        return ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.AGRONOMIST] as UserRole[]).includes(role);
    }

    private static isStrategic(role: UserRole): boolean {
        return ([UserRole.ADMIN, UserRole.CEO] as UserRole[]).includes(role);
    }

    private static isOperational(role: UserRole): boolean {
        return ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER] as UserRole[]).includes(role);
    }

    validate(req: TransitionRequest): void {
        if (!this.canTransition(req)) {
            throw new ForbiddenException(
                `Illegal State Transition: ${req.currentStatus} -> ${req.targetStatus} for role ${req.userRole}`
            );
        }
    }
}
