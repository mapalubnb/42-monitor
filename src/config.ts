import dotenv from 'dotenv';
dotenv.config();

export const config = {
  feishu: {
    appId: process.env.FEISHU_APP_ID || '',
    appSecret: process.env.FEISHU_APP_SECRET || '',
    chatId: process.env.FEISHU_CHAT_ID || '',
    encryptKey: process.env.FEISHU_ENCRYPT_KEY || '',
    verificationToken: process.env.FEISHU_VERIFICATION_TOKEN || '',
  },
  ft: {
    apiBase: process.env.FT_API_BASE || 'https://rest.ft.42.space',
  },
  monitor: {
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '3000', 10),
    cardWebhookPort: parseInt(process.env.CARD_WEBHOOK_PORT || '9042', 10),
  },
};

export function validateConfig(): void {
  const required = [
    ['FEISHU_APP_ID', config.feishu.appId],
    ['FEISHU_APP_SECRET', config.feishu.appSecret],
    ['FEISHU_CHAT_ID', config.feishu.chatId],
  ];
  const missing = required.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
