import { Season, Field, Rapeseed } from "@prisma/client";

export interface SeasonSnapshotData {
  season: Season;
  field: Field;
  rapeseed: Rapeseed;
  technologyCard?: any; // Assuming TechnologyCard for now
  operations?: any[]; // For future operations
}
