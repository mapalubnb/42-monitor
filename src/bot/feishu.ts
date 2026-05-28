import * as Lark from '@larksuiteoapi/node-sdk';
import { config } from '../config';

let client: Lark.Client;
let wsClient: Lark.WSClient;

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
