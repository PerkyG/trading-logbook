export interface GamificationSettings {
  base_risk_pct: number;
  risk_multiplier: number;
  stepsize_up: number;
  gamification_enabled: boolean;
}

export interface LevelState {
  level: number;
  levelToGo: number;
  currentRiskPct: number;
  cumRSinceLevel: number;
  tradesSinceLevel: number;
}

export function getRiskPctForLevel(baseRiskPct: number, riskMultiplier: number, level: number): number {
  if (level <= 0) return baseRiskPct;
  return baseRiskPct * Math.pow(riskMultiplier, level);
}

export function calculateLevelState(
  tradeNettRs: number[],
  settings: GamificationSettings
): LevelState {
  if (!settings.gamification_enabled) {
    return {
      level: 0,
      levelToGo: settings.stepsize_up,
      currentRiskPct: settings.base_risk_pct,
      cumRSinceLevel: 0,
      tradesSinceLevel: 0,
    };
  }

  let level = 0;
  let cumRSinceLevel = 0;
  let tradesSinceLevel = 0;

  for (const nettR of tradeNettRs) {
    cumRSinceLevel += nettR;
    tradesSinceLevel++;

    if (cumRSinceLevel < 0) {
      level = Math.max(level - 1, -3);
      cumRSinceLevel = 0;
      tradesSinceLevel = 0;
    }

    if (tradesSinceLevel >= settings.stepsize_up) {
      level++;
      cumRSinceLevel = 0;
      tradesSinceLevel = 0;
    }
  }

  return {
    level,
    levelToGo: settings.stepsize_up - tradesSinceLevel,
    currentRiskPct: getRiskPctForLevel(settings.base_risk_pct, settings.risk_multiplier, level),
    cumRSinceLevel: Math.round(cumRSinceLevel * 10000) / 10000,
    tradesSinceLevel,
  };
}

export function calculateLevelForEachTrade(
  tradeNettRs: number[],
  settings: GamificationSettings
): Array<{ level: number; levelToGo: number; riskPct: number }> {
  if (!settings.gamification_enabled) {
    return tradeNettRs.map(() => ({
      level: 0,
      levelToGo: settings.stepsize_up,
      riskPct: settings.base_risk_pct,
    }));
  }

  const results: Array<{ level: number; levelToGo: number; riskPct: number }> = [];
  let level = 0;
  let cumRSinceLevel = 0;
  let tradesSinceLevel = 0;

  for (const nettR of tradeNettRs) {
    cumRSinceLevel += nettR;
    tradesSinceLevel++;

    if (cumRSinceLevel < 0) {
      level = Math.max(level - 1, -3);
      cumRSinceLevel = 0;
      tradesSinceLevel = 0;
    }

    if (tradesSinceLevel >= settings.stepsize_up) {
      level++;
      cumRSinceLevel = 0;
      tradesSinceLevel = 0;
    }

    results.push({
      level,
      levelToGo: settings.stepsize_up - tradesSinceLevel,
      riskPct: getRiskPctForLevel(settings.base_risk_pct, settings.risk_multiplier, level),
    });
  }

  return results;
}
