import { Injectable } from "@nestjs/common";
import type {
  StrategyForecastRunRequest,
  StrategyForecastRunResponse,
} from "./decision-intelligence.service";

@Injectable()
export class StrategyForecastOptimizationService {
  buildPreview(input: {
    request: StrategyForecastRunRequest;
    riskTier: "low" | "medium" | "high";
    budgetLimit: number;
    budgetRemaining: number;
    burnRate: number;
    currentBalance: number;
    savingPotential: number;
    scenarioDelta?: StrategyForecastRunResponse["scenarioDelta"];
  }): StrategyForecastRunResponse["optimizationPreview"] {
    const constraints = [
      `Горизонт планирования: ${input.request.horizonDays} дней`,
      `Доменов в расчёте: ${input.request.domains.length}`,
      input.request.scopeLevel === "field"
        ? "Решение должно сохранять управляемость на уровне поля."
        : "Решение должно сохранять управляемость на уровне бизнеса.",
    ];

    if (!input.request.crop?.trim()) {
      constraints.push("Культура не задана: агрономический сигнал ослаблен.");
    }
    if (input.riskTier === "high") {
      constraints.push("Приоритет ограничения downside выше агрессивного upside.");
    }
    if (input.currentBalance < 0) {
      constraints.push("Отрицательный баланс делает ликвидность жёстким ограничением.");
    }

    const recommendations: StrategyForecastRunResponse["optimizationPreview"]["recommendations"] = [];
    const budgetPressureThreshold =
      input.budgetLimit > 0
        ? Math.max(input.budgetLimit * Math.max(input.burnRate, 0.15) * 0.35, 100000)
        : 150000;

    if (input.riskTier === "high") {
      recommendations.push({
        action: "Сместить план в режим защиты downside и сократить необязательные переменные расходы.",
        expectedImpact: `Стабилизация cash flow на горизонте ${input.request.horizonDays} дней.`,
        confidence: "high",
      });
    }

    if (input.budgetRemaining < budgetPressureThreshold) {
      recommendations.push({
        action: "Перераспределить бюджет в пользу операций с наибольшим вкладом в маржу и ликвидность.",
        expectedImpact: `Запас бюджета ${this.formatMoney(input.budgetRemaining)} ограничен относительно текущего burn rate.`,
        confidence: "high",
      });
    }

    if (input.scenarioDelta && input.scenarioDelta.margin > 0 && input.scenarioDelta.riskScore <= 0) {
      recommendations.push({
        action: "Поднять текущий сценарий в shortlist для исполнения и подготовить управленческое подтверждение.",
        expectedImpact: `Ожидаемый delta по марже ${this.formatSignedMoney(input.scenarioDelta.margin)} при нейтральном или снижающемся риске.`,
        confidence: "medium",
      });
    }

    if (input.savingPotential > 0) {
      recommendations.push({
        action: "Зафиксировать программу экономии и высвободить ресурс под критичные операции.",
        expectedImpact: `Потенциал экономии оценивается около ${this.formatMoney(input.savingPotential)} на текущем горизонте.`,
        confidence: "medium",
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        action: "Оставить baseline основной траекторией и усиливать мониторинг драйверов без жёсткой переразметки бюджета.",
        expectedImpact: "Текущий набор сигналов не даёт явного преимущества для более агрессивной оптимизации.",
        confidence: "medium",
      });
    }

    return {
      objective:
        input.riskTier === "high"
          ? "Максимизировать устойчивость cash flow и маржи при ограничении downside."
          : "Максимизировать маржу и cash flow без выхода за допустимый риск.",
      planningHorizon: `${input.request.horizonDays} дней`,
      constraints: constraints.slice(0, 4),
      recommendations: recommendations.slice(0, 3),
    };
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatSignedMoney(value: number): string {
    const formatted = this.formatMoney(value);
    return value > 0 ? `+${formatted}` : formatted;
  }
}
