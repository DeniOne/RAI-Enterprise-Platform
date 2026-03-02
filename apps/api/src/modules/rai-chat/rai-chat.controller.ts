import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { RaiChatRequestDto, RaiChatResponseDto } from "./dto/rai-chat.dto";
import { RaiChatService } from "./rai-chat.service";

@Controller('rai/chat')
@UseGuards(JwtAuthGuard)
export class RaiChatController {
  private readonly logger = new Logger(RaiChatController.name);

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly raiChatService: RaiChatService,
  ) {}

  @Post()
  async handleChat(@Body() body: RaiChatRequestDto): Promise<RaiChatResponseDto> {
    const companyId = this.tenantContext.getCompanyId();

    if (!companyId) {
      this.logger.error("Attempt to access RAI Chat without companyId");
      throw new BadRequestException("Security Context: companyId is missing");
    }

    this.logger.log(`RAI Chat message received for company: ${companyId}`);

    return this.raiChatService.handleChat(body, companyId);
  }
}
