import { UUID } from '../common/common.types';
export declare class CourseResponseDto {
    id: UUID;
    title: string;
    description: string;
    category: string;
    durationMinutes: number;
    level: string;
    thumbnailUrl?: string;
    rating: number;
}
export declare class QuizGenerationRequestDto {
    topic: string;
    difficulty: string;
    questionCount: number;
}
export declare class QuizAnswerDto {
    questionId: string;
    selectedOptionId: string;
}
export declare class SubmitQuizRequestDto {
    quizId: UUID;
    answers: QuizAnswerDto[];
}
export declare class QuizResultResponseDto {
    quizId: UUID;
    score: number;
    passed: boolean;
    correctAnswers: string[];
    mcReward?: number;
}
//# sourceMappingURL=education.dto.d.ts.map