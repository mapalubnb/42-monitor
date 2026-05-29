import * as Lark from '@larksuiteoapi/node-sdk';
import http from 'http';
import { config } from '../config';
import { FTClient } from '../api/client';
import { marketDetailCard } from './cards';

let client: Lark.Client;
let wsClient: Lark.WSClient;
const ftClient = new FTClient();

export function getClient(): Lark.Client {
  if (!client) {
    client = new Lark.Client({
      appId: config.feishu.appId,
      appSecret: config.feishu.appSecret,
    });
  }
  return client;
}

export function startWSClient(
  eventDispatcher: Lark.EventDispatcher
): Lark.WSClient {
  wsClient = new Lark.WSClient({
    appId: config.feishu.appId,
    appSecret: config.feishu.appSecret,
    loggerLevel: Lark.LoggerLevel.info,
  });
  wsClient.start({ eventDispatcher });
  return wsClient;
}

/** Start HTTP server for card action webhook */
export function startCardWebhook(): void {
  const cardHandler = new Lark.CardActionHandler(
    {
      encryptKey: config.feishu.encryptKey,
      verificationToken: config.feishu.verificationToken,
    },
    async (data: any) => {
      try {
        const value = data?.action?.value;
        if (!value || value.action !== 'refresh') return;

        const address = value.market_address;
        if (!address) return;

        console.log(`[Card] Refresh requested for market: ${address}`);

        const market = await ftClient.getMarket(address);
        if (!market) {
          return {
            header: {
              template: 'red',
              title: { tag: 'plain_text', content: '❌ 刷新失败' },
            },
            elements: [
              { tag: 'markdown', content: '未找到该市场数据' },
            ],
          };
        }

        // Return new card content to replace the current card
        return JSON.parse(marketDetailCard(market));
      } catch (err: any) {
        console.error('[Card] Refresh error:', err?.message || err);
        return undefined;
      }
    }
  );

  const port = config.monitor.cardWebhookPort;
  const server = http.createServer();
  server.on('request', Lark.adaptDefault('/webhook/card', cardHandler));
  server.listen(port, () => {
    console.log(`[Card Webhook] Listening on port ${port}`);
  });
}

/** Send an interactive card message to the configured chat */
export async function sendCard(chatId: string, cardContent: string): Promise<void> {
  const c = getClient();
  try {
    await c.im.message.create({
      params: { receive_id_type: 'chat_id' },
      data: {
        receive_id: chatId,
        msg_type: 'interactive',
        content: cardContent,
      },
    });
  } catch (err: any) {
    console.error('[Feishu] Failed to send card:', err?.message || err);
  }
}

/** Send a simple text message */
export async function sendText(chatId: string, text: string): Promise<void> {
  const c = getClient();
  try {
    await c.im.message.create({
      params: { receive_id_type: 'chat_id' },
      data: {
        receive_id: chatId,
        msg_type: 'text',
        content: JSON.stringify({ text }),
      },
    });
  } catch (err: any) {
    console.error('[Feishu] Failed to send text:', err?.message || err);
  }
}
