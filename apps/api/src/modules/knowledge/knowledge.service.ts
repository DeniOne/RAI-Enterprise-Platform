import { Injectable } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";

@Injectable()
export class KnowledgeService {
  private readonly graphPath = path.resolve(
    process.cwd(),
    "../../docs/graph.json",
  );

  async getGraphSnapshot() {
    try {
      const data = await fs.readFile(this.graphPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading graph snapshot:", error);
      throw new Error("Graph snapshot not found. Run generate_graph.py first.");
    }
  }
}
