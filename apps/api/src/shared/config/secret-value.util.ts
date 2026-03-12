import * as fs from "fs";

interface ConfigLike {
  get<T = string>(propertyPath: string): T | undefined;
}

export function parseBooleanSetting(
  value: string | undefined,
  fallback: boolean,
): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(normalized);
}

export function resolveSecretValue(
  config: ConfigLike,
  key: string,
  options: {
    fileKey?: string;
    fallbackKeys?: string[];
    required?: boolean;
  } = {},
): string | undefined {
  const fileKey = options.fileKey ?? `${key}_FILE`;
  const fallbackKeys = options.fallbackKeys ?? [];

  const directValue = readConfiguredValue(config.get<string>(key));
  if (directValue) {
    return directValue;
  }

  const filePath = readConfiguredValue(config.get<string>(fileKey));
  if (filePath) {
    const fileValue = fs.readFileSync(filePath, "utf8").trim();
    if (!fileValue) {
      throw new Error(`Секрет ${key} прочитан из файла ${filePath}, но файл пуст.`);
    }

    return fileValue;
  }

  for (const fallbackKey of fallbackKeys) {
    const fallbackValue = readConfiguredValue(config.get<string>(fallbackKey));
    if (fallbackValue) {
      return fallbackValue;
    }

    const fallbackFileKey = `${fallbackKey}_FILE`;
    const fallbackFilePath = readConfiguredValue(
      config.get<string>(fallbackFileKey),
    );
    if (fallbackFilePath) {
      const fallbackFileValue = fs.readFileSync(fallbackFilePath, "utf8").trim();
      if (!fallbackFileValue) {
        throw new Error(
          `Секрет ${fallbackKey} прочитан из файла ${fallbackFilePath}, но файл пуст.`,
        );
      }

      return fallbackFileValue;
    }
  }

  if (options.required) {
    throw new Error(
      `Не найден обязательный секрет ${key} ни напрямую, ни через ${fileKey}.`,
    );
  }

  return undefined;
}

function readConfiguredValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
