export interface GamificationSettings {
  base_risk_pct: number;
  risk_multiplier: number;
  stepsize_up: number; // R threshold to level up (e.g. 30 = 30R cumulative)
  gamification_enabled: boolean;
}

export interface LevelState {
  level: number;
  rToNextLevel: number;     // how much R remaining to reach next level-up
  currentRiskPct: number;
  cumRSinceLevel: number;   // R accumulated since this level started
  levelUpThreshold: number; // the R threshold for this level (e.g. 30R)
}

export function getRiskPctForLevel(baseRiskPct: number, riskMultiplier: number, level: number): number {
  if (level <= 0) return baseRiskPct;
  return baseRiskPct * Math.pow(riskMultiplier, level);
}

/**
 * Gamification logic:
 * - Level starts at 0 with base risk
 * - cumRSinceLevel tracks cumulative R earned since the current level was reached
 * - When cumRSinceLevel >= stepsize_up (e.g. 30R), level goes UP by 1, cumR resets to 0
 * - When cumRSinceLevel drops below 0 (i.e. you lose more R than you gained at this level),
 *   level goes DOWN by 1, cumR resets to 0
 * - Risk at level N = base_risk * (risk_multiplier ^ N)
 *
 * Example: stepsize_up = 30
 *   Start at level 0. Earn 30R cumulative → level 1 (risk goes up).
 *   At level 1, if you then lose 1R and go below 0 cumR → back to level 0.
 */
export function calculateLevelState(
  tradeNettRs: number[],
  settings: GamificationSettings
): LevelState {
  if (!settings.gamification_enabled) {
    return {
      level: 0,
      rToNextLevel: settings.stepsize_up,
      currentRiskPct: settings.base_risk_pct,
      cumRSinceLevel: 0,
      levelUpThreshold: settings.stepsize_up,
    };
  }

  let level = 0;
  let cumRSinceLevel = 0;

  for (const nettR of tradeNettRs) {
    cumRSinceLevel += nettR;

    // Level DOWN: cumulative R since level start drops below 0
    if (cumRSinceLevel < 0) {
      level = Math.max(level - 1, -3);
      cumRSinceLevel = 0;
    }

    // Level UP: cumulative R since level start reaches threshold
    if (cumRSinceLevel >= settings.stepsize_up) {
      level++;
      cumRSinceLevel = cumRSinceLevel - settings.stepsize_up; // carry over excess R
    }
  }

  const rToNextLevel = Math.max(0, settings.stepsize_up - cumRSinceLevel);

  return {
    level,
    rToNextLevel: Math.round(rToNextLevel * 100) / 100,
    currentRiskPct: getRiskPctForLevel(settings.base_risk_pct, settings.risk_multiplier, level),
    cumRSinceLevel: Math.round(cumRSinceLevel * 10000) / 10000,
    levelUpThreshold: settings.stepsize_up,
  };
}

export function calculateLevelForEachTrade(
  tradeNettRs: number[],
  settings: GamificationSettings
): Array<{ level: number; rToNextLevel: number; riskPct: number }> {
  if (!settings.gamification_enabled) {
    return tradeNettRs.map(() => ({
      level: 0,
      rToNextLevel: settings.stepsize_up,
      riskPct: settings.base_risk_pct,
    }));
  }

  const results: Array<{ level: number; rToNextLevel: number; riskPct: number }> = [];
  let level = 0;
  let cumRSinceLevel = 0;

  for (const nettR of tradeNettRs) {
    cumRSinceLevel += nettR;

    if (cumRSinceLevel < 0) {
      level = Math.max(level - 1, -3);
      cumRSinceLevel = 0;
    }

    if (cumRSinceLevel >= settings.stepsize_up) {
      level++;
      cumRSinceLevel = cumRSinceLevel - settings.stepsize_up;
    }

    const rToNextLevel = Math.max(0, settings.stepsize_up - cumRSinceLevel);

    results.push({
      level,
      rToNextLevel: Math.round(rToNextLevel * 100) / 100,
      riskPct: getRiskPctForLevel(settings.base_risk_pct, settings.risk_multiplier, level),
    });
  }

  return results;
}
