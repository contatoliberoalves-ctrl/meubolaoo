// Static catalogs and constants used across the app.

export const EMBLEMS = ["⚽", "🔥", "🦈", "🚀", "👑", "🐉", "🎯", "🌟"];

export const SCORING = {
  EXATO: 5, // placar exato
  RESULTADO: 2, // acertou o resultado (V/E/D)
  ERROU: 0,
} as const;

// 7-item prize catalog shown on the Prêmios screen.
export const PRIZE_CATALOG = [
  { id: 1, label: "Mentoria individual grátis", icon: "🎓" },
  { id: 2, label: "Resumos de Constitucional", icon: "📘" },
  { id: 3, label: "Resumos de Ética", icon: "📗" },
  { id: 4, label: "Acesso ao reforço de Ética", icon: "🎧" },
  { id: 5, label: "Acesso ao reforço de Constitucional", icon: "🎙️" },
  { id: 6, label: "Material de revisão em dicas", icon: "🗂️" },
  { id: 7, label: "Minicurso Saúde Mental na OAB", icon: "🧠" },
];

// 4 prize slots (conquistas) with title + icon. The actual prize_label
// comes from the prizes_config table.
export const PRIZE_SLOTS = [
  { slot: "champion", title: "Campeão da Edição", icon: "🏆" },
  { slot: "runner_up", title: "Vice-campeão", icon: "🥈" },
  { slot: "weekly", title: "Vencedor da semana", icon: "📅" },
  { slot: "streak", title: "Melhor sequência", icon: "🔥" },
] as const;

export const GROUP_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export const STAGE_LABELS: Record<string, string> = {
  r16: "Oitavas de final",
  qf: "Quartas de final",
  sf: "Semifinais",
  final: "Final",
};

export const LOCK_MS = 5 * 60 * 1000; // 5 minutes

export type PointKind = "exato" | "resultado" | "errou" | null;

export function pointsKind(points: number | null | undefined): PointKind {
  if (points == null) return null;
  if (points >= SCORING.EXATO) return "exato";
  if (points >= SCORING.RESULTADO) return "resultado";
  return "errou";
}

// Pure scoring function — shared by API and any client display.
export function computePoints(
  homeScore: number,
  awayScore: number,
  predHome: number,
  predAway: number
): number {
  if (homeScore === predHome && awayScore === predAway) return SCORING.EXATO;
  const actual = Math.sign(homeScore - awayScore);
  const pred = Math.sign(predHome - predAway);
  if (actual === pred) return SCORING.RESULTADO;
  return SCORING.ERROU;
}

// A match is predictable only if not locked, no final result, and kickoff
// is more than 5 minutes away.
export function isPredictable(m: {
  locked: boolean;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: Date | string;
}): boolean {
  if (m.locked) return false;
  if (m.home_score != null || m.away_score != null) return false;
  const ko = new Date(m.kickoff_at).getTime();
  return ko - Date.now() > LOCK_MS;
}
