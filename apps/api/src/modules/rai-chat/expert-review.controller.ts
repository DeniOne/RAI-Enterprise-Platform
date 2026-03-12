import { BadRequestException, Body, Controller, Param, Post, UseInterceptors } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { isFoundationGatedFeatureEnabled } from "../../shared/feature-flags/foundation-release-flags";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import {
  ChiefAgronomistReviewRequest,
  ChiefAgronomistReviewResponse,
  ExpertReviewOutcomeRequest,
  ExpertReviewService,
} from "./expert-review.service";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { EXPERT_REVIEW_ROLES } from "../../shared/auth/rbac.constants";

@Controller("rai-chat/expert")
@Authorized(...EXPERT_REVIEW_ROLES)
export class ExpertReviewController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly expertReviewService: ExpertReviewService,
  ) {}

  @Post("chief-agronomist/review")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(IdempotencyInterceptor)
  async chiefAgronomistReview(
    @Body() body: ChiefAgronomistReviewRequest,
    @CurrentUser() user: any,
  ): Promise<ChiefAgronomistReviewResponse> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    if (
      !isFoundationGatedFeatureEnabled(
        "RAI_CHIEF_AGRONOMIST_PANEL_ENABLED",
      )
    ) {
      throw new BadRequestException("RAI_CHIEF_AGRONOMIST_PANEL_DISABLED");
    }
    return this.expertReviewService.runChiefAgronomistReview(
      companyId,
      user?.userId ?? user?.id ?? null,
      body,
    );
  }

  @Post("reviews/:reviewId/outcome")
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(IdempotencyInterceptor)
  async applyOutcome(
    @Param("reviewId") reviewId: string,
    @Body() body: ExpertReviewOutcomeRequest,
    @CurrentUser() user: any,
  ): Promise<ChiefAgronomistReviewResponse> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    return this.expertReviewService.applyReviewOutcome(
      companyId,
      user?.userId ?? user?.id ?? null,
      reviewId,
      body,
    );
  }
}
