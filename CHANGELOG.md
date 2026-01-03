# Changelog

## 2.2.8
- 修复 `index.js` 中的中文乱码问题。
- 升级项目版本以配合 npm 发布。

## 2.2.7
- 更新 `peerDependencies`，将 `koishi-plugin-chatluna-character` 的版本要求改为 `*` 以支持所有版本。

## 2.2.6
- 插件启动时自动给 `chatluna-character` 打补丁，截断 `completionMessages` 只删除最旧的记录，避免 `think` 取到同一段。
- 插件卸载时恢复 `getTemp`。

## 2.2.5
- 提高 `<think>` 抽取兼容性：支持 LangChain 样式 content/children 对象，避免因内容结构不同而出现空结果。

## 2.2.4
- 修复某些环境下由于 BOM 头导致的 package.json 解析异常。

## 2.2.1
- 优化 README/CHANGELOG 文档描述。
- 增加对私聊环境的拦截开关支持。

## 2.1.1
- 优化 `guardKeywordMode` 逻辑。
- 修复在某些特定 Koishi 版本下的撤回逻辑兼容性。

## 2.0.0
- 新增异常输出自动处理功能（Guard）。
- 支持正则匹配和白名单过滤。
- 支持严格输出结构校验 `<output><message>...</message></output>`。

## 1.x
- 初始版本发布。
- 实现从 `chatluna-character` 中提取并查看 `<think>` 内容的基本功能。
