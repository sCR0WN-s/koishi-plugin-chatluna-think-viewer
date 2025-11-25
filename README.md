# koishi-plugin-chatluna-think-viewer

通过命令/关键词查看 `chatluna-character` 最近一次回复的 `<think>` 思考内容，并提供“异常格式自动撤回/拦截”守卫。

## 功能
- 依赖 `chatluna-character` 存储的思考上下文，支持命令与前缀关键词调用。
- 支持群聊使用（可配置是否允许私聊）。
- **异常格式自动撤回/拦截**：默认检测 `<think>`、`<status>`、`<output>`、`<analysis>`、`<system>` 等块或调试 JSON、think/json/yaml 代码块；命中后可选择先发后撤回(recall)或直接阻止(block)。
- **严格输出模式（小白化）**：可选仅允许 `<output><message>…</message></output>` 结构；@ 仅允许数字 user_id，1~5 条 message，不符合即拦截/撤回。

## 安装
```bash
# Koishi 控制台市场搜索 chatluna-think-viewer 安装
npm install koishi-plugin-chatluna-think-viewer
```

## 配置示例 (koishi.yml)
```yaml
plugins:
  chatluna-character: {}
  chatluna-think-viewer:
    command: think
    keywords:
      - 查看思考
    allowPrivate: false
    emptyMessage: 暂时没有可用的思考记录。
    # 异常撤回/拦截
    guardEnabled: true
    guardMode: recall   # recall | block
    guardDelay: 1       # 撤回延迟（秒），block 模式忽略
    guardStrictOutputOnly: true        # 只允许 <output><message>…</message></output>
    guardStrictPattern: '^\s*<output>\s*(<message>(?:<at>\d+<\/at>\s*)?(?:<sticker>[^<]*<\/sticker>|[^<]*)<\/message>\s*){1,5}<\/output>\s*$'
    guardForbiddenPatterns:
      - '<think>[\\s\\S]*?<\\/think>'
      - '<status>[\\s\\S]*?<\\/status>'
      - '```\\s*think[\\s\\S]*?```'
```

## 使用
- 群聊里发送 `think` 或配置的关键词查看最近一次 `<think>` 内容；`think 2` 查看倒数第 2 条。
- 异常/严格模式：当 bot 发送的消息命中禁用规则或不符合严格输出结构时，记录日志并撤回（或直接阻止发送）。

## 依赖
- koishi >= 4.18.0
- koishi-plugin-chatluna-character >= 0.0.180

## 协议
MIT
