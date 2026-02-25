export abstract class ExternalFeedClient {
  constructor(protected apiKey?: string) {}
  abstract fetchLatest(companyId: string): Promise<any>;
  abstract normalize(rawData: any): any;
}

export class GigaLegalClient extends ExternalFeedClient {
  async fetchLatest(companyId: string): Promise<any> {
    // Временный мок API GigaLegal
    return {
      title: "Постановление Правительства РФ №456",
      source: "GIGALEGAL",
      content: "Требования к качеству семян рапса для экспорта в 2026 году...",
      norms: [{ paragraph: "п. 1.2", content: "Влажность не более 8%" }],
    };
  }

  normalize(rawData: any) {
    return {
      title: rawData.title,
      source: "GIGALEGAL",
      norms: rawData.norms.map((n: any) => ({
        paragraph: n.paragraph,
        content: n.content,
      })),
    };
  }
}
