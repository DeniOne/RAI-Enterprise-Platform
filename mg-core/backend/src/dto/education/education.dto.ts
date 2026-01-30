/**
 * Education DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsNumber,
    IsArray,
    IsBoolean,
    ValidateNested,
    IsInt,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UUID } from '../common/common.types';

/**
 * Course Response
 */
export class CourseResponseDto {
    @IsUUID()
    id: UUID;

    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsString()
    category: string;

    @IsNumber()
    durationMinutes: number;

    @IsString()
    level: string;

    @IsOptional()
    @IsString()
    thumbnailUrl?: string;

    @IsNumber()
    rating: number;
}

/**
 * Quiz Generation Request
 */
export class QuizGenerationRequestDto {
    @IsString()
    topic: string;

    @IsString()
    difficulty: string;

    @IsInt()
    @Min(1)
    questionCount: number;
}

/**
 * Quiz Answer
 */
export class QuizAnswerDto {
    @IsString()
    questionId: string;

    @IsString()
    selectedOptionId: string;
}

/**
 * Submit Quiz Request
 */
export class SubmitQuizRequestDto {
    @IsUUID()
    quizId: UUID;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuizAnswerDto)
    answers: QuizAnswerDto[];
}

/**
 * Quiz Result Response
 */
export class QuizResultResponseDto {
    @IsUUID()
    quizId: UUID;

    @IsNumber()
    score: number;

    @IsBoolean()
    passed: boolean;

    @IsArray()
    @IsString({ each: true })
    correctAnswers: string[];

    @IsOptional()
    @IsNumber()
    mcReward?: number;
}
