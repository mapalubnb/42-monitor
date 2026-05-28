import { FTClient, Market } from '../api/client';
import { sendCard } from '../bot/feishu';
import { newMarketCard, newMarketsBatchCard } from '../bot/cards';
import { config } from '../config';

export class MarketPoller {
  public knownAddresses: Set<string> = new Set();
  public paused = false;
  public startTime = Date.now();

  private ftClient: FTClient;
  private chatId: string;
  private intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  constructor() {
    this.ftClient = new FTClient();
    this.chatId = config.feishu.chatId;
    this.intervalMs = config.monitor.pollIntervalMs;
  }

  async start(): Promise<void> {
    console.log('[Poller] Initializing — loading existing markets...');

    // First run: load all existing live markets into known set (no notifications)
    try {
      const existing = await this.ftClient.getLatestMarkets(500);
      for (const m of existing) {
        this.knownAddresses.add(m.address);
      }
      this.initialized = true;
      console.log(`[Poller] Initialized with ${this.knownAddresses.size} known markets`);
    } catch (err: any) {
      console.error('[Poller] Init failed, retrying in 5s:', err?.message);
      setTimeout(() => this.start(), 5000);
      return;
    }

    // Start polling loop
    this.timer = setInterval(() => this.poll(), this.intervalMs);
    console.log(`[Poller] Polling every ${this.intervalMs}ms`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[Poller] Stopped');
  }

  private async poll(): Promise<void> {
    if (!this.initialized) return;

    try {
      const markets = await this.ftClient.getLatestMarkets(30);
      const newMarkets: Market[] = [];

      for (const m of markets) {
        if (!this.knownAddresses.has(m.address)) {
          this.knownAddresses.add(m.address);
          newMarkets.push(m);
        }
      }

      if (newMarkets.length === 0) return;

      console.log(`[Poller] Found ${newMarkets.length} new market(s)`);

      if (this.paused) {
        console.log('[Poller] Push paused, skipping notification');
        return;
      }

      // Send notifications
      if (newMarkets.length <= 3) {
        // Individual cards for 1-3 new markets
        for (const m of newMarkets) {
          await sendCard(this.chatId, newMarketCard(m));
        }
      } else {
        // Batch card for 4+ new markets
        await sendCard(this.chatId, newMarketsBatchCard(newMarkets));
      }
    } catch (err: any) {
      console.error('[Poller] Poll error:', err?.message || err);
    }
  }
}
