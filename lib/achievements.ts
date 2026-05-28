import type { Player, RouteStep } from "./types";

export type AchievementBadgeTone = "lime" | "warm";

export interface AchievementBadge {
  id:
    | "winner"
    | "speedrun"
    | "minimalist"
    | "explorer"
    | "last-stand"
    | "first-move"
    | "on-track";
  label: string;
  icon: string;
  tone: AchievementBadgeTone;
}

interface ComputeLiveBadgesInput {
  route: RouteStep[];
  status: Player["status"];
}

interface ComputeResultBadgesInput {
  player: Player;
  route: RouteStep[];
  winnerId: string | null;
}

export function computeLiveBadges({
  route,
  status,
}: ComputeLiveBadgesInput): AchievementBadge[] {
  const badges: AchievementBadge[] = [];
  const steps = countClicks(route);

  if (status === "playing") {
    badges.push({
      id: "on-track",
      label: "On Track",
      icon: "●",
      tone: "warm",
    });
  }

  if (steps >= 1) {
    badges.push({
      id: "first-move",
      label: "First Move",
      icon: "⚡",
      tone: "lime",
    });
  }

  if (steps >= 10) {
    badges.push({
      id: "explorer",
      label: "Explorer",
      icon: "↗",
      tone: "warm",
    });
  }

  return badges;
}

export function computeResultBadges({
  player,
  route,
  winnerId,
}: ComputeResultBadgesInput): AchievementBadge[] {
  const badges: AchievementBadge[] = [];
  const steps = countClicks(route);
  const finishTime = getFinishTime(player, route);

  if (winnerId === player.clientId) {
    badges.push({
      id: "winner",
      label: "Winner",
      icon: "🏆",
      tone: "lime",
    });
  }

  if (finishTime !== undefined && finishTime < 60) {
    badges.push({
      id: "speedrun",
      label: "Speedrun",
      icon: "⚡",
      tone: "lime",
    });
  }

  if (player.status === "finished" && steps <= 5) {
    badges.push({
      id: "minimalist",
      label: "Minimalist",
      icon: "◇",
      tone: "lime",
    });
  }

  if (steps >= 10) {
    badges.push({
      id: "explorer",
      label: "Explorer",
      icon: "↗",
      tone: "warm",
    });
  }

  if (player.status === "surrendered" && steps >= 5) {
    badges.push({
      id: "last-stand",
      label: "Last Stand",
      icon: "■",
      tone: "warm",
    });
  }

  return badges;
}

function countClicks(route: RouteStep[]): number {
  return Math.max(0, route.length - 1);
}

function getFinishTime(
  player: Player,
  route: RouteStep[],
): number | undefined {
  if (player.status !== "finished") return undefined;
  if (route.length === 0) return undefined;
  return route[route.length - 1].timestamp;
}

interface MiniLeaderboardEntry {
  clientId: string;
  username: string;
  steps: number;
  isMe: boolean;
  isWinner: boolean;
  isSurrendered: boolean;
  status: Player["status"];
}

interface ComputeMiniLeaderboardInput {
  players: Player[];
  currentClientId: string;
  winnerClientId: string | null;
}

export function computeMiniLeaderboard({
  players,
  currentClientId,
  winnerClientId,
}: ComputeMiniLeaderboardInput): MiniLeaderboardEntry[] {
  const entries: MiniLeaderboardEntry[] = players
    .filter((p) => p.status !== "waiting")
    .map((p) => ({
      clientId: p.clientId,
      username: p.username,
      steps: Math.max(0, p.route.length - 1),
      isMe: p.clientId === currentClientId,
      isWinner: p.clientId === winnerClientId,
      isSurrendered: p.status === "surrendered",
      status: p.status,
    }));

  return entries.sort((a, b) => {
    if (a.isMe) return -1;
    if (b.isMe) return 1;
    if (a.isWinner) return -1;
    if (b.isWinner) return 1;
    if (a.isSurrendered !== b.isSurrendered) {
      return a.isSurrendered ? 1 : -1;
    }
    return b.steps - a.steps;
  });
}
