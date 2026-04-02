import { Injectable } from "@nestjs/common";
import type { CropForm, CropZone, RegionProfile, Season } from "@rai/prisma-client";
import type { CropFormResolution } from "./tech-map-generation.types";

type BranchSelectionContext = {
  cropZone: CropZone;
  season: Season;
  regionProfile: RegionProfile | null;
};

@Injectable()
export class BranchSelectionService {
  select(context: BranchSelectionContext): CropFormResolution {
    if (context.cropZone.cropForm) {
      return {
        cropForm: context.cropZone.cropForm,
        canonicalBranch:
          context.cropZone.cropForm === "RAPESEED_WINTER"
            ? "winter_rapeseed"
            : "spring_rapeseed",
        source: "explicit",
        reasons: ["cropZone.cropForm задан явно и используется как единственный canonical branch key."],
      };
    }

    const satAvg = context.regionProfile?.satAvg ?? null;
    const winterType = context.regionProfile?.winterType ?? null;

    if ((satAvg != null && satAvg >= 2200) || Boolean(winterType)) {
      return {
        cropForm: "RAPESEED_WINTER",
        canonicalBranch: "winter_rapeseed",
        source: "regional_inference",
        reasons: [
          satAvg != null ? `SAT_avg=${satAvg} поддерживает озимую ветку.` : "winterType в регионе поддерживает озимую ветку.",
        ],
      };
    }

    if (satAvg != null && satAvg < 2200) {
      return {
        cropForm: "RAPESEED_SPRING",
        canonicalBranch: "spring_rapeseed",
        source: "regional_inference",
        reasons: [`SAT_avg=${satAvg} недостаточна для уверенного озимого профиля.`],
      };
    }

    const month = context.season.startDate?.getUTCMonth();
    if (month != null && month >= 6) {
      return {
        cropForm: "RAPESEED_WINTER",
        canonicalBranch: "winter_rapeseed",
        source: "seasonal_inference",
        reasons: ["Старт сезона во второй половине года интерпретирован как озимая ветка."],
      };
    }

    return {
      cropForm: "RAPESEED_SPRING",
      canonicalBranch: "spring_rapeseed",
      source: "seasonal_inference",
      reasons: ["Недостаточно региональных сигналов; выбрана безопасная яровая fallback-ветка."],
    };
  }
}
