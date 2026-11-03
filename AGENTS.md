# AGENTS.md

给 AI agent（Claude Code / Codex / Cursor 等）读的仓库说明。

## 项目概述

TapTalk（医疗沟通助手 / 开口说）是一个零依赖、离线优先的静态网页，面向术后、插管或暂时无法说话的患者。患者通过 3×3 大按钮选择常用整句或组合句子，页面用浏览器 TTS 朗读，帮助完成喝水、翻身、疼痛、叫医生等日常沟通。

线上地址：<https://shinku-chen.github.io/taptalk/>

## 目录结构

~~~text
index.html              页面结构、设置/历史/帮助对话框
css/app.css             布局、主题、高对比、响应式与动效
js/data.js              词板数据：常用语、人物、类别、项目、动作
js/core.js              纯逻辑：层级解析、分页、句子生成、数据校验
js/app.js               交互、语音、localStorage、设置、键盘、PWA 注册
tests/core.test.js      Node 内置测试
assets/                 PWA 图标（由 scripts/generate-icons.py 生成）
manifest.webmanifest    Web App Manifest
sw.js                   离线缓存
doc/                    需求、原型、历史设计与界面截图
scripts/                构建辅助脚本
~~~

项目没有构建产物，GitHub Pages 直接从 <code>master</code> 根目录发布。不要引入框架、打包器或 CDN 运行时依赖。

## 构建与验证

无构建步骤。本地预览：

~~~bash
python3 -m http.server 8080
~~~

自动化测试：

~~~bash
node --test
# 或 npm test
~~~

改动后至少运行 <code>node --test</code>。涉及页面交互、样式或 PWA 的改动，还要用浏览器手动检查：

- 常用表达翻页、整句朗读、历史记录。
- 组合表达四层选择、返回、清空。
- 390px 窄屏下按钮文字不溢出、页面不横向滚动。
- 设置刷新后仍保留。
- 断网刷新仍能打开（Service Worker）。

仓库没有提交 Playwright 依赖；浏览器验收可以用本机 Chrome 或临时安装的 Playwright，不要把 node_modules、截图临时文件或浏览器缓存提交进仓库。

## 代码约定

- 使用原生 HTML / CSS / JavaScript，保持无构建、无运行时依赖；所有资源必须能从 <code>index.html</code> 相对路径加载。
- 词板内容放在 <code>js/data.js</code>，句子规则放在 <code>js/core.js</code>，DOM / 存储 / 语音放在 <code>js/app.js</code>。不要在 UI 代码里硬编码新的词板数据。
- 修改词板或句式时，同步更新 <code>tests/core.test.js</code>；测试应覆盖数据完整性、典型句子和全部动作组合。
- 对不自解释的函数、数据结构字段和关键分支补简洁注释，说明职责、参数含义、边界和副作用。
- 用户可见文案默认中文；代码标识符、API、类型名保留英文。注释和文档默认中文。
- 按钮保持 3×3 布局：6 个内容位 + 清空 / 上一页 / 下一页 3 个功能位。返回上一级放在顶部路径栏。
- 渲染用户输入（自定义常用语、历史记录、句子）必须使用 <code>textContent</code> 或 DOM API，禁止拼接 <code>innerHTML</code>。
- localStorage 键名带版本后缀（当前 <code>taptalk.*.v1</code>）；修改结构时先做向后兼容的归一化，不要让旧数据导致页面初始化失败。
- 修改静态资源后同步提升 <code>sw.js</code> 的 <code>CACHE_VERSION</code>，避免已安装设备继续使用旧缓存。
- 保持无障碍：按钮使用真实 <code>button</code> 元素、焦点可见、句子区域有 <code>aria-live</code>、对比度足够、支持键盘操作。
- 不引入分析、追踪、广告、远程字体或第三方脚本；句子、历史和自定义内容只留在本机。新增网络请求前先确认是否真的必要。
- 本项目当前没有服务端、数据库或 Redis。如果未来引入缓存，默认设置 TTL，不允许长期缓存；如需例外，必须写清原因、风险和清理机制。

## 提交规范

- commit 标题：<code>type(scope): 简述</code>，<code>type</code> 取 <code>feat/fix/docs/refactor/perf/test/chore/build/ci</code>，简述用祈使句、不超过 50 字符、结尾不加句号、默认中文（技术术语保留英文）。
- 一个 commit 只做一件事，message 描述最终 diff，不叙述调试过程。
- 提交后在同一轮内 <code>git push</code>；这是个人仓库，默认直接推 <code>master</code>，不额外开 PR，除非用户明确要求。
- commit message 不使用反引号；需要多行时用 <code>git commit -F -</code> 加 heredoc。
- 任何实际文件变更都同步记录到 <code>CHANGELOG.md</code>；本项目已有该文件，日常变更按现有格式追加。

## 需求回写

- 需求沟通形成的最终范围、交互约定、已知限制，不能只留在对话或 memory 里；必须同步写回 <code>README.md</code>、<code>doc/需求文档.md</code> 或对应项目文档。
- 影响患者可见行为、紧急场景、隐私边界或医疗安全措辞的改动，先确认需求再动代码。
- 不把真实患者信息、医院内部数据、凭证或 token 写入仓库、示例或测试。

## 发布

GitHub Pages 从 <code>master</code> 根目录发布。推送后等待 Pages 构建完成，再检查线上页面；Service Worker 有缓存，验收时用无痕窗口或 DevTools 的 Bypass for network。
