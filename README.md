# koishi-plugin-chatluna-think-viewer

通过命令/关键词查看 `chatluna-character` 最近一次回复的 `<think>` 思考内容，并提供“发送后检测并自动撤回”守卫。

## 功能
- 依赖 `chatluna-character` 存储的思考上下文，支持命令与前缀关键词调用。
- 支持群聊使用（可配置是否允许私聊）。
- **异常格式自动撤回**：消息先发送，再检测；命中 `<think>`、`<status>`、`<output>`、`<analysis>`、`<system>` 等关键词/正则或你自定义的模式后，按延迟撤回。
- **关键词模式**（默认）：`guardKeywordMode=true` 时用不区分大小写的子串匹配；关闭后改为正则匹配。
- **严格输出模式**（可选）：仅当开启 `guardStrictOutputOnly` 时，要求 `<output><message>…</message></output>` 结构；默认关闭以避免误撤回。

## 安装
```bash
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
    # 守卫配置（发送后检测再撤回）
    guardEnabled: true
    guardMode: recall   # 保留字段，实际行为均为先发后撤回
    guardDelay: 1       # 撤回延迟（秒）
    guardKeywordMode: true           # 子串匹配关键词（默认）
    guardStrictOutputOnly: false     # 严格格式校验默认关闭
    guardForbiddenPatterns:
      - '<think>'
      - '<status>'
      - '<output>'
```

## 使用
- 群聊里发送 `think` 或配置的关键词查看最近一次 `<think>` 内容；`think 2` 查看倒数第 2 条。
- 守卫：当 bot 发送的消息命中禁用规则（或在你开启严格模式时不符合格式）会记录日志并延迟撤回。

## 依赖
- koishi >= 4.18.0
- koishi-plugin-chatluna-character >= 0.0.180

## 协议
MIT
