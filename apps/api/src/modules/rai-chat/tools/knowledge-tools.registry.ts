import { BadRequestException, Inject, Injectable, OnModuleInit } from "@nestjs/common";
import * as Joi from "joi";
import { ObjectSchema } from "joi";
import {
  QueryKnowledgePayload,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
} from "./rai-tools.types";
import { MemoryAdapter } from "../../../shared/memory/memory-adapter.interface";

const KNOWLEDGE_TOOL_NAMES: RaiToolName[] = [RaiToolName.QueryKnowledge];

type KnowledgeToolName = RaiToolName.QueryKnowledge;

type ToolHandler<TName extends KnowledgeToolName> = (
  payload: RaiToolPayloadMap[TName],
  actorContext: RaiToolActorContext,
) => Promise<RaiToolResultMap[TName]>;

interface RegisteredKnowledgeTool<TName extends KnowledgeToolName> {
  name: TName;
  schema: ObjectSchema<RaiToolPayloadMap[TName]>;
  handler: ToolHandler<TName>;
}

@Injectable()
export class KnowledgeToolsRegistry implements OnModuleInit {
  private readonly tools = new Map<
    KnowledgeToolName,
    RegisteredKnowledgeTool<KnowledgeToolName>
  >();

  constructor(
    @Inject("MEMORY_ADAPTER")
    private readonly memoryAdapter: MemoryAdapter,
  ) {}

  onModuleInit() {
    this.register(
      RaiToolName.QueryKnowledge,
      Joi.object<QueryKnowledgePayload>({
        query: Joi.string().trim().min(1).max(500).required(),
      }),
      async (payload, actorContext) => {
        const profile = await this.memoryAdapter.getProfile({
          companyId: actorContext.companyId,
          traceId: actorContext.traceId,
        });
        const text = typeof profile?.lastMessagePreview === "string"
          ? profile.lastMessagePreview
          : "";
        const q = payload.query.toLowerCase();
        const items: Array<{ content: string; score: number }> = [];
        if (text && text.toLowerCase().includes(q)) {
          items.push({ content: text.slice(0, 200), score: 0.8 });
        }
        return { hits: items.length, items };
      },
    );
  }

  register<TName extends KnowledgeToolName>(
    name: TName,
    schema: ObjectSchema<RaiToolPayloadMap[TName]>,
    handler: ToolHandler<TName>,
  ) {
    if (this.tools.has(name)) {
      throw new Error(`KNOWLEDGE_TOOL_REGISTRY_DUPLICATE: ${name}`);
    }
    this.tools.set(name, {
      name,
      schema,
      handler,
    } as RegisteredKnowledgeTool<KnowledgeToolName>);
  }

  has(name: RaiToolName): boolean {
    return KNOWLEDGE_TOOL_NAMES.includes(name);
  }

  async execute<TName extends KnowledgeToolName>(
    name: TName,
    payload: unknown,
    actorContext: RaiToolActorContext,
  ): Promise<RaiToolResultMap[TName]> {
    const tool = this.tools.get(name) as
      | RegisteredKnowledgeTool<TName>
      | undefined;
    if (!tool) {
      throw new BadRequestException(`Unknown knowledge tool: ${name}`);
    }
    const validation = tool.schema.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    });
    if (validation.error) {
      throw new BadRequestException(
        `Invalid payload for knowledge tool ${name}: ${validation.error.message}`,
      );
    }
    return tool.handler(validation.value, actorContext) as Promise<
      RaiToolResultMap[TName]
    >;
  }
}
