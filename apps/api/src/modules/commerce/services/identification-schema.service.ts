import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import {
  IdentificationFieldKey,
  IdentificationSchemaResponse,
} from "./party-lookup.types";

const DIGITS = "digits" as const;

const SCHEMA_CONFIG: Record<
  "RU" | "BY" | "KZ",
  {
    legalEntity: IdentificationSchemaResponse["fields"];
    entrepreneur: IdentificationSchemaResponse["fields"];
    lookup: IdentificationSchemaResponse["lookup"];
  }
> = {
  RU: {
    legalEntity: [
      {
        key: "inn",
        label: "ИНН",
        dataType: "string",
        required: true,
        mask: DIGITS,
        minLength: 10,
        maxLength: 10,
      },
      {
        key: "kpp",
        label: "КПП",
        dataType: "string",
        required: false,
        mask: DIGITS,
        minLength: 9,
        maxLength: 9,
      },
    ],
    entrepreneur: [
      {
        key: "inn",
        label: "ИНН",
        dataType: "string",
        required: true,
        mask: DIGITS,
        minLength: 12,
        maxLength: 12,
      },
    ],
    lookup: {
      enabled: true,
      triggerKeys: ["inn"],
      buttonLabel: "Найти по ИНН",
      debounceMs: 800,
    },
  },
  BY: {
    legalEntity: [
      {
        key: "unp",
        label: "УНП",
        dataType: "string",
        required: true,
        mask: DIGITS,
        minLength: 8,
        maxLength: 12,
      },
    ],
    entrepreneur: [
      {
        key: "unp",
        label: "УНП",
        dataType: "string",
        required: true,
        mask: DIGITS,
        minLength: 8,
        maxLength: 12,
      },
    ],
    lookup: {
      enabled: false,
      triggerKeys: [],
      buttonLabel: "Найти по реквизитам",
      debounceMs: 800,
    },
  },
  KZ: {
    legalEntity: [
      {
        key: "bin",
        label: "БИН",
        dataType: "string",
        required: true,
        mask: DIGITS,
        minLength: 12,
        maxLength: 12,
      },
    ],
    entrepreneur: [
      {
        key: "bin",
        label: "БИН",
        dataType: "string",
        required: true,
        mask: DIGITS,
        minLength: 12,
        maxLength: 12,
      },
    ],
    lookup: {
      enabled: false,
      triggerKeys: [],
      buttonLabel: "Найти по реквизитам",
      debounceMs: 800,
    },
  },
};

@Injectable()
export class IdentificationSchemaService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchema(
    companyId: string,
    jurisdictionId: string,
    partyType: string,
  ): Promise<IdentificationSchemaResponse> {
    const jurisdiction = await this.prisma.jurisdiction.findFirst({
      where: { companyId, id: jurisdictionId },
      select: { code: true },
    });

    if (!jurisdiction) {
      throw new NotFoundException("Jurisdiction not found");
    }

    const code = jurisdiction.code.trim().toUpperCase();
    if (code !== "RU" && code !== "BY" && code !== "KZ") {
      throw new BadRequestException("Identification schema is not configured for this jurisdiction");
    }

    const bucket = SCHEMA_CONFIG[code];
    const normalizedPartyType = partyType.trim().toUpperCase();
    const isEntrepreneur =
      normalizedPartyType === "IP" || normalizedPartyType === "KFH";
    const lookupEnabledForPartyType =
      normalizedPartyType === "LEGAL_ENTITY" ||
      normalizedPartyType === "IP" ||
      normalizedPartyType === "KFH";

    const fields = (isEntrepreneur ? bucket.entrepreneur : bucket.legalEntity).map(
      (field) => ({ ...field }),
    );

    this.assertServerSchema(code, fields);

    return {
      jurisdictionId: code,
      partyType: normalizedPartyType,
      fields,
      lookup: {
        ...bucket.lookup,
        enabled: bucket.lookup.enabled && lookupEnabledForPartyType,
      },
    };
  }

  private assertServerSchema(
    code: "RU" | "BY" | "KZ",
    fields: Array<{ key: IdentificationFieldKey }>,
  ): void {
    const keys = fields.map((field) => field.key);
    if (code === "RU" && (keys.includes("unp") || keys.includes("bin"))) {
      throw new Error("RU schema MUST NOT contain unp or bin");
    }
    if (code === "BY" && keys.some((key) => key !== "unp")) {
      throw new Error("BY schema MUST contain only unp");
    }
    if (code === "KZ" && keys.some((key) => key !== "bin")) {
      throw new Error("KZ schema MUST contain only bin");
    }
  }
}
