# koishi-plugin-chatluna-think-viewer

通过命令或快捷关键词查看 `chatluna-character` 最近一次回复中的 `<think>` 思考内容，便于调试和复盘。

## 特性
- 复用 `chatluna-character` 内存，不额外占用数据库。
- 支持命令与无前缀关键词触发。
- 群聊可用，默认禁止私聊（可配置）。

## 安装
```bash
# 使用 Koishi 控制台市场搜索「chatluna-think-viewer」安装
# 或者 npm/yarn 安装：
npm install koishi-plugin-chatluna-think-viewer
# 或
yarn add koishi-plugin-chatluna-think-viewer
```

## 配置示例 (koishi.yml)
```yaml
plugins:
  chatluna-character: {}
  chatluna-think-viewer:
    command: think
    keywords:
      - 查看思考
      - 上次思考
    allowPrivate: false
    emptyMessage: 暂时没有可用的思考记录。
```

## 使用
- 群聊中发送 `think`（按你的命令前缀）或关键词“查看思考”/“上次思考”，返回上一条回复的 `<think>` 内容。

## 依赖
- koishi >= 4.18.0
- koishi-plugin-chatluna-character >= 0.0.180

## 协议
MIT
