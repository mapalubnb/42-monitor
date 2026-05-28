import { FTClient } from '../api/client';
import { sendCard, sendText } from '../bot/feishu';
import { config } from '../config';
import {
  helpCard,
  statusCard,
  marketDetailCard,
  newMarketCard,
} from '../bot/cards';

// Reference to the poller so commands can read state
let pollerRef: { knownAddresses: Set<string>; paused: boolean; startTime: number } | null = null;

export function setPollerRef(ref: typeof pollerRef) {
  pollerRef = ref;
}

const ftClient = new FTClient();

export async function handleCommand(chatId: string, rawText: string): Promise<void> {
  // Strip @mention prefix in group chats
  const text = rawText.replace(/@_user_\d+\s*/g, '').trim();

  if (!text.startsWith('/')) return;

  const parts = text.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  try {
    switch (cmd) {
      case '/help':
        await sendCard(chatId, helpCard());
        break;

      case '/new':
        await handleNew(chatId);
        break;

      case '/status':
        await handleStatus(chatId);
        break;

      case '/market':
        await handleMarket(chatId, args[0]);
        break;

      case '/pause':
        if (pollerRef) pollerRef.paused = true;
        await sendText(chatId, '✅ 自动推送已暂停');
        break;

      case '/resume':
        if (pollerRef) pollerRef.paused = false;
        await sendText(chatId, '✅ 自动推送已恢复');
        break;

      default:
        await sendText(chatId, `未知指令: ${cmd}\n输入 /help 查看帮助`);
    }
  } catch (err: any) {
    console.error('[Command] Error handling:', cmd, err?.message || err);
    await sendText(chatId, `指令执行出错: ${err?.message || 'unknown'}`);
  }
}

async function handleNew(chatId: string): Promise<void> {
  const markets = await ftClient.getLatestMarkets(5);
  if (markets.length === 0) {
    await sendText(chatId, '当前没有活跃市场');
    return;
  }
  for (const m of markets.slice(0, 5)) {
    await sendCard(chatId, newMarketCard(m));
  }
}

async function handleStatus(chatId: string): Promise<void> {
  const info = {
    knownCount: pollerRef?.knownAddresses.size || 0,
    uptime: pollerRef ? (Date.now() - pollerRef.startTime) / 1000 : 0,
    pollInterval: config.monitor.pollIntervalMs,
    paused: pollerRef?.paused || false,
  };
  await sendCard(chatId, statusCard(info));
}

async function handleMarket(chatId: string, address?: string): Promise<void> {
  if (!address) {
    await sendText(chatId, '请提供市场地址，例如: /market 0x1234...');
    return;
  }
  const market = await ftClient.getMarket(address);
  if (!market) {
    await sendText(chatId, `未找到市场: ${address}`);
    return;
  }
  await sendCard(chatId, marketDetailCard(market));
}
