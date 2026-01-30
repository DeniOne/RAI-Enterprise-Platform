"use strict";
/**
 * PHASE 4.5 - AI Feedback Loop
 * DTO: Submit Feedback Request
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitFeedbackDto = exports.FeedbackType = void 0;
const class_validator_1 = require("class-validator");
var FeedbackType;
(function (FeedbackType) {
    FeedbackType["HELPFUL"] = "HELPFUL";
    FeedbackType["NOT_APPLICABLE"] = "NOT_APPLICABLE";
    FeedbackType["UNSURE"] = "UNSURE";
})(FeedbackType || (exports.FeedbackType = FeedbackType = {}));
class SubmitFeedbackDto {
    recommendationId;
    feedbackType;
    comment;
    // PHASE 4.5 - Context Binding (P45-PR-03)
    basedOnSnapshotId;
    aiVersion;
    ruleSetVersion;
}
exports.SubmitFeedbackDto = SubmitFeedbackDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmitFeedbackDto.prototype, "recommendationId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(FeedbackType),
    __metadata("design:type", String)
], SubmitFeedbackDto.prototype, "feedbackType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Comment must not exceed 500 characters' }),
    __metadata("design:type", String)
], SubmitFeedbackDto.prototype, "comment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitFeedbackDto.prototype, "basedOnSnapshotId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitFeedbackDto.prototype, "aiVersion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitFeedbackDto.prototype, "ruleSetVersion", void 0);
