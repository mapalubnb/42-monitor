import { Market, MarketOutcome } from '../api/client';

/** Format price to readable string */
export function fmtPrice(price: number): string {
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

/** Format volume / market cap */
export function fmtVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}K`;
  return vol.toFixed(2);
}

/** Format date string to readable */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

/** Truncate string */
export function truncate(s: string, max = 60): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

/** Build outcomes summary text for card */
export function outcomesText(outcomes: MarketOutcome[]): string {
  if (!outcomes || outcomes.length === 0) return '_No outcomes_';
  return outcomes
    .map((o) => {
      const pct = (o.price * 100).toFixed(1);
      return `**${o.name}**  \`${pct}%\``;
    })
    .join('\n');
}

/** Market URL on 42.space */
export function marketUrl(market: Market): string {
  return `https://42.space/market/${market.slug || market.address}`;
}
