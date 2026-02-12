import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
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
                // DRAFT -> REVIEW
                if (targetStatus === TechMapStatus.REVIEW) {
                    return true; // Anyone receiving the task can send for review? Or specific roles? 
                    // Let's say anyone who can edit (Agronomist/Manager)
                }
                break;

            case TechMapStatus.REVIEW:
                // REVIEW -> DRAFT (Reject)
                if (targetStatus === TechMapStatus.DRAFT) {
                    return true;
                }
                // REVIEW -> APPROVED (Approve)
                if (targetStatus === TechMapStatus.APPROVED) {
                    // Only Admin or Chief Agronomist (Manager?)
                    return this.hasApprovalRights(userRole);
                }
                break;

            case TechMapStatus.APPROVED:
                // APPROVED -> ACTIVE (Activate Production Gate)
                if (targetStatus === TechMapStatus.ACTIVE) {
                    // Only High Command
                    return this.hasActivationRights(userRole);
                }
                // APPROVED -> DRAFT (Reopen)
                if (targetStatus === TechMapStatus.DRAFT) {
                    return this.hasApprovalRights(userRole);
                }
                break;

            case TechMapStatus.ACTIVE:
                // ACTIVE -> ARCHIVED
                if (targetStatus === TechMapStatus.ARCHIVED) {
                    return this.hasActivationRights(userRole);
                }
                break;

            default:
                return false;
        }

        return false;
    }

    private hasApprovalRights(role: UserRole): boolean {
        return ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.AGRONOMIST] as UserRole[]).includes(role);
    }

    private hasActivationRights(role: UserRole): boolean {
        return ([UserRole.ADMIN, UserRole.CEO] as UserRole[]).includes(role);
    }

    validate(req: TransitionRequest): void {
        if (!this.canTransition(req)) {
            throw new ForbiddenException(
                `Illegal State Transition: ${req.currentStatus} -> ${req.targetStatus} for role ${req.userRole}`
            );
        }
    }
}
