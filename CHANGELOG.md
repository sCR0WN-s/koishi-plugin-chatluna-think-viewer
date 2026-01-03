# Changelog

## 2.3.0
- 全面清理项目文件的 BOM 标记，确保所有文件为标准 UTF-8 编码。
- 修复 `index.js` 和 `CHANGELOG.md` 中的所有中文乱码。

## 2.2.9
- 修复 `CHANGELOG.md` 编码问题。
- 更新文档中的依赖描述。

## 2.2.8
- 修复 `index.js` 中的中文乱码问题。
- 升级项目版本。

## 2.2.7
- 更新 `peerDependencies`，支持 `koishi-plugin-chatluna-character` 的所有版本（`*`）。

## 2.2.6
- 插件启动时自动给 `chatluna-character` 打补丁，优化消息截断逻辑。

## 2.0.0
- 新增异常输出自动处理功能（Guard）。
- 支持正则匹配和白名单过滤。

## 1.x
- 初始版本发布。