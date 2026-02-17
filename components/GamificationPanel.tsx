'use client';

interface GamificationPanelProps {
  level: number;
  rToNextLevel: number;
  currentRiskPct: number;
  cumRSinceLevel: number;
  levelUpThreshold: number;
  baseRiskPct: number;
  enabled: boolean;
}

export default function GamificationPanel({
  level,
  rToNextLevel,
  currentRiskPct,
  cumRSinceLevel,
  levelUpThreshold,
  baseRiskPct,
  enabled,
}: GamificationPanelProps) {
  if (!enabled) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Gamification</h3>
        <p className="text-gray-500 text-sm">Gamification is disabled. Enable it in Settings.</p>
      </div>
    );
  }

  const progress = levelUpThreshold > 0 ? (cumRSinceLevel / levelUpThreshold) * 100 : 0;
  const riskPctDisplay = (currentRiskPct * 100).toFixed(2);
  const baseRiskDisplay = (baseRiskPct * 100).toFixed(2);

  const levelColor = level > 0 ? 'text-emerald-400' : level < 0 ? 'text-red-400' : 'text-gray-300';
  const levelBg = level > 0 ? 'bg-emerald-900/30 border-emerald-800' : level < 0 ? 'bg-red-900/30 border-red-800' : 'bg-gray-800/50 border-gray-700';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Level Progress</h3>
        <div className={`text-2xl font-bold ${levelColor}`}>
          Level {level}
        </div>
      </div>

      {/* Level badge */}
      <div className={`rounded-lg border p-4 mb-4 ${levelBg}`}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Current Risk</div>
            <div className="text-lg font-bold">{riskPctDisplay}%</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Base Risk</div>
            <div className="text-lg text-gray-400">{baseRiskDisplay}%</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">R to Next Level</div>
            <div className="text-lg font-bold">{rToNextLevel.toFixed(1)}R</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Cum R This Level</div>
            <div className={`text-lg font-bold ${cumRSinceLevel >= 0 ? 'stat-positive' : 'stat-negative'}`}>
              {cumRSinceLevel.toFixed(2)}R
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{cumRSinceLevel.toFixed(1)}R / {levelUpThreshold}R</span>
          <span>{Math.max(0, Math.min(progress, 100)).toFixed(0)}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              level > 0 ? 'bg-emerald-500' : level < 0 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
          />
        </div>
      </div>

      {/* Rules reminder */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Accumulate {levelUpThreshold}R to level up. Risk increases by multiplier per level.</p>
        <p>If cumulative R drops below 0 at any point, you level down.</p>
      </div>
    </div>
  );
}
