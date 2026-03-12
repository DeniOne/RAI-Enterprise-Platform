function isEnabled(
  flagValue: string | undefined,
  fallback = true,
): boolean {
  const raw = flagValue?.trim().toLowerCase();
  if (!raw) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(raw);
}

const foundationReleaseReady = isEnabled(
  process.env.NEXT_PUBLIC_RAI_FOUNDATION_RELEASE_READY,
  process.env.NODE_ENV !== "production",
);

export const webFeatureFlags = {
  foundationReleaseReady,
  memoryHints:
    foundationReleaseReady &&
    isEnabled(process.env.NEXT_PUBLIC_RAI_MEMORY_HINTS_ENABLED),
  chiefAgronomistPanel:
    foundationReleaseReady &&
    isEnabled(process.env.NEXT_PUBLIC_RAI_CHIEF_AGRONOMIST_PANEL_ENABLED),
  strategyForecasts:
    foundationReleaseReady &&
    isEnabled(process.env.NEXT_PUBLIC_RAI_STRATEGY_FORECASTS_ENABLED),
  controlTowerMemory: isEnabled(
    process.env.NEXT_PUBLIC_RAI_CONTROL_TOWER_MEMORY_ENABLED,
  ),
};
