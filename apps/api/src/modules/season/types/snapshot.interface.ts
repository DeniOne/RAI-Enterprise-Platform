import { Season, Field, Rapeseed } from "@rai/prisma-client";

export interface SeasonSnapshotData {
  season: Season;
  field: Field;
  rapeseed: Rapeseed;
  technologyCard?: any; // Assuming TechnologyCard for now
  operations?: any[]; // For future operations
}
