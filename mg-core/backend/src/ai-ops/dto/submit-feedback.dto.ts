/**
 * PHASE 4.5 - AI Feedback Loop
 * DTO: Submit Feedback Request
 */

import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';

export enum FeedbackType {
  HELPFUL = 'HELPFUL',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  UNSURE = 'UNSURE',
}

export class SubmitFeedbackDto {
  @IsString()
  @IsNotEmpty()
  recommendationId: string;

  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Comment must not exceed 500 characters' })
  comment?: string;

  // PHASE 4.5 - Context Binding (P45-PR-03)
  @IsOptional()
  @IsString()
  basedOnSnapshotId?: string;

  @IsOptional()
  @IsString()
  aiVersion?: string;

  @IsOptional()
  @IsString()
  ruleSetVersion?: string;
}
