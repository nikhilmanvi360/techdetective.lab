export function getRankTitle(score: number): string {
  if (score < 50) return 'Script Kiddie';
  if (score < 150) return 'Junior Analyst';
  if (score < 300) return 'Cyber Ninja';
  if (score < 500) return 'Elite Hacker';
  return 'Master Sleuth';
}

export function getRankColor(score: number): string {
  if (score < 50) return 'text-gray-500';
  if (score < 150) return 'text-blue-400';
  if (score < 300) return 'text-purple-400';
  if (score < 500) return 'text-yellow-400';
  return 'text-red-500 font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]';
}
