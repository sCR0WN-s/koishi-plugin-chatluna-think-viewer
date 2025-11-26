# Changelog

## 2.0.1
- 默认关闭严格输出白名单，避免正常消息被误撤回；仅在启用 `guardStrictOutputOnly` 时才校验严格格式。
- 补充 README，说明严格模式用途与默认行为。

## 2.0.0
- 新增严格输出模式，可拦截不符合 `<output><message>…</message></output>` 的回复。
- 扩展默认禁用正则（<status>/<output>/<analysis>/<system> 等标签，think/json/yaml 代码块）。

## 1.x
- 基础功能：查看 chatluna-character 最近一次 `<think>`，支持关键词/命令。
