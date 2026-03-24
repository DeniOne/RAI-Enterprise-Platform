export const TECH_MAP_STAGES_WITH_RESOURCES_INCLUDE = {
  stages: {
    orderBy: { sequence: "asc" },
    include: {
      operations: {
        include: {
          resources: true,
        },
      },
    },
  },
} as const;

export const TECH_MAP_CANONICAL_DRAFT_INCLUDE = {
  field: true,
  season: true,
  harvestPlan: {
    include: {
      performanceContract: true,
    },
  },
  cropZone: {
    include: {
      field: true,
      season: true,
      cropVariety: true,
    },
  },
  stages: {
    orderBy: { sequence: "asc" },
    include: {
      operations: {
        include: {
          resources: true,
          evidence: true,
          executionRecord: true,
        },
      },
    },
  },
  generationRecord: true,
} as const;

export const TECH_MAP_STAGES_WITH_RESOURCES_NO_ORDER_INCLUDE = {
  stages: {
    include: {
      operations: {
        include: {
          resources: true,
        },
      },
    },
  },
} as const;

export const TECH_MAP_VALIDATION_INCLUDE = {
  field: true,
  stages: {
    include: {
      operations: {
        include: {
          resources: {
            include: {
              inputCatalog: true,
            },
          },
        },
      },
    },
  },
  cropZone: true,
} as const;

export const TECH_MAP_DAG_INCLUDE = {
  stages: {
    include: {
      operations: true,
    },
  },
} as const;
