import { PrismaClient, Stage } from "@prisma/client";

const prisma = new PrismaClient();

type Team = { name: string; flag: string };

const GROUPS: Record<string, Team[]> = {
  A: [
    { name: "México", flag: "🇲🇽" },
    { name: "África do Sul", flag: "🇿🇦" },
    { name: "Coreia do Sul", flag: "🇰🇷" },
    { name: "Tchéquia", flag: "🇨🇿" },
  ],
  B: [
    { name: "Canadá", flag: "🇨🇦" },
    { name: "Bósnia", flag: "🇧🇦" },
    { name: "Catar", flag: "🇶🇦" },
    { name: "Suíça", flag: "🇨🇭" },
  ],
  C: [
    { name: "Brasil", flag: "🇧🇷" },
    { name: "Marrocos", flag: "🇲🇦" },
    { name: "Haiti", flag: "🇭🇹" },
    { name: "Escócia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  ],
  D: [
    { name: "EUA", flag: "🇺🇸" },
    { name: "Paraguai", flag: "🇵🇾" },
    { name: "Austrália", flag: "🇦🇺" },
    { name: "Turquia", flag: "🇹🇷" },
  ],
  E: [
    { name: "Alemanha", flag: "🇩🇪" },
    { name: "Curaçao", flag: "🇨🇼" },
    { name: "Costa do Marfim", flag: "🇨🇮" },
    { name: "Equador", flag: "🇪🇨" },
  ],
  F: [
    { name: "Holanda", flag: "🇳🇱" },
    { name: "Japão", flag: "🇯🇵" },
    { name: "Suécia", flag: "🇸🇪" },
    { name: "Tunísia", flag: "🇹🇳" },
  ],
  G: [
    { name: "Bélgica", flag: "🇧🇪" },
    { name: "Egito", flag: "🇪🇬" },
    { name: "Irã", flag: "🇮🇷" },
    { name: "Nova Zelândia", flag: "🇳🇿" },
  ],
  H: [
    { name: "Espanha", flag: "🇪🇸" },
    { name: "Cabo Verde", flag: "🇨🇻" },
    { name: "Arábia Saudita", flag: "🇸🇦" },
    { name: "Uruguai", flag: "🇺🇾" },
  ],
  I: [
    { name: "França", flag: "🇫🇷" },
    { name: "Senegal", flag: "🇸🇳" },
    { name: "Iraque", flag: "🇮🇶" },
    { name: "Noruega", flag: "🇳🇴" },
  ],
  J: [
    { name: "Argentina", flag: "🇦🇷" },
    { name: "Argélia", flag: "🇩🇿" },
    { name: "Áustria", flag: "🇦🇹" },
    { name: "Jordânia", flag: "🇯🇴" },
  ],
  K: [
    { name: "Portugal", flag: "🇵🇹" },
    { name: "Congo", flag: "🇨🇩" },
    { name: "Uzbequistão", flag: "🇺🇿" },
    { name: "Colômbia", flag: "🇨🇴" },
  ],
  L: [
    { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { name: "Croácia", flag: "🇭🇷" },
    { name: "Gana", flag: "🇬🇭" },
    { name: "Panamá", flag: "🇵🇦" },
  ],
};

// Round-robin pairing per matchday (team indices within group)
const PAIRINGS: Record<number, [number, number][]> = {
  1: [
    [0, 1],
    [2, 3],
  ],
  2: [
    [0, 2],
    [3, 1],
  ],
  3: [
    [0, 3],
    [1, 2],
  ],
};

// Date windows (UTC). Stagger by group index and pairing slot.
function kickoffFor(md: number, groupIdx: number, pairIdx: number): Date {
  const times = ["13:00", "16:00", "19:00"];
  if (md === 1) {
    // span 11-18 jun 2026 -> 8 days, 12 groups
    const day = 11 + Math.floor((groupIdx * 2 + pairIdx) / 3) % 8;
    const t = times[(groupIdx + pairIdx) % 3];
    return new Date(`2026-06-${String(day).padStart(2, "0")}T${t}:00Z`);
  }
  if (md === 2) {
    // span 19-24 jun 2026 -> 6 days
    const day = 19 + (Math.floor((groupIdx * 2 + pairIdx) / 4) % 6);
    const t = times[(groupIdx + pairIdx) % 3];
    return new Date(`2026-06-${String(day).padStart(2, "0")}T${t}:00Z`);
  }
  // md3 span 25-27 jun 2026 -> 3 days
  const day = 25 + (Math.floor((groupIdx * 2 + pairIdx) / 8) % 3);
  const t = times[(groupIdx + pairIdx) % 3];
  return new Date(`2026-06-${String(day).padStart(2, "0")}T${t}:00Z`);
}

const BADGES = [
  { id: "primeiro-palpite", title: "Primeiro Palpite", description: "Mandou seu 1º palpite", icon: "✅", sort_order: 0 },
  { id: "na-mosca", title: "Na Mosca", description: "Cravou um placar exato", icon: "🎯", sort_order: 1 },
  { id: "pe-quente", title: "Pé Quente", description: "3 acertos seguidos", icon: "🔥", sort_order: 2 },
  { id: "vidente", title: "Vidente", description: "Cravou 5 placares", icon: "🔮", sort_order: 3 },
  { id: "maratonista", title: "Maratonista", description: "Palpitou em todos os jogos da rodada", icon: "🏃", sort_order: 4 },
  { id: "top-3", title: "Top 3", description: "Terminou uma rodada no pódio", icon: "🏆", sort_order: 5 },
  { id: "zebra", title: "Zebra", description: "Acertou uma zebra histórica", icon: "🦓", sort_order: 6 },
  { id: "hexa-na-veia", title: "Hexa na Veia", description: "Cravou o campeão", icon: "👑", sort_order: 7 },
];

const PRIZE_CONFIG = [
  { slot: "champion", prize_label: "Mentoria individual grátis" },
  { slot: "runner_up", prize_label: "Acesso ao reforço de Constitucional" },
  { slot: "weekly", prize_label: "Resumos de Constitucional" },
  { slot: "streak", prize_label: "Material de revisão em dicas" },
];

async function main() {
  // Groups + teams
  const groupCodes = Object.keys(GROUPS);
  const teamIndex: Record<string, string[]> = {}; // code -> teamId[4]

  for (const code of groupCodes) {
    await prisma.group.upsert({
      where: { code },
      update: { name: `Grupo ${code}` },
      create: { code, name: `Grupo ${code}` },
    });
    teamIndex[code] = [];
    for (const t of GROUPS[code]) {
      const team = await prisma.team.create({
        data: { name: t.name, flag: t.flag, group_code: code },
      });
      teamIndex[code].push(team.id);
    }
  }

  // Group-stage matches: 72 total
  let count = 0;
  for (let gi = 0; gi < groupCodes.length; gi++) {
    const code = groupCodes[gi];
    for (const md of [1, 2, 3]) {
      const pairs = PAIRINGS[md];
      for (let pi = 0; pi < pairs.length; pi++) {
        const [h, a] = pairs[pi];
        const isOpener =
          code === "A" && md === 1; // both MD1 group A matches in the past + locked
        await prisma.match.create({
          data: {
            group_code: code,
            stage: Stage.group,
            matchday: md,
            home_team_id: teamIndex[code][h],
            away_team_id: teamIndex[code][a],
            kickoff_at: isOpener
              ? new Date("2026-06-11T13:00:00Z")
              : kickoffFor(md, gi, pi),
            locked: isOpener,
          },
        });
        count++;
      }
    }
  }
  console.log(`Group-stage matches created: ${count}`);

  // Knockout placeholder rows (teams null)
  const knockout: [Stage, number, string][] = [
    [Stage.r16, 16, "2026-07-04T16:00:00Z"],
    [Stage.qf, 8, "2026-07-09T16:00:00Z"],
    [Stage.sf, 4, "2026-07-14T16:00:00Z"],
    [Stage.final, 1, "2026-07-19T16:00:00Z"],
  ];
  for (const [stage, n, date] of knockout) {
    for (let i = 0; i < n; i++) {
      await prisma.match.create({
        data: { stage, kickoff_at: new Date(date), matchday: null },
      });
    }
  }

  // Badges
  for (const b of BADGES) {
    await prisma.badge.upsert({ where: { id: b.id }, update: b, create: b });
  }

  // Prize config
  for (const p of PRIZE_CONFIG) {
    await prisma.prizeConfig.upsert({
      where: { slot: p.slot },
      update: { prize_label: p.prize_label },
      create: p,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
