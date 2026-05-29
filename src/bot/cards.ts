import { Market } from '../api/client';
import { fmtPrice, fmtVolume, fmtDate, outcomesText, marketUrl, truncate, tradableTime, tradingStatus } from '../utils/format';

/** Build a card for a single new market notification */
export function newMarketCard(market: Market): string {
  const categories = [...(market.categories || []), ...(market.subcategories || [])];
  const tagLine = categories.length > 0 ? categories.join(' | ') : 'Uncategorized';
  const startTime = market.startDate ? fmtDate(market.startDate) : 'N/A';
  const endTime = market.endDate ? fmtDate(market.endDate) : 'N/A';
  const url = marketUrl(market);
  const remaining = market.endDate ? tradableTime(market.endDate) : 'N/A';
  const status = tradingStatus(market);

  const card = {
    config: { wide_screen_mode: true },
    header: {
      template: 'green',
      title: { tag: 'plain_text', content: '🟢 新市场上线' },
    },
    elements: [
      {
        tag: 'markdown',
        content: `**${market.question}**`,
      },
      {
        tag: 'column_set',
        flex_mode: 'bisect',
        background_style: 'grey',
        columns: [
          {
            tag: 'column',
            width: 'weighted',
            weight: 1,
            vertical_align: 'top',
            elements: [
              {
                tag: 'markdown',
                content: [
                  `**状态：** ${status}`,
                  `**抵押品：** ${market.collateralSymbol || 'BUSDT'}`,
                  `**分类：** ${tagLine}`,
                ].join('\n'),
              },
            ],
          },
          {
            tag: 'column',
            width: 'weighted',
            weight: 1,
            vertical_align: 'top',
            elements: [
              {
                tag: 'markdown',
                content: [
                  `**开始：** ${startTime}`,
                  `**结束：** ${endTime}`,
                  `**可交易时间：** ${remaining}`,
                ].join('\n'),
              },
            ],
          },
        ],
      },
      { tag: 'hr' },
      {
        tag: 'markdown',
        content: `**选项**\n${outcomesText(market.outcomes)}`,
      },
      {
        tag: 'markdown',
        content: `**当前交易状态**\n💵 交易量: ${fmtVolume(market.volume || 0)} ${market.collateralSymbol || 'BUSDT'}  |  🏦 市值: ${fmtVolume(market.totalMarketCap || 0)}  |  👥 交易者: ${market.traders || 0}`,
      },
      { tag: 'hr' },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '查看详情' },
            type: 'primary',
            url,
          },
        ],
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `创建于 ${fmtDate(market.createdAt)}`,
          },
        ],
      },
    ],
  };

  return JSON.stringify(card);
}

/** Build a card listing multiple new markets (batch notification) */
export function newMarketsBatchCard(markets: Market[]): string {
  const items = markets.map((m) => {
    const topOutcome = m.outcomes?.[0];
    const priceLine = topOutcome
      ? `${topOutcome.name}: \`${(topOutcome.price * 100).toFixed(1)}%\``
      : '';
    return `**${truncate(m.question, 50)}**\n${priceLine}  |  ${(m.categories || []).join(', ') || '-'}`;
  });

  const card = {
    config: { wide_screen_mode: true },
    header: {
      template: 'green',
      title: {
        tag: 'plain_text',
        content: `🟢 ${markets.length} 个新市场上线`,
      },
    },
    elements: [
      {
        tag: 'markdown',
        content: items.join('\n\n---\n\n'),
      },
      { tag: 'hr' },
      {
        tag: 'note',
        elements: [
          { tag: 'plain_text', content: `检测时间: ${fmtDate(new Date().toISOString())}` },
        ],
      },
    ],
  };

  return JSON.stringify(card);
}

/** Build help card */
export function helpCard(): string {
  const card = {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { tag: 'plain_text', content: '42 Monitor - 帮助' },
    },
    elements: [
      {
        tag: 'markdown',
        content: [
          '**可用指令：**',
          '',
          '`/help` - 显示帮助信息',
          '`/new` - 查看最近上线的市场',
          '`/status` - 查看监控状态',
          '`/market <地址>` - 查看指定市场详情',
          '`/pause` - 暂停自动推送',
          '`/resume` - 恢复自动推送',
        ].join('\n'),
      },
    ],
  };

  return JSON.stringify(card);
}

/** Build status card */
export function statusCard(info: {
  knownCount: number;
  uptime: number;
  pollInterval: number;
  paused: boolean;
}): string {
  const uptimeMin = Math.floor(info.uptime / 60);
  const uptimeH = Math.floor(uptimeMin / 60);
  const uptimeStr = uptimeH > 0 ? `${uptimeH}h ${uptimeMin % 60}m` : `${uptimeMin}m`;

  const card = {
    config: { wide_screen_mode: true },
    header: {
      template: info.paused ? 'orange' : 'blue',
      title: {
        tag: 'plain_text',
        content: info.paused ? '⏸ 监控已暂停' : '✅ 监控运行中',
      },
    },
    elements: [
      {
        tag: 'markdown',
        content: [
          `**已追踪市场数：** ${info.knownCount}`,
          `**轮询间隔：** ${info.pollInterval / 1000}s`,
          `**运行时长：** ${uptimeStr}`,
          `**推送状态：** ${info.paused ? '已暂停' : '运行中'}`,
        ].join('\n'),
      },
    ],
  };

  return JSON.stringify(card);
}

/** Build market detail card */
export function marketDetailCard(market: Market): string {
  const categories = [...(market.categories || []), ...(market.subcategories || [])];
  const url = marketUrl(market);

  const card = {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { tag: 'plain_text', content: '📊 市场详情' },
    },
    elements: [
      {
        tag: 'markdown',
        content: `**${market.question}**`,
      },
      {
        tag: 'markdown',
        content: [
          `📂 **分类：** ${categories.join(' | ') || '-'}`,
          `📊 **状态：** ${tradingStatus(market)}`,
          `⏰ **开始：** ${market.startDate ? fmtDate(market.startDate) : 'N/A'}`,
          `⏰ **截止：** ${market.endDate ? fmtDate(market.endDate) : 'N/A'}`,
          `⏳ **可交易时间：** ${market.endDate ? tradableTime(market.endDate) : 'N/A'}`,
          `💵 **交易量：** ${fmtVolume(market.volume || 0)} ${market.collateralSymbol || 'BUSDT'}`,
          `🏦 **市值：** ${fmtVolume(market.totalMarketCap || 0)}`,
          `👥 **交易者：** ${market.traders || 0}`,
        ].join('\n'),
      },
      { tag: 'hr' },
      {
        tag: 'markdown',
        content: `**选项**\n${outcomesText(market.outcomes)}`,
      },
      { tag: 'hr' },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '在 42.space 查看' },
            type: 'primary',
            url,
          },
        ],
      },
    ],
  };

  return JSON.stringify(card);
}

/** Build startup notification card */
export function startupCard(info: {
  knownCount: number;
  pollInterval: number;
  version: string;
}): string {
  const now = fmtDate(new Date().toISOString());
  const card = {
    config: { wide_screen_mode: true },
    header: {
      template: 'turquoise',
      title: { tag: 'plain_text', content: '🚀 42 Monitor 已启动' },
    },
    elements: [
      {
        tag: 'markdown',
        content: [
          `**启动时间：** ${now}`,
          `**版本：** ${info.version}`,
          `**已加载市场：** ${info.knownCount} 个`,
          `**轮询间隔：** ${info.pollInterval / 1000}s`,
          '',
          '监控已开始运行，发现新市场将自动推送到本群。',
        ].join('\n'),
      },
      { tag: 'hr' },
      {
        tag: 'markdown',
        content: [
          '**可用指令：**',
          '`/help` - 帮助  |  `/new` - 最新市场  |  `/status` - 运行状态',
          '`/market <地址>` - 市场详情  |  `/pause` / `/resume` - 暂停/恢复推送',
        ].join('\n'),
      },
    ],
  };

  return JSON.stringify(card);
}
