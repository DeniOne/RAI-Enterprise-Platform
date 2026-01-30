import { TaskStatus, TaskPriority } from '../common/common.enums';
import { UUID, ISODateTime } from '../common/common.types';
export declare class CreateTaskRequestDto {
    title: string;
    description: string;
    assigneeId?: UUID;
    departmentId?: UUID;
    priority?: TaskPriority;
    dueDate?: ISODateTime;
    tags?: string[];
}
export declare class NLPTaskRequestDto {
    text: string;
}
export declare class UpdateTaskRequestDto {
    title?: string;
    description?: string;
    assigneeId?: UUID;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: ISODateTime;
}
export declare class TaskResponseDto {
    id: UUID;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    creatorId?: UUID;
    assigneeId?: UUID;
    departmentId?: UUID;
    dueDate?: ISODateTime;
    completedAt?: ISODateTime;
    tags?: string[];
    mcReward?: number;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
export declare class AssignTaskRequestDto {
    assigneeId: UUID;
}
export declare class TaskCommentRequestDto {
    text: string;
}
export declare class TaskCommentResponseDto {
    id: UUID;
    taskId: UUID;
    userId: UUID;
    text: string;
    createdAt: ISODateTime;
}
export declare class TaskFiltersDto {
    status?: TaskStatus;
    assigneeId?: UUID;
    departmentId?: UUID;
    priority?: TaskPriority;
    dueDateFrom?: ISODateTime;
    dueDateTo?: ISODateTime;
    search?: string;
}
//# sourceMappingURL=task.dto.d.ts.map