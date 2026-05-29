import * as Lark from '@larksuiteoapi/node-sdk';
import { config, validateConfig } from './config';
import { startWSClient, sendCard, startCardWebhook } from './bot/feishu';
import { handleCommand, setPollerRef } from './bot/commands';
import { startupCard } from './bot/cards';
import { MarketPoller } from './monitor/poller';

const VERSION = '1.2.0';

async function main(): Promise<void> {
  console.log('=== 42 Market Monitor ===');

  // Validate config
  validateConfig();
  console.log('[Config] OK');

  // Start market poller
  const poller = new MarketPoller();
  await poller.start();

  // Expose poller state to command handler
  setPollerRef(poller);

  // Send startup notification card
  try {
    await sendCard(
      config.feishu.chatId,
      startupCard({
        knownCount: poller.knownAddresses.size,
        pollInterval: config.monitor.pollIntervalMs,
        version: VERSION,
      })
    );
    console.log('[Startup] Notification card sent');
  } catch (err: any) {
    console.error('[Startup] Failed to send startup card:', err?.message);
  }

  // Set up Feishu event dispatcher (long connection)
  const eventDispatcher = new Lark.EventDispatcher({}).register({
    'im.message.receive_v1': async (data: any) => {
      const { message } = data;
      if (!message || message.message_type !== 'text') return;

      const chatId = message.chat_id;
      let text: string;
      try {
        text = JSON.parse(message.content).text;
      } catch {
        return;
      }

      await handleCommand(chatId, text);
    },
  });

  // Start WebSocket long connection
  startWSClient(eventDispatcher);
  console.log('[Feishu] WebSocket client started');

  // Start card action webhook server
  startCardWebhook();

  // Graceful shutdown
  const shutdown = () => {
    console.log('[Shutdown] Stopping...');
    poller.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
