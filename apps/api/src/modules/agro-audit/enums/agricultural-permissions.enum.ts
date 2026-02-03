export enum AgriculturalPermission {
  // --- Admin ---
  RULE_MANAGEMENT = "agricultural:rule_management",

  // --- Operational ---
  SEASON_OVERRIDE = "agricultural:season_override", // Право на ручное вмешательство

  // --- View ---
  AUDIT_VIEW = "agricultural:audit_view",
  METRICS_VIEW = "agricultural:metrics_view",
}
