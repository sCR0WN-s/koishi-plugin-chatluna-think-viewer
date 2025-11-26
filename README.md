# koishi-plugin-chatluna-think-viewer

通过指令或关键词查看 `chatluna-character` 最近一次回复里的 `<think>` 思考内容，并提供输出拦截/撤回保护，防止模型把内部思考或异常格式直接发到群里。

## 功能
- 读取 `chatluna-character` 内存中的思考记录，支持指令和无前缀关键词触发。
- 可选私聊使用开关。
- **异常输出自动处理**：先发送、再检测；命中规则则按设置撤回（或直接阻断）。默认拦截 `<think>/<status>/<output>/<analysis>/<system>` 等标签、think/json/yaml 代码块。
- **关键词模式**：默认子串匹配（不区分大小写）；可切换为正则模式。
- **严格输出模式**：可选，仅允许 `<output><message>…</message></output>` 结构，不符即撤回/阻断。

## 安装
```bash
npm install koishi-plugin-chatluna-think-viewer
```

## 配置示例（koishi.yml）
```yaml
plugins:
  chatluna-character: {}
  chatluna-think-viewer:
    command: think
    keywords:
      - 查看思考
    allowPrivate: false
    emptyMessage: 暂时没有可用的思考记录。
    guardEnabled: true
    guardMode: recall      # recall=先发后撤回；block=直接阻断
    guardDelay: 1          # 撤回延迟（秒）
    guardKeywordMode: true # true=子串匹配；false=正则匹配
    guardStrictOutputOnly: false
    guardForbiddenPatterns:
      - '<think>'
      - '<status>'
      - '<output>'
```

## 使用
- 群里发送 `think` 或配置的关键词，查看最新 `<think>`；`think 2` 查看倒数第 2 条 AI 回复的思考。
- 如果最终发送的消息含异常标签/格式，守卫会按配置撤回或阻断，并在日志记录原因。

## 依赖
- koishi >= 4.18.0
- koishi-plugin-chatluna-character >= 0.0.180

## 许可证
MIT

