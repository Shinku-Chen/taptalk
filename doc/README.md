# 设计文档索引

这个目录保留项目早期的需求、原型和数据结构探索记录，方便回看设计取舍。当前实现以仓库根目录的 <code>README.md</code>、<code>AGENTS.md</code>、<code>js/data.js</code> 和 <code>js/core.js</code> 为准。

## 文档状态

| 文档 | 用途 | 状态 |
| --- | --- | --- |
| [需求文档](需求文档.md) | 最初需求、交互约定、当前实现范围 | 持续维护 |
| [APP 原型设计](APP原型设计.md) | 九宫格布局、字号、颜色、交互流程 | 历史参考 |
| [数据结构说明](数据结构说明.md) | 早期 AppConfig / DataManager 数据结构方案 | 未完全落地 |
| [JavaScript重构说明](JavaScript重构说明.md) | 单文件脚本拆分思路 | 历史参考 |
| [动作系统完善说明](动作系统完善说明.md) | 动作与句式设计 | 历史参考 |
| [优化后动作系统](优化后动作系统.md) | 动作系统演进 | 历史参考 |
| [语句逻辑优化报告](语句逻辑优化报告.md) | 句子拼接规则分析 | 历史参考 |
| [多层级扩展示例](多层级扩展示例.md) | 多层级词板扩展示例 | 历史参考 |
| [无限层级扩展示例](无限层级扩展示例.md) | 递归层级思路 | 历史参考 |
| [语句分析器](语句分析器.html) | 早期句子逻辑调试页面 | 历史工具 |
| [data-config.js](data-config.js) | 早期数据配置草稿 | 未被当前页面引用 |

## 当前实现入口

- 词板数据：<code>js/data.js</code>
- 句子生成与数据校验：<code>js/core.js</code>
- 交互与存储：<code>js/app.js</code>
- 自动化测试：<code>tests/core.test.js</code>
- 页面结构：<code>index.html</code>
- 样式与主题：<code>css/app.css</code>
