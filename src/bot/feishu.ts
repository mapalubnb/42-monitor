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
  const port = config.monitor.cardWebhookPort;

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/webhook/card') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }

    // Read request body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = Buffer.concat(chunks).toString('utf-8');

    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid json' }));
      return;
    }

    // Handle URL verification challenge
    if (payload.type === 'url_verification') {
      console.log('[Card Webhook] Challenge received');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ challenge: payload.challenge }));
      return;
    }

    // Handle card action
    try {
      const value = payload?.action?.value;
      if (value && value.action === 'refresh') {
        const address = value.market_address;
        console.log(`[Card] Refresh requested for market: ${address}`);

        const market = address ? await ftClient.getMarket(address) : null;
        if (market) {
          const card = JSON.parse(marketDetailCard(market));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(card));
          return;
        } else {
          const errorCard = {
            header: {
              template: 'red',
              title: { tag: 'plain_text', content: '❌ 刷新失败' },
            },
            elements: [
              { tag: 'markdown', content: '未找到该市场数据' },
            ],
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(errorCard));
          return;
        }
      }
    } catch (err: any) {
      console.error('[Card] Refresh error:', err?.message || err);
    }

    // Default: return 200 with empty JSON
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({}));
  });

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
