const { Schema } = require('koishi');

const name = 'chatluna-think-viewer';

const inject = {
  chatluna_character: { required: true },
  chatluna: { required: false },
};

const Config = Schema.object({
  command: Schema.string().default('think').description('命令名称'),
  keywords: Schema.array(Schema.string()).default(['查看思考', '上次思考']).description('无需前缀即可触发的关键词'),
  allowPrivate: Schema.boolean().default(false).description('是否允许在私聊中使用'),
  emptyMessage: Schema.string().default('暂时没有可用的思考记录。').description('没有记录时的提示文案'),
  renderImage: Schema.boolean().default(false).description('尝试使用 ChatLuna 的 image renderer 将思考内容渲染为图片发送，失败则回退文本'),
});

function extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          return part.text || part.content || part.value || '';
        }
        return '';
      })
      .join('');
  }
  if (content && typeof content === 'object') {
    if (typeof content.text === 'string') return content.text;
    if (typeof content.content === 'string') return content.content;
    if (typeof content.value === 'string') return content.value;
  }
  return '';
}

function extractThink(text) {
  const match = text.match(/<think>([\s\S]*?)<\/think>/i);
  return match?.[1]?.trim() ?? '';
}

function formatThink(text) {
  if (!text) return text;
  // 尝试 JSON 美化
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // 保留原文，去掉多余空行与统一左侧缩进
    const lines = text.split('\n').map((l) => l.trimEnd());
    const filtered = lines.filter((l, idx, arr) => !(l === '' && arr[idx - 1] === ''));
    const nonEmpty = filtered.filter((l) => l.trim().length > 0);
    const minIndent = nonEmpty.length
      ? Math.min(...nonEmpty.map((l) => l.match(/^(\s*)/)?.[1]?.length ?? 0))
      : 0;
    return filtered.map((l) => l.slice(minIndent)).join('\n');
  }
}

function getNthAiMessage(messages, n = 1) {
  if (!Array.isArray(messages) || n < 1) return null;
  let count = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const type = typeof msg?._getType === 'function' ? msg._getType() : msg?.type || msg?.role;
    if (type === 'ai' || type === 'assistant') {
      count++;
      if (count === n) return msg;
    }
  }
  return null;
}

function apply(ctx, config) {
  const cmd = ctx
    .command(`${config.command} [index:number]`, '获取上一条回复中的 <think> 内容（可指定倒数第 N 条）')
    .usage('不带参数默认读取最近一条；例如 think 2 读取倒数第二条 AI 回复的思考。');

  for (const keyword of config.keywords || []) {
    cmd.shortcut(keyword, { prefix: false });
  }

  cmd.action(async ({ session }, rawIndex) => {
    if (!config.allowPrivate && !session.guildId) {
      return '仅支持在群聊中查询。';
    }

    const service = ctx.chatluna_character;
    if (!service) return 'chatluna-character 未启用。';

    const temp = await service.getTemp(session);
    const messages = temp?.completionMessages || [];
    if (!messages.length) return config.emptyMessage;

    let targetIndex = parseInt(rawIndex, 10);
    if (!Number.isFinite(targetIndex) || targetIndex < 1) targetIndex = 1;

    const targetAi = getNthAiMessage(messages, targetIndex);
    if (!targetAi) return `找不到倒数第 ${targetIndex} 条 AI 回复的记录。`;

    const text = extractText(targetAi.content);
    if (!text) return '未找到可解析的回复内容。';

    const think = formatThink(extractThink(text));
    if (!think) return config.emptyMessage || '上一次回复中没有 <think> 字段。';

    if (config.renderImage && ctx.chatluna?.renderer) {
      try {
        const title = `### 上一条思考（倒数第 ${targetIndex} 条）`;
        const rendered = await ctx.chatluna.renderer.render({
          content: [
            { type: 'text', text: `${title}\n\n\`\`\`\n${think}\n\`\`\`` },
          ],
        }, { type: 'image', session });
        if (rendered?.length) return rendered.map((r) => r.element);
      } catch (err) {
        ctx.logger?.warn?.('[think-viewer] image render failed, fallback text', err);
      }
    }

    return `上一条思考：\n${think}`;
  });
}

module.exports = {
  name,
  apply,
  Config,
  inject,
};
