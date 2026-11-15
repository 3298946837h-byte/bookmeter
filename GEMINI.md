# BookMeter 项目工程与前端交互规范

## 1. 移动端与国内网络防护规范 (Zero-Hang & Resilience)
- **零白屏与零挂死原则**：
  - 任何无限流、瀑布流或“加载更多”组件，严禁单一依赖海外未经反代的外网 API（如 Open Library 等）。
  - 必须提供内置高品质数据流或毫秒级（$\le 150\text{ms}$）Fallback 本地生成器，彻底杜绝 CORB 跨域拦截与移动端网络超时挂死。
- **搜索零空白死角 (Zero Dead-End Search)**：
  - 垂直聚合类产品在未命中库内数据时，严禁向用户直接抛出空白或“未找到书籍”的死胡同。
  - 必须即时合成具备四大平台（豆瓣、Goodreads、Amazon、Google Books）直达搜索链接的多维对冲综合画像。

## 2. 移动端交互三要素规范 (Mobile Touch & Form Best Practices)
- **防视口变形**：所有移动端输入框（`input`）字号必须 $\ge 16\text{px}$，严格防止 iOS Safari 在点击聚焦时自动缩放拉伸页面。
- **中文输入清洗**：搜索处理函数必须自动清洗书名号《》、双引号“”、单引号‘’以及全半角方括号。
- **软键盘主动避让**：表单提交（`submit`）后必须主动调用 `activeElement.blur()` 收起虚拟键盘，并在 120ms 内平滑滚动到结果卡片区域。

## 3. GitHub Pages 隔离部署规范 (CI/CD Safety)
- 个人访问令牌（PAT）若未开放 `workflow` 作用域，严禁向远程推送包含 `.github/workflows` 的提交。
- 前端生产构建物（`client/dist`）独立维护推送至 `gh-pages` 分支，保持部署流水线无污染。
