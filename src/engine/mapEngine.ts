import { TileType, ZoneConfig } from '../data/campaignData';

export type Direction = 'up' | 'down' | 'left' | 'right';

const WALKABLE: TileType[] = ['walkable', 'npc', 'terminal', 'item', 'gate', 'exit'];

export function canMoveTo(tile: TileType): boolean {
  return WALKABLE.includes(tile);
}

export function getNextPos(
  pos: [number, number],
  dir: Direction,
  grid: TileType[][]
): [number, number] | null {
  const [r, c] = pos;
  const next: Record<Direction, [number, number]> = {
    up: [r - 1, c],
    down: [r + 1, c],
    left: [r, c - 1],
    right: [r, c + 1],
  };
  const [nr, nc] = next[dir];
  const rows = grid.length;
  const cols = grid[0].length;
  if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return null;
  if (!canMoveTo(grid[nr][nc])) return null;
  return [nr, nc];
}

export function getInteractionKey(pos: [number, number]): string {
  return `${pos[0]},${pos[1]}`;
}

export function getInteraction(pos: [number, number], zone: ZoneConfig) {
  return zone.interactions[getInteractionKey(pos)] ?? null;
}

export function getTile(pos: [number, number], grid: TileType[][]): TileType {
  return grid[pos[0]]?.[pos[1]] ?? 'wall';
}
