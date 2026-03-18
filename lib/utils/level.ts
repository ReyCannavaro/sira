export function calculateLevel(totalExp: number): number {
  return Math.floor(1 + Math.sqrt(Math.max(totalExp, 0) / 500));
}

export function expRequiredForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 500;
}

export function getLevelProgress(totalExp: number): {
  level: number;
  currentExp: number;
  neededExp: number;
  percent: number;
} {
  const level = calculateLevel(totalExp);
  const currentLevelExp = expRequiredForLevel(level);
  const nextLevelExp = expRequiredForLevel(level + 1);
  const currentExp = totalExp - currentLevelExp;
  const neededExp = nextLevelExp - currentLevelExp;

  return {
    level,
    currentExp,
    neededExp,
    percent: Math.min(Math.round((currentExp / neededExp) * 100), 100),
  };
}

export const LEVEL_GATES = {
  JOIN_COMMUNITY:   1,
  PAIR_PROGRAMMING: 5,
  LEADERBOARD:      10,
  CREATE_SQUAD:     15,
  CREATE_SCHOOL:    25,
} as const;

export function getUnlockedPerks(level: number): string[] {
  const perks: string[] = [];
  if (level === 5)  perks.push("Pair Programming tersedia di komunitas");
  if (level === 10) perks.push("Leaderboard Global dapat diakses");
  if (level === 15) perks.push("Kamu bisa membuat komunitas Squad!");
  if (level === 25) perks.push("Kamu bisa membuat komunitas Sekolah!");
  return perks;
}

export function meetsLevelGate(
  userLevel: number,
  gate: keyof typeof LEVEL_GATES
): boolean {
  return userLevel >= LEVEL_GATES[gate];
}