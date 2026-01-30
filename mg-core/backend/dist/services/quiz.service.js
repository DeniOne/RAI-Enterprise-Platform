"use strict";
/**
 * Quiz Service
 * handles quiz attempts, scoring, and integration with qualification engine
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizService = exports.QuizService = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const anti_fraud_engine_1 = require("../engines/anti-fraud.engine");
class QuizService {
    /**
     * Get quiz by material ID
     */
    async getQuiz(materialId) {
        const quiz = await prisma_1.prisma.quiz.findFirst({
            where: {
                material_id: materialId,
                is_active: true
            },
            include: {
                questions: {
                    include: {
                        options: {
                            select: {
                                id: true,
                                text: true
                                // is_correct is excluded for security
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            },
            orderBy: {
                version: 'desc'
            }
        });
        if (!quiz) {
            throw new Error('Active quiz not found for this material');
        }
        return quiz;
    }
    /**
     * Submit a quiz attempt
     *
     * ALGORITHM:
     * - SINGLE: 100% if correct, 0% otherwise
     * - MULTIPLE: (correct_selected / total_correct) - (incorrect_selected / total_incorrect), min 0
     */
    async submitAttempt(params) {
        const { userId, quizId, enrollmentId, answers, ipAddress, userAgent } = params;
        // 1. Fetch Quiz with correct answers
        const quiz = await prisma_1.prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: {
                    include: {
                        options: true
                    }
                }
            }
        });
        if (!quiz)
            throw new Error('Quiz not found');
        // 2. Anti-fraud: Cooldown check (60 seconds)
        const lastAttempt = await prisma_1.prisma.quizAttempt.findFirst({
            where: { user_id: userId, quiz_id: quizId },
            orderBy: { started_at: 'desc' }
        });
        if (lastAttempt && lastAttempt.finished_at) {
            const now = new Date();
            const elapsed = (now.getTime() - lastAttempt.finished_at.getTime()) / 1000;
            if (elapsed < 60) {
                throw new Error(`Please wait ${Math.ceil(60 - elapsed)} seconds before next attempt (anti-fraud cooldown)`);
            }
        }
        let totalPoints = 0;
        let maxPossiblePoints = 0;
        const processedAnswers = [];
        // 3. Scoring
        for (const question of quiz.questions) {
            const userAnswer = answers.find(a => a.questionId === question.id);
            const selected = userAnswer?.selectedOptions || [];
            const correctOptions = question.options.filter(o => o.is_correct);
            const incorrectOptions = question.options.filter(o => !o.is_correct);
            let earnedPoints = 0;
            const weight = question.base_weight;
            maxPossiblePoints += weight;
            if (question.type === 'SINGLE') {
                const isCorrect = selected.length === 1 && correctOptions.some(o => o.id === selected[0]);
                earnedPoints = isCorrect ? weight : 0;
            }
            else if (question.type === 'MULTIPLE') {
                const correctSelected = selected.filter(id => correctOptions.some(o => o.id === id)).length;
                const incorrectSelected = selected.filter(id => incorrectOptions.some(o => o.id === id)).length;
                const correctRatio = correctOptions.length > 0 ? correctSelected / correctOptions.length : 0;
                const incorrectRatio = incorrectOptions.length > 0 ? incorrectSelected / incorrectOptions.length : 0;
                earnedPoints = Math.max(0, (correctRatio - incorrectRatio) * weight);
            }
            processedAnswers.push({
                question_id: question.id,
                selected_options: selected,
                is_correct: earnedPoints === weight,
                earned_points: earnedPoints
            });
            totalPoints += earnedPoints;
        }
        const scorePercent = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;
        const passed = scorePercent >= quiz.pass_score;
        // 4. Persistence
        const attempt = await prisma_1.prisma.quizAttempt.create({
            data: {
                user_id: userId,
                quiz_id: quizId,
                enrollment_id: enrollmentId,
                raw_score: totalPoints,
                max_score: maxPossiblePoints,
                passed,
                attempt_number: (lastAttempt?.attempt_number || 0) + 1,
                ip_address: ipAddress,
                user_agent: userAgent,
                finished_at: new Date(),
                answers: {
                    create: processedAnswers
                }
            }
        });
        // 5. Integration: Qualification Engine Coupling
        const universityEvent = await prisma_1.prisma.event.create({
            data: {
                type: 'QUIZ_COMPLETED',
                source: 'quiz_service',
                subject_id: userId,
                subject_type: 'user',
                payload: {
                    quizId: quiz.id,
                    quizTitle: quiz.title,
                    score: scorePercent,
                    passed,
                    mode: quiz.mode,
                    attemptId: attempt.id,
                    maxPossiblePoints,
                    rawScore: totalPoints,
                    ipAddress,
                    userAgent,
                    questionCount: quiz.questions.length,
                    durationSeconds: (lastAttempt && lastAttempt.finished_at) ? (new Date().getTime() - lastAttempt.finished_at.getTime()) / 1000 : 60 // fallback
                }
            }
        });
        // 6. Anti-Fraud Analyzer (Passive subscriber)
        // Fire and forget (simulated async)
        anti_fraud_engine_1.antiFraudEngine.analyzeEvent(universityEvent.id).catch(err => logger_1.logger.error('[QuizService] AntiFraud analysis failed', { eventId: universityEvent.id, error: err }));
        // 7. Progress Decoupling
        if (quiz.mode === 'REQUIRED' && passed && enrollmentId) {
            const { enrollmentService } = await Promise.resolve().then(() => __importStar(require('./enrollment.service')));
            const material = await prisma_1.prisma.material.findUnique({
                where: { id: quiz.material_id },
                include: { course_modules: true }
            });
            if (material?.course_modules[0]) {
                await enrollmentService.updateModuleProgress(enrollmentId, material.course_modules[0].id, 'COMPLETED', Math.round(scorePercent));
            }
        }
        return {
            attemptId: attempt.id,
            score: scorePercent,
            passed,
            mode: quiz.mode
        };
    }
}
exports.QuizService = QuizService;
exports.quizService = new QuizService();
