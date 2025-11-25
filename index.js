const { Schema, h } = require('koishi');
const { Bot } = require('@satorijs/core');

const name = 'chatluna-think-viewer';

const inject = {
  chatluna_character: { required: true },
  chatluna: { required: false },
};

const defaultForbidden = [
  '<think>[\\s\\S]*?<\\/think>',
  '```\\s*think[\\s\\S]*?```',
  '"role"\\s*:\\s*"assistant"',
  '"analysis"\\s*:',
  '"thought"\\s*:',
];

const Config = Schema.intersect([
  Schema.object({
    command: Schema.string().default('think').description('�鿴˼�����ݵ�ָ����'),
    keywords: Schema.array(Schema.string()).default(['�鿴˼��', '�ϴ�˼��']).description('����ǰ��ָ��Ĺؼ���'),
    allowPrivate: Schema.boolean().default(false).description('�Ƿ�������˽��ʹ��'),
    emptyMessage: Schema.string().default('��ʱû�п��õ�˼����¼��').description('û�м�¼ʱ����ʾ�ı�'),
    renderImage: Schema.boolean().default(false).description('�Ƿ�ͨ�� ChatLuna �� image renderer ��˼����ȾΪͼƬ��ʧ��ʱ�����ı�'),
  }).description('˼���鿴����'),
  Schema.object({
    guardEnabled: Schema.boolean().default(true).description('����쳣��ʽ���Զ�����/����'),
    guardMode: Schema.union(['recall', 'block']).default('recall').description('recall=�ȷ��󳷻أ�block=ֱ����ֹ����'),
    guardDelay: Schema.number().default(1).min(0).max(60).description('�����ӳ٣��룩'),
    guardAllowPrivate: Schema.boolean().default(true).description('�Ƿ���˽���������쳣���'),
    guardGroups: Schema.array(Schema.string()).default([]).description('ֻ����ЩȺ���ã���ձ�ʾȫ��'),
    guardForbiddenPatterns: Schema.array(Schema.string())
      .default(defaultForbidden)
      .description('��������������Ϊ�쳣������˼����й©������ JSON ��'),
    guardAllowedPatterns: Schema.array(Schema.string())
      .default(['[\\s\\S]+'])
      .description('��ѡ�İ�����������������һ������Ϊ����'),
    guardLog: Schema.boolean().default(true).description('�Ƿ�����־�м�¼�쳣���ݺ�ԭ��'),
    guardContentPreview: Schema.number().default(80).min(10).max(500).description('��־�ﱣ�������Ԥ���ַ���'),
  }).description('�쳣��ʽ�Զ�����'),
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
  // ĳЩģ��/�м������ͬһ����Ϣ���γ��� <think>��ȡ���һ�γ��ֵ�Ƭ��
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
  // ���Ը�ʽ�� JSON��ʧ�����ȥ��β/�ϲ�����
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
  return (list || []).map((p) => {
    try {
      return new RegExp(p, 'i');
    } catch (err) {
      return null;
    }
  }).filter(Boolean);
}

function detectAbnormal(text, forbidden, allowed) {
  if (!text) return null;
  for (const re of forbidden) {
    if (re.test(text)) return `���н�ֹ����: /${re.source}/`;
  }
  if (allowed.length && !allowed.some((re) => re.test(text))) {
    return 'δ�����κΰ���������';
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
  const allowed = compileRegex(config.guardAllowedPatterns);
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
  // ˼���鿴����
  const cmd = ctx
    .command(`${config.command} [index:string]`, '��ȡ���һ�ΰ��� <think> �����ݣ���ָ���� N ��')
    .usage('���� think 2 �ɲ鿴������ 2 �� AI �ظ���˼������');

  for (const keyword of config.keywords || []) {
    cmd.shortcut(keyword, { prefix: false });
  }

  cmd.action(async ({ session, args }, rawIndex) => {
    if (!config.allowPrivate && !session.guildId) {
      return '��֧����˽�����ѯ��';
    }

    const service = ctx.chatluna_character;
    if (!service) return 'chatluna-character δ���ء�';

    const temp = await service.getTemp(session);
    const targetIndex = parseIndex(rawIndex ?? args?.[0]);

    // 1) �ȶ����һ��ԭʼ��Ӧ��ͨ��ֻ�Ե� 1 ����Ч��
    const thinkFromRaw = targetIndex === 1 ? getLatestRawThink(temp) : '';

    // 2) ����ʷ completionMessages �в��Ұ��� <think> �� AI ��Ϣ
    const messages = temp?.completionMessages || [];
    const thinkFromHistory = thinkFromRaw ? '' : getNthThink(messages, targetIndex);

    // 3) ���ף�ȡ�� N �� AI ��Ϣ�ٴ�����ȡ <think>
    const fallbackMsg = thinkFromRaw || thinkFromHistory ? null : getNthAiMessage(messages, targetIndex);
    const think = thinkFromRaw || thinkFromHistory || extractThink(extractText(fallbackMsg?.content));
    const formatted = formatThink(think);
    if (!formatted) return config.emptyMessage;

    if (config.renderImage && ctx.chatluna?.renderer) {
      try {
        const title = `### ���˼�����ݣ������� ${targetIndex} ����`;
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

    return `���˼�����ݣ������� ${targetIndex} ����\n${formatted}`;
  });

  // �쳣��ʽ�Զ�����
  applyGuard(ctx, config);
}

module.exports = {
  name,
  apply,
  Config,
  inject,
};
