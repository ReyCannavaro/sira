export function formatExp(exp: number): string {
  return exp.toLocaleString("id-ID");
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}d`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (remaining === 0) return `${minutes}m`;
  return `${minutes}m ${remaining}d`;
}

export function formatHeroClass(heroClass: string): string {
  const map: Record<string, string> = {
    logic_warrior: "Logic Warrior",
    web_mage:      "Web Mage",
    data_ranger:   "Data Ranger",
  };
  return map[heroClass] ?? heroClass;
}

export function formatDifficulty(difficulty: string): string {
  const map: Record<string, string> = {
    easy:   "Mudah",
    normal: "Normal",
    hard:   "Sulit",
    expert: "Expert",
  };
  return map[difficulty] ?? difficulty;
}

export function getRegionAccent(learningPath: string): string {
  const map: Record<string, string> = {
    web_dev:          "#22D3EE",
    machine_learning: "#A78BFA",
    computer_science: "#F59E0B",
  };
  return map[learningPath] ?? "#22D3EE";
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getAvatarColor(username: string): string {
  const colors = [
    "#22D3EE", "#A78BFA", "#F59E0B",
    "#34D399", "#F87171", "#60A5FA",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}