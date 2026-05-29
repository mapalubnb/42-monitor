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

/** Calculate tradable time remaining */
export function tradableTime(endDate: string): string {
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diff = end - now;
  if (diff <= 0) return '已结束';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${mins}分钟`;
  return `${mins}分钟`;
}

/** Trading status based on market status and end date */
export function tradingStatus(market: Market): string {
  if (market.status === 'live') {
    const now = Date.now();
    const end = new Date(market.endDate).getTime();
    if (end > now) return '🟢 交易中';
    return '🟡 已截止，待结算';
  }
  if (market.status === 'ended') return '🔴 已结束';
  if (market.status === 'resolved') return '✅ 已结算';
  if (market.status === 'finalised') return '🏁 已完结';
  return market.status;
}

/** Market URL on 42.space */
export function marketUrl(market: Market): string {
  return `https://www.42.space/event/${market.address}`;
}
