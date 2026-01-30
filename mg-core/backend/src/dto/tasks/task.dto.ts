/**
 * Task DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsEnum,
    IsOptional,
    IsDateString,
    IsArray,
    IsNumber,
    MinLength,
    MaxLength,
    Min,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '../common/common.enums';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * Create task request
 */
export class CreateTaskRequestDto {
    @IsString()
    @MinLength(3)
    @MaxLength(200)
    title: string;

    @IsString()
    @MinLength(10)
    @MaxLength(5000)
    description: string;

    @IsOptional()
    @IsUUID()
    assigneeId?: UUID;

    @IsOptional()
    @IsUUID()
    departmentId?: UUID;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsDateString()
    dueDate?: ISODateTime;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}

/**
 * NLP task creation request (natural language)
 */
export class NLPTaskRequestDto {
    @IsString()
    @MinLength(10)
    @MaxLength(1000)
    text: string;
}

/**
 * Update task request
 */
export class UpdateTaskRequestDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(200)
    title?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(5000)
    description?: string;

    @IsOptional()
    @IsUUID()
    assigneeId?: UUID;

    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsDateString()
    dueDate?: ISODateTime;
}

/**
 * Task response
 */
export class TaskResponseDto {
    @IsUUID()
    id: UUID;

    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsEnum(TaskStatus)
    status: TaskStatus;

    @IsEnum(TaskPriority)
    priority: TaskPriority;

    @IsOptional()
    @IsUUID()
    creatorId?: UUID;

    @IsOptional()
    @IsUUID()
    assigneeId?: UUID;

    @IsOptional()
    @IsUUID()
    departmentId?: UUID;

    @IsOptional()
    @IsDateString()
    dueDate?: ISODateTime;

    @IsOptional()
    @IsDateString()
    completedAt?: ISODateTime;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    mcReward?: number;

    @IsDateString()
    createdAt: ISODateTime;

    @IsDateString()
    updatedAt: ISODateTime;
}

/**
 * Assign task request
 */
export class AssignTaskRequestDto {
    @IsUUID()
    assigneeId: UUID;
}

/**
 * Task comment request
 */
export class TaskCommentRequestDto {
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    text: string;
}

/**
 * Task comment response
 */
export class TaskCommentResponseDto {
    @IsUUID()
    id: UUID;

    @IsUUID()
    taskId: UUID;

    @IsUUID()
    userId: UUID;

    @IsString()
    text: string;

    @IsDateString()
    createdAt: ISODateTime;
}

/**
 * Task filters for queries
 */
export class TaskFiltersDto {
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @IsOptional()
    @IsUUID()
    assigneeId?: UUID;

    @IsOptional()
    @IsUUID()
    departmentId?: UUID;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsDateString()
    dueDateFrom?: ISODateTime;

    @IsOptional()
    @IsDateString()
    dueDateTo?: ISODateTime;

    @IsOptional()
    @IsString()
    search?: string;
}
