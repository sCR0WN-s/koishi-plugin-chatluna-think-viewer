const { Schema, h } = require('koishi');
const { Bot } = require('@satorijs/core');

const name = 'chatluna-think-viewer';

const inject = {
  chatluna_character: { required: true },
  chatluna: { required: false },
};

const defaultForbidden = [
  '<think>[\\s\\S]*?<\\/think>',
  '<status>[\\s\\S]*?<\\/status>',
  '<output>[\\s\\S]*?<\\/output>',
  '<analysis>[\\s\\S]*?<\\/analysis>',
  '<system>[\\s\\S]*?<\\/system>',
  '```\\s*think[\\s\\S]*?```',
  '```\\s*(json|yaml|yml)[\\s\\S]*?```',
  '"role"\\s*:\\s*"assistant"',
  '"analysis"\\s*:',
  '"thought"\\s*:',
  '(?:human_relations|人际关系)\\s*[:=]',
  '(?:memory|记忆|记忆点|总结)\\s*[:=]',
];

// 严格 <output><message>... 结构：允许文本 / <at>user_id</at> 文本 / <sticker>url</sticker>
// 1~5 条 message，@ 仅允许数字 user_id
const strictOutputPattern =
  '^\\s*<output>\\s*(<message>(?:<at>\\d+<\\/at>\\s*)?(?:<sticker>[^<]*<\\/sticker>|[^<]*)<\\/message>\\s*){1,5}<\\/output>\\s*$';

const Config = Schema.intersect([
  Schema.object({
    command: Schema.string().default('think').description('\u67e5\u770b\u601d\u8003\u5185\u5bb9\u7684\u6307\u4ee4\u540d'),
    keywords: Schema.array(Schema.string()).default(['\u67e5\u770b\u601d\u8003', '\u4e0a\u6b21\u601d\u8003']).description('\u53ef\u65e0\u524d\u7f00\u89e6\u53d1\u7684\u5173\u952e\u8bcd'),
    allowPrivate: Schema.boolean().default(false).description('\u662f\u5426\u5141\u8bb8\u5728\u79c1\u804a\u4e2d\u4f7f\u7528'),
    emptyMessage: Schema.string().default('\u6682\u65f6\u6ca1\u6709\u53ef\u7528\u7684\u601d\u8003\u8bb0\u5f55\u3002').description('\u6ca1\u6709\u8bb0\u5f55\u65f6\u7684\u63d0\u793a\u6587\u672c'),
    renderImage: Schema.boolean().default(false).description('\u662f\u5426\u901a\u8fc7\u0020\u0043\u0068\u0061\u0074\u004c\u0075\u006e\u0061\u0020\u0069\u006d\u0061\u0067\u0065\u0020\u0072\u0065\u006e\u0064\u0065\u0072\u0065\u0072\u0020\u5c06\u601d\u8003\u6e32\u67d3\u4e3a\u56fe\u7247\uff0c\u5931\u8d25\u65f6\u56de\u9000\u6587\u672c'),
  }).description('\u601d\u8003\u67e5\u770b\u914d\u7f6e'),
  Schema.object({
    guardEnabled: Schema.boolean().default(true).description('\u5f02\u5e38\u8f93\u51fa\u81ea\u52a8\u62e6\u622a\u5f00\u5173'),
    guardMode: Schema.union(['recall', 'block']).default('recall').description('\u0072\u0065\u0063\u0061\u006c\u006c\u003d\u5148\u53d1\u9001\u540e\u64a4\u56de\uff0c\u0062\u006c\u006f\u0063\u006b\u003d\u76f4\u63a5\u963b\u6b62\u53d1\u9001'),
    guardDelay: Schema.number().default(1).min(0).max(60).description('\u64a4\u56de\u5ef6\u8fdf\uff08\u79d2\uff09'),
    guardAllowPrivate: Schema.boolean().default(true).description('\u662f\u5426\u5728\u79c1\u804a\u4e2d\u4e5f\u542f\u7528\u62e6\u622a'),
    guardGroups: Schema.array(Schema.string()).default([]).description('\u53ea\u5728\u8fd9\u4e9b\u7fa4\u751f\u6548\uff0c\u7559\u7a7a\u8868\u793a\u5168\u90e8'),
    guardForbiddenPatterns: Schema.array(Schema.string())
      .default(defaultForbidden)
      .description('\u547d\u4e2d\u5373\u89c6\u4e3a\u5f02\u5e38\u7684\u6a21\u5f0f\uff0c\u7528\u4e8e\u907f\u514d\u601d\u8003\u6cc4\u9732\u6216\u0020\u004a\u0053\u004f\u004e\u0020\u751f\u51fa'),
    guardAllowedPatterns: Schema.array(Schema.string())
      .default(['[\\s\\S]+'])
      .description('\u53ef\u9009\u767d\u540d\u5355\uff0c\u81f3\u5c11\u5339\u914d\u4e00\u4e2a\u624d\u7b97\u6b63\u5e38'),
    guardStrictOutputOnly: Schema.boolean()
      .default(false)
      .description('\u53ea\u5141\u8bb8\u7b26\u5408 <output><message>\u2026</message></output> \u7ed3\u6784\u7684\u6d88\u606f\uff0c\u4e0d\u7b26\u5408\u5373\u62e6\u622a/\u64a4\u56de'),
    guardStrictPattern: Schema.string()
      .default(strictOutputPattern)
      .description('\u81ea\u5b9a\u4e49\u4e25\u683c\u8f93\u51fa\u6b63\u5219\uff1b\u4e3a\u7a7a\u65f6\u4f7f\u7528\u5185\u7f6e\u7684 <output><message>\u2026</message> \u89c4\u5219'),
    guardLog: Schema.boolean().default(true).description('\u662f\u5426\u5728\u65e5\u5fd7\u8bb0\u5f55\u5f02\u5e38\u539f\u56e0\u548c\u5185\u5bb9'),
    guardContentPreview: Schema.number().default(80).min(10).max(500).description('\u65e5\u5fd7\u5185\u5bb9\u9884\u89c8\u957f\u5ea6'),
  }).description('\u5f02\u5e38\u8f93\u51fa\u81ea\u52a8\u5904\u7406'),
]);

function extractText(content) {
  if (content == null) return '';
  const normalized = h.normalize(content);
  const parts = [];
  for (const el of normalized) {
    if (typeof el === 'string') {
      parts.push(el);
      continue;
    }
    if (Array.isArray(el.children) && el.children.length) {
      parts.push(extractText(el.children));
    }
    const textLike = el.attrs?.content ?? el.attrs?.text ?? el.children?.join?.('') ?? '';
    if (textLike) parts.push(textLike);
  }
  return parts.join('');
}

function extractThink(text) {
  // \u67d0\u4e9b\u6a21\u578b/\u4e2d\u95f4\u4ef6\u4f1a\u5728\u540c\u4e00\u6761\u6d88\u606f\u91cc\u591a\u6b21\u51fa\u73b0 <think>\uff0c\u53d6\u6700\u540e\u4e00\u6b21
  let last = '';
  const regex = /<think>([\s\S]*?)<\/think>/gi;
  let m;
  while ((m = regex.exec(text)) !== null) {
    last = m[1];
  }
  return last.trim();
}

function formatThink(text) {
  if (!text) return text;
  // \u5c1d\u8bd5\u683c\u5f0f\u5316 JSON\uff0c\u5931\u8d25\u5219\u505a\u57fa\u7840\u53bb\u7a7a\u884c/\u7f29\u8fdb\u7f8e\u5316
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    const lines = text.split('\n').map((l) => l.trimEnd());
    const filtered = lines.filter((l, idx, arr) => !(l === '' && arr[idx - 1] === ''));
    const nonEmpty = filtered.filter((l) => l.trim().length > 0);
    const minIndent = nonEmpty.length
      ? Math.min(
          ...nonEmpty.map((l) => {
            const m = l.match(/^(\s*)/);
            return m ? m[1].length : 0;
          }),
        )
      : 0;
    return filtered.map((l) => l.slice(minIndent)).join('\n');
  }
}

function parseIndex(rawIndex) {
  if (!rawIndex) return 1;
  if (typeof rawIndex === 'number' && Number.isFinite(rawIndex) && rawIndex > 0) return Math.floor(rawIndex);
  const match = String(rawIndex).match(/\d+/);
  if (!match) return 1;
  const num = parseInt(match[0], 10);
  return Number.isFinite(num) && num > 0 ? num : 1;
}

function getNthAiMessage(messages, n = 1) {
  if (!Array.isArray(messages) || n < 1) return null;
  let count = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const type = typeof msg?._getType === 'function' ? msg._getType() : msg?.type || msg?.role;
    if (type === 'ai' || type === 'assistant') {
      count += 1;
      if (count === n) return msg;
    }
  }
  return null;
}

function getNthThink(messages, n = 1) {
  if (!Array.isArray(messages) || n < 1) return null;
  let count = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const type = typeof msg?._getType === 'function' ? msg._getType() : msg?.type || msg?.role;
    if (type !== 'ai' && type !== 'assistant') continue;
    const think = extractThink(extractText(msg.content));
    if (!think) continue;
    count += 1;
    if (count === n) return think;
  }
  return null;
}

function getLatestRawThink(temp) {
  if (!temp) return '';
  const candidates = [
    temp?.lastCompletion?.raw?.choices?.[0]?.message?.content,
    temp?.lastCompletion?.raw?.content,
    temp?.lastCompletion?.content,
  ];
  for (const c of candidates) {
    const think = extractThink(extractText(c));
    if (think) return think;
  }
  return '';
}

function compileRegex(list) {
  return (list || [])
    .map((p) => {
      try {
        return new RegExp(p, 'i');
      } catch (err) {
        return null;
      }
    })
    .filter(Boolean);
}

function detectAbnormal(text, forbidden, allowed, strictMode = false) {
  if (!text) return null;
  for (const re of forbidden) {
    if (re.test(text)) return `\u547d\u4e2d\u7981\u6b62\u6a21\u5f0f: /${re.source}/`;
  }
  if (allowed.length && !allowed.some((re) => re.test(text))) {
    return '\u672a\u5339\u914d\u4efb\u4f55\u5141\u8bb8\u6a21\u5f0f';
  }
  return null;
}

function shorten(text, limit = 80) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...(${text.length} chars)`;
}

function shouldGuard(config, options) {
  const session = options?.session;
  if (!session) return false;
  const guildId = session.guildId || session.event?.guild?.id;
  const isGroup = !!guildId;
  if (!config.guardAllowPrivate && !isGroup) return false;
  if (config.guardGroups?.length && isGroup && !config.guardGroups.includes(guildId)) return false;
  return true;
}

function applyGuard(ctx, config) {
  if (!config.guardEnabled) return;
  const logger = ctx.logger(`${name}:guard`);
  const forbidden = compileRegex(config.guardForbiddenPatterns);
  const allowed = config.guardStrictOutputOnly
    ? compileRegex([config.guardStrictPattern || strictOutputPattern])
    : compileRegex(config.guardAllowedPatterns);
  const original = Bot.prototype.sendMessage;

  Bot.prototype.sendMessage = async function patched(channelId, content, referrer, options = {}) {
    if (!shouldGuard(config, options)) {
      return original.call(this, channelId, content, referrer, options);
    }

    const text = extractText(content);
    const reason = detectAbnormal(text, forbidden, allowed);

    if (!reason) {
      return original.call(this, channelId, content, referrer, options);
    }

    const preview = shorten(text, config.guardContentPreview);
    if (config.guardMode === 'block') {
      if (config.guardLog) logger.warn(`[block] ${reason} | content: ${preview}`);
      return [];
    }

    const ids = await original.call(this, channelId, content, referrer, options);
    if (config.guardLog) logger.warn(`[recall] ${reason} | content: ${preview}`);
    const delay = Math.max(0, config.guardDelay) * 1000;
    if (Array.isArray(ids) && ids.length && typeof this.deleteMessage === 'function') {
      setTimeout(() => {
        for (const id of ids) {
          this.deleteMessage(channelId, id).catch((err) => {
            logger.warn(`[recall-failed] id=${id} reason=${err?.message || err}`);
          });
        }
      }, delay);
    }
    return ids;
  };

  ctx.on('dispose', () => {
    Bot.prototype.sendMessage = original;
  });
}

function apply(ctx, config) {
  // \u601d\u8003\u67e5\u770b\u6307\u4ee4
  const cmd = ctx
    .command(`${config.command} [index:string]`, '\u8bfb\u53d6\u4e0a\u4e00\u6761\u542b <think> \u7684\u5185\u5bb9\uff0c\u53ef\u6307\u5b9a\u5012\u6570\u7b2c N \u6761')
    .usage('\u4e0d\u5e26\u53c2\u6570\u9ed8\u8ba4\u6700\u65b0\uff1b\u793a\u4f8b\uff1athink 2 \u67e5\u8be2\u5012\u6570\u7b2c 2 \u6761 AI \u56de\u590d\u7684\u601d\u8003');

  for (const keyword of config.keywords || []) {
    cmd.shortcut(keyword, { prefix: false });
  }

  cmd.action(async ({ session, args }, rawIndex) => {
    if (!config.allowPrivate && !session.guildId) {
      return '\u4e0d\u652f\u6301\u5728\u79c1\u804a\u4e2d\u67e5\u8be2\u3002';
    }

    const service = ctx.chatluna_character;
    if (!service) return 'chatluna-character \u672a\u52a0\u8f7d\u3002';

    const temp = await service.getTemp(session);
    const targetIndex = parseIndex(rawIndex ?? args?.[0]);

    // 1) \u4f18\u5148\u8bfb\u53d6\u6700\u65b0\u4e00\u6b21\u539f\u59cb\u54cd\u5e94\uff08\u901a\u5e38\u4ecd\u542b <think>\uff09\uff0c\u4ec5\u5bf9\u7b2c 1 \u6761\u6709\u6548
    const thinkFromRaw = targetIndex === 1 ? getLatestRawThink(temp) : '';

    // 2) \u5386\u53f2 completionMessages \u4e2d\u771f\u6b63\u5e26 <think> \u7684 AI \u6d88\u606f
    const messages = temp?.completionMessages || [];
    const thinkFromHistory = thinkFromRaw ? '' : getNthThink(messages, targetIndex);

    // 3) \u56de\u9000\uff1a\u7b2c N \u6761 AI \u6d88\u606f\u518d\u5c1d\u8bd5\u62bd\u53d6 <think>
    const fallbackMsg = thinkFromRaw || thinkFromHistory ? null : getNthAiMessage(messages, targetIndex);
    const think = thinkFromRaw || thinkFromHistory || extractThink(extractText(fallbackMsg?.content));
    const formatted = formatThink(think);
    if (!formatted) return config.emptyMessage;

    if (config.renderImage && ctx.chatluna?.renderer) {
      try {
        const title = `### \u4e0a\u4e00\u6761\u601d\u8003\uff08\u5012\u6570\u7b2c ${targetIndex} \u6761\uff09`;
        const markdown = `<div align="center">\n${title}\n</div>\n\n<div align="left">\n${formatted}\n</div>`;
        const rendered = await ctx.chatluna.renderer.render(
          {
            content: [{ type: 'text', text: markdown }],
          },
          { type: 'image', session },
        );
        if (rendered?.length) return rendered.map((r) => r.element);
      } catch (err) {
        ctx.logger?.warn?.('[think-viewer] image render failed, fallback text', err);
      }
    }

    return `\u4e0a\u4e00\u6761\u601d\u8003\uff08\u5012\u6570\u7b2c ${targetIndex} \u6761\uff09\n${formatted}`;
  });

  // \u5f02\u5e38\u8f93\u51fa\u81ea\u52a8\u5904\u7406
  applyGuard(ctx, config);
}

module.exports = {
  name,
  apply,
  Config,
  inject,
};
