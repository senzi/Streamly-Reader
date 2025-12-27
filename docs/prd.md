## 项目基本信息

* **仓库名 (Repository Name):** `FlowRead` 或 `Streamly-Reader`
* **英文简述 (Description):** A customizable, AI-inspired streaming reader that turns static text into an immersive, rhythmic reading experience with Markdown and LaTeX support.

---

## PRD (Product Requirements Document)

### 1. 项目愿景

提供一种类似 AI 交互的、具有节奏感的阅读方式。通过可调节的流式速度、自定义字体和 Markdown/LaTeX 渲染，将枯燥的长文本转化为沉浸式的视听反馈体验。

### 2. 核心功能需求

#### **A. 流式渲染引擎**

* **流式触发**：用户在输入框粘贴文本并点击“开始”后，内容以“打字机”模式逐字/逐词显示。
* **速度控制**：提供 1-100 级的速度调节（对应 Token 跳出的毫秒间隔）。
* **解析逻辑**：
* **Markdown**：支持基础语法（标题、列表、加粗、代码块）。
* **LaTeX**：识别 `$...$` 和 `$$...$$`，在符号闭合后瞬间完成公式渲染。
* **换行保留**：无论是纯文本还是 MD 格式，均需严格保留原始换行符。



#### **B. 字体管理与持久化 (Custom Fonts)**

* **本地上传**：支持用户上传 `.ttf` / `.otf` / `.woff` 文件。
* **持久化存储**：使用 **IndexedDB** 存储字体文件的 Blob 数据。
* **动态应用**：页面加载时自动从数据库读取字体，通过 `FontFace` API 动态注入 CSS。
* **字体切换**：支持在预设系统字体与用户自定义字体间快速切换。

#### **C. 交互与 UI (AI-Style)**

* **输入区域**：底部固定的聊天式输入框，支持多行文本粘贴。
* **阅读区域**：中间为内容展示区，流式输出时自动跟随滚动（Auto-scroll）。
* **状态标识**：输出过程中在文末显示闪烁光标（Cursor）。
* **操作看板**：
* **停止输出**：阅读中途可随时中断。
* **再读一遍**：输出结束后显示，点击重新开始流式动画。
* **复制内容**：一键复制全文。



### 3. 非功能需求

* **性能优化**：对于超长文本（如 10 万字），采用虚拟滚动或分段流式处理，避免 Markdown 频繁重绘导致的卡顿。
* **离线可用**：基于 Vite 的轻量化构建，支持纯前端运行，无需后端服务支持。

### 4. 技术栈推荐

* **框架**：Vue 3 (Vite)
* **状态管理**：Pinia (用于存储速度设置、字体配置)
* **数据库**：Dexie.js (封装好的 IndexedDB 库，操作简单)
* **渲染层**：`markdown-it` + `katex` + `highlight.js`


目前已经运行过 bun create vite . --template vue 命令
所以你不需要申请运行 bun run dev 命令
但是你可以自己运行 bun install 和 bun run build 来检查报错。

UI要用纯中文，不要英文。