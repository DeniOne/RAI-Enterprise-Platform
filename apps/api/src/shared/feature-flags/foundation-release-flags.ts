function parseBooleanEnv(
  value: string | undefined,
  fallback: boolean,
): boolean {
  const raw = value?.trim().toLowerCase();
  if (!raw) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(raw);
}

export function isFoundationReleaseReady(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return parseBooleanEnv(
    env.RAI_FOUNDATION_RELEASE_READY,
    env.NODE_ENV !== "production",
  );
}

export function isFoundationGatedFeatureEnabled(
  flagName: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    isFoundationReleaseReady(env) &&
    parseBooleanEnv(env[flagName], true)
  );
}
