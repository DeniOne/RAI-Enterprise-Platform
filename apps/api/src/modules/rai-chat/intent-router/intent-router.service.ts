import { Injectable } from "@nestjs/common";
import { RaiChatRequestDto } from "../dto/rai-chat.dto";
import {
  RaiToolCall,
} from "../tools/rai-tools.types";
import {
  IntentClassification,
  WorkspaceContextForIntent,
} from "../../../shared/rai-chat/intent-router.types";
import {
  buildAutoToolCallFromContracts,
  classifyByAgentContracts,
} from "../../../shared/rai-chat/agent-interaction-contracts";

@Injectable()
export class IntentRouterService {
  classify(
    message: string,
    workspaceContext?: WorkspaceContextForIntent,
  ): IntentClassification {
    return classifyByAgentContracts(message, workspaceContext);
  }

  buildAutoToolCall(
    message: string,
    request: RaiChatRequestDto,
    classification?: IntentClassification,
  ): RaiToolCall | null {
    return buildAutoToolCallFromContracts(
      { ...request, message },
      classification ?? this.classify(message, request.workspaceContext),
    );
  }
}
