import { BadRequestException, Injectable } from "@nestjs/common";
import {
  CommitAgroEventDto,
  ConfirmAgroEventDto,
  CreateAgroEventDraftDto,
  FixAgroEventDto,
  LinkAgroEventDto,
} from "./dto/agro-events.dto";
import { AgroEventsOrchestratorService } from "./agro-events.orchestrator.service";
import { AgroEventsActorContext } from "./agro-events.types";

@Injectable()
export class AgroEventsService {
  constructor(
    private readonly orchestrator: AgroEventsOrchestratorService,
  ) {}

  createDraft(user: any, dto: CreateAgroEventDraftDto) {
    return this.orchestrator.createDraft(this.toActor(user), dto);
  }

  fix(user: any, dto: FixAgroEventDto) {
    return this.orchestrator.fix(this.toActor(user), dto);
  }

  link(user: any, dto: LinkAgroEventDto) {
    return this.orchestrator.link(this.toActor(user), dto);
  }

  confirm(user: any, dto: ConfirmAgroEventDto) {
    return this.orchestrator.confirm(this.toActor(user), dto.draftId);
  }

  commit(user: any, dto: CommitAgroEventDto) {
    return this.orchestrator.commit(this.toActor(user), dto);
  }

  private toActor(user: any): AgroEventsActorContext {
    const userId = user?.userId ?? user?.id;
    if (!user?.companyId || !userId) {
      throw new BadRequestException("Security Context: user/companyId is missing");
    }

    return {
      companyId: user.companyId,
      userId: userId,
    };
  }
}
