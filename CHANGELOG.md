# Changelog

## 2.1.1
- 新增 `guardKeywordMode`（默认 true）：按不区分大小写的关键词子串拦截，普通文字也能写；关掉后按正则匹配。
- 默认白名单为空且不校验，严格模式仍需显式开启才会检查输出格式。
- README 更新为“关键词+可选严格”的简化用法。

## 2.0.1
- 默认关闭严格输出校验，避免正常消息被误撤回；仅在开启 `guardStrictOutputOnly` 时才校验格式。
- 更新 README 说明严格模式用途与默认行为。

## 2.0.0
- 新增严格输出模式，可拦截不符合 `<output><message>…</message></output>` 的回复。
- 扩展默认禁用正则（<status>/<output>/<analysis>/<system> 等标签，think/json/yaml 代码块）。

## 1.x
- 基础功能：查看 chatluna-character 最近一次 `<think>`，支持关键词/命令。
