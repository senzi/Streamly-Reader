# Streamly-Reader

面向长文本的流式阅读器，支持 Markdown/LaTeX 渲染、自动滚动与自定义字体。

在线演示: https://stream.closeai.moe

## 功能

- 打字机式流式输出，自动滚动跟随
- Markdown 基础语法与代码高亮
- LaTeX 行内与块级公式渲染
- 本地字体上传与持久化
- 速度调节，带轻微随机波动
- 纯中文 UI 与沉浸式阅读布局

## 快捷操作

- 回车开始流式输出
- Shift + 回车换行

## 技术栈

- Vue 3 + Vite
- Pinia
- Dexie (IndexedDB)
- markdown-it + KaTeX + highlight.js

## 开发

```bash
bun install
bun run dev
```

## 构建

```bash
bun run build
```
