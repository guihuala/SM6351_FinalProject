# 最后一幕的整合入口

本副本来自 `guihuala/SM6351_FinalProject` 的 `main`，基线提交为 `f4ec2b74bae03e5173bee6b399e4fa35e456f38d`。初次整合只新增文件；2026年11月20日按用户要求，将根入口 `ten-years/dist/index.html` 指向整合版，并为旧 `opening/` 和 `opening/index.html` 增加入口跳转。队友原有章节、脚本、样式和数据保持不变。整合版沿用仓库现有 GitHub Pages 发布流程。

## 查看整站

双击根目录 `Open-complete-preview.cmd`，或者运行 `python preview-complete.py`。默认入口是 `ten-years/dist/index.html`，直接进入 `opening/complete.html`；`complete.html` 继续作为兼容入口。

页面顺序保留：水下开场、双髻鲨介绍、保护等级时间轴、贸易概览、年度鱼鳍贸易、Product forms，最后接入 Beyond one species。

以后同步队友新提交后，可以运行 `python ten-years/scripts/build_complete_entry.py`，从当时的原开场文件重新生成整合入口；脚本只写新增的 `opening/complete.html`，不改原文件。加 `--verify` 可检查两个入口是否仍保持这个关系。

线上默认入口为 `https://guihuala.github.io/SM6351_FinalProject/`。根入口保留查询参数和章节锚点，直接打开原链接即可从水下开场一路滚动到末章。`opening/index.html` 仅增加入口跳转，队友原有内容原样保留；`project.html` 保留原样。原有章节锚点也存在于整合页中。

## 新增部分

- `ten-years/dist/finale/`：你的最后一幕，保留鲨鱼缩小过渡、三个风险等级、三个商品例子、来源浮层与结尾。
- `opening/complete.html`：保留原开场页面的内容与相对资源引用，在 Product forms 后追加末章。
- `opening/finale-host.css` 与 `finale-host.js`：只负责新增区域的显示、滚动和加载。
- `finale/js/integration.js`：将末章内的滚动操作交给整站，保留弹窗、表单及图表内的局部滚动。

末章的样式和动效放在独立 iframe 中，避免双方的全局样式、弹窗事件和不同版本 GSAP 相互影响。iframe 保持真实的屏幕视口，新增容器用同一滚动位移保持在视口内，并将位置同步到章节内部；无需依赖会受到上层 overflow 影响的 sticky 定位。因此原有固定风险轴、光效、Blur Text 和鲨鱼缩小仍按滚动工作。离开末章时暂停它的动效，用户手动设置的 Motion 偏好保留。

末章重用仓库现有字体、水下 WebP 背景和双髻鲨模型，不更改这些共享文件。三等级风险色与用户固定光源设置保留。上一章的鱼鳍重量和本章的候选条目统计明确区分，数据不合并。

## 核查范围

整合验证记录在 `integration-verification.json`。原文件按内容哈希与基线逐个比较；还检查新增资源路径、数据不变、父子滚动协议、消息来源校验和 JavaScript 语法。已在独立 Chrome 中复现并修复下滑后画面卷走、露出纯色背景的问题；实际检查产品页滚轮衔接、三个风险等级、结尾、等级导航和手机尺寸视口。尚未进行实体手机触摸测试。
