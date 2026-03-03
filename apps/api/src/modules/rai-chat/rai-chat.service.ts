import { Injectable } from "@nestjs/common";
import { RaiChatRequestDto, RaiChatResponseDto } from "./dto/rai-chat.dto";
import { SupervisorAgent } from "./supervisor-agent.service";

@Injectable()
export class RaiChatService {
  constructor(private readonly supervisorAgent: SupervisorAgent) {}

  async handleChat(
    request: RaiChatRequestDto,
    companyId: string,
    userId?: string,
  ): Promise<RaiChatResponseDto> {
    return this.supervisorAgent.orchestrate(request, companyId, userId);
  }
}
