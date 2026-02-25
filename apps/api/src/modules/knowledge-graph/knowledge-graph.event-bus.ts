// Knowledge Graph (Sprint 2)
import { Injectable } from "@nestjs/common";
import { KnowledgeGraphUpdatedEvent } from "./events/knowledge-graph.events";

export interface KnowledgeGraphEventHandler {
  handle(event: KnowledgeGraphUpdatedEvent): Promise<void>;
}

@Injectable()
export class KnowledgeGraphEventBus {
  private handler: KnowledgeGraphEventHandler | null = null;

  register(handler: KnowledgeGraphEventHandler) {
    this.handler = handler;
  }

  async publish(event: KnowledgeGraphUpdatedEvent): Promise<void> {
    if (this.handler) {
      await this.handler.handle(event);
    }
  }
}
