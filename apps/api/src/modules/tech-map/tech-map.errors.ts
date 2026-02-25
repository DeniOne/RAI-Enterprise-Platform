import { ConflictException } from "@nestjs/common";

export class TechMapActiveConflictError extends ConflictException {
  constructor(context: string) {
    super({
      code: "TECHMAP_ACTIVE_CONFLICT",
      message: `Active TechMap conflict: Another TechMap is already ACTIVE for context (${context}).`,
    });
    this.name = "TechMapActiveConflictError";
  }
}

export class TechMapImmutableFieldError extends ConflictException {
  constructor(field: string) {
    super({
      code: "TECHMAP_IMMUTABLE_FIELD",
      message: `Field ${field} is immutable after TechMap creation.`,
    });
    this.name = "TechMapImmutableFieldError";
  }
}
