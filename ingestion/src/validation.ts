import Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { JsonObject } from "./transport.js";

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export interface SchemaResolver {
  getSchemaPath(version: string, kind: "image" | "satellite"): string;
}

export class DefaultSchemaResolver implements SchemaResolver {
  getSchemaPath(version: string, kind: "image" | "satellite"): string {
    const file =
      kind === "image"
        ? "01-pest-disease-image-ingestion.schema.json"
        : "02-satellite-vegetation-indices.schema.json";

    return resolve(process.cwd(), "..", "contracts", file);
  }
}

export class Validator {
  private ajv = new Ajv2020({ allErrors: true, strict: true });
  private resolver: SchemaResolver;

  constructor(resolver: SchemaResolver = new DefaultSchemaResolver()) {
    addFormats(this.ajv);
    this.resolver = resolver;
  }

  async validate(payload: JsonObject): Promise<ValidationResult> {
    const version = String(payload.version ?? "");
    const kind = this.detectKind(payload);
    const schemaPath = this.resolver.getSchemaPath(version, kind);
    const schemaText = await readFile(schemaPath, "utf-8");
    const schema = JSON.parse(schemaText);

    const validate = this.ajv.compile(schema);
    const ok = validate(payload);

    if (ok) {
      return { ok: true };
    }

    const errors = (validate.errors ?? []).map((e: ErrorObject) => {
      const path = e.instancePath || "/";
      return `${path} ${e.message ?? "validation error"}`;
    });

    return { ok: false, errors };
  }

  private detectKind(payload: JsonObject): "image" | "satellite" {
    if (payload.image && typeof payload.image === "object") {
      return "image";
    }

    return "satellite";
  }
}
