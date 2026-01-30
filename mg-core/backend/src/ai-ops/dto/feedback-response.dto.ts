/**
 * PHASE 4.5 - AI Feedback Loop
 * DTO: Feedback Response
 */

import { FeedbackType } from './submit-feedback.dto';

export class FeedbackResponseDto {
  id: string;
  recommendationId: string;
  feedbackType: FeedbackType;
  timestamp: string;
  message?: string;
}
