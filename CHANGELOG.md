# Changelog

## 2.2.3
- 重新打包为无 BOM 的 package.json，修复安装时 JSON 解析报错。

## 2.2.2
- 去除 BOM、修正 package.json 编码导致的加载/解析错误。

## 2.2.1
- 修复 README/CHANGELOG/元数据的乱码问题，更新中文描述。
- 同步中文注释，保持严格模式说明可读。

## 2.2.0
- 优化撤回延迟与日志提示，避免发送后立刻消失导致困惑。
- 默认启用关键词子串匹配；严格模式的白名单逻辑更清晰。

## 2.1.1
- 新增 `guardKeywordMode`，默认 true（子串匹配，不区分大小写）；关闭后改用正则匹配。
- 调整默认拦截列表；在严格模式下校验输出格式。
- README 更新，说明“关键词 + 可选严格模式”的用法。

## 2.0.1
- 默认关闭严格输出校验，避免普通消息被误撤回；仅在开启 `guardStrictOutputOnly` 时校验格式。
- README 补充严格模式的用途与默认值。

## 2.0.0
- 新增严格输出模式，只允许 `<output><message>…</message></output>` 结构的回复。
- 扩展默认拦截：`<status>/<output>/<analysis>/<system>` 标签以及 think/json/yaml 代码块等。

## 1.x
- 初版：查看 chatluna-character 最近的 `<think>`，支持关键词/指令。