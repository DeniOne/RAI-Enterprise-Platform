export type JsonObject = Record<string, unknown>;

export interface QueueMessage {
  id: string;
  payload: JsonObject;
  trace_id?: string;
}

export type MessageHandler = (msg: QueueMessage) => Promise<void>;

export interface QueueClient {
  subscribe(handler: MessageHandler): Promise<void>;
  ack(messageId: string): Promise<void>;
  stop?(): Promise<void>;
}
