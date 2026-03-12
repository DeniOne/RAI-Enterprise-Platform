import { Injectable } from "@nestjs/common";
import type { StrategyForecastRunResponse } from "./decision-intelligence.service";

@Injectable()
export class DecisionRecommendationComposerService {
  buildRecommendation(input: {
    riskTier: "low" | "medium" | "high";
    budgetRemaining: number;
    burnRate: number;
    scenarioDelta?: StrategyForecastRunResponse["scenarioDelta"];
  }): string {
    if (input.riskTier === "high") {
      return "Ужесточить управленческий контур: сократить рискованные расходы, провести экспертную агро-проверку и пересобрать сценарий ликвидности.";
    }
    if ((input.scenarioDelta?.margin ?? 0) > 0 && (input.scenarioDelta?.riskScore ?? 0) <= 5) {
      return "Сценарий улучшает маржу без критического роста риска. Его можно брать как рабочий кандидат для ручного review.";
    }
    if (input.burnRate > 0.8) {
      return "Приоритетом сделать контроль burn rate и календаря платежей: маржинальность сейчас чувствительнее к расходам, чем к росту выручки.";
    }
    if (input.budgetRemaining > 0) {
      return "Сохранять базовый план, но использовать оставшийся бюджет адресно: в рычаги с наибольшим влиянием на cash flow и риск.";
    }
    return "Перейти в режим консервативного исполнения и пересчитать сценарий после обновления финансовых сигналов.";
  }

  buildTradeoff(input: {
    riskTier: "low" | "medium" | "high";
    savingPotential: number;
    scenarioDelta?: StrategyForecastRunResponse["scenarioDelta"];
  }): string {
    if (input.riskTier === "high") {
      return "Снижение downside сейчас важнее агрессивного роста: upside ограничен, а цена ошибки высока.";
    }
    if ((input.scenarioDelta?.margin ?? 0) > 0 && (input.scenarioDelta?.cashFlow ?? 0) < 0) {
      return "Сценарий улучшает прибыль, но просаживает cash flow. Его нельзя принимать без финансового буфера.";
    }
    if (input.savingPotential > 0) {
      return "Главный компромисс сейчас между скоростью оптимизации затрат и сохранением операционной устойчивости.";
    }
    return "Основной компромисс проходит между ростом выручки и контролем волатильности исполнения.";
  }
}
