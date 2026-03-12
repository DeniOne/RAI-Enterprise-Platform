import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { KnowledgeService } from "./knowledge.service";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { PLANNING_READ_ROLES } from "../../shared/auth/rbac.constants";

@Controller("knowledge")
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get("graph")
  @Authorized(...PLANNING_READ_ROLES)
  async getGraph() {
    try {
      return await this.knowledgeService.getGraphSnapshot();
    } catch (error) {
      throw new HttpException(
        "Failed to load knowledge graph snapshot",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
