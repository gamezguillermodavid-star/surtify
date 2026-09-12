export type LevelInfo = {
  name: string;
  minXp: number;
};

// Umbrales de nivel. Constantes de diseño del juego, no dependen de datos
// de ningún usuario concreto.
export const LEVELS: LevelInfo[] = [
  { name: 'Novato', minXp: 0 },
  { name: 'Explorador', minXp: 50 },
  { name: 'Local', minXp: 150 },
  { name: 'Veterano', minXp: 400 },
  { name: 'Leyenda', minXp: 1000 },
];

export type LevelProgress = {
  name: string;
  progressPercent: number;
  xpToNext: number;
  nextName: string | null;
  isMaxLevel: boolean;
};

export function getLevelProgress(xp: number): LevelProgress {
  let currentIndex = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) currentIndex = i;
  }
  const current = LEVELS[currentIndex];
  const next = LEVELS[currentIndex + 1] ?? null;

  if (!next) {
    return {
      name: current.name,
      progressPercent: 100,
      xpToNext: 0,
      nextName: null,
      isMaxLevel: true,
    };
  }

  const span = next.minXp - current.minXp;
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((xp - current.minXp) / span) * 100))
  );

  return {
    name: current.name,
    progressPercent,
    xpToNext: Math.max(0, next.minXp - xp),
    nextName: next.name,
    isMaxLevel: false,
  };
}
