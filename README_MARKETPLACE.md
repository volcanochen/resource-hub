# Resource Hub

快速访问文件、文件夹、网页和命令的侧边栏工具。支持分组管理、拖拽排序和右键快捷操作。

## 功能

### 四种资源类型

- 📄 **File** — 文件路径，VSCode 内直接打开编辑
- 📁 **Folder** — 文件夹路径，系统文件管理器打开
- 🌐 **Web** — 网页链接，浏览器打开
- 💻 **Command** — 命令行命令，后台执行

### 多种添加方式

- **工具栏按钮** — 侧边栏顶部一键添加 File / Folder / Web / Command
- **Explorer 右键** — 右键文件/文件夹 → Add to ResourceHub
- **Editor 右键** — 选中文字 → Add Selection as File
- **命令面板** — Ctrl+Shift+P → "Resource Hub"

### 选区保存为文件

选中编辑器中的文字，右键 → Add Selection as File：

- 自动命名（selection_0001.txt, selection_0002.js ...），永不重复
- 自动识别语言扩展名
- 文件真实写入磁盘，可打开编辑和另存为

### 完整的右键菜单

**资源条目右键：** Open / Open in Terminal / Copy Target / Rename / Edit / Move to Group / Delete

**分组右键：** Add File / Folder / Web / Command to Group / Rename Group / Delete

### 其他

- **拖拽移动** — 拖动资源到不同分组
- **搜索** — 按名称/路径快速搜索并打开
- **日志** — OUTPUT 面板查看 "Resource Hub" 日志排查问题

## 使用

1. 安装后点击侧边栏 Resource Hub 图标
2. 使用工具栏按钮或右键菜单添加资源
3. 单击资源项打开，右键查看更多操作

---

**Author:** [volcanochen](https://github.com/volcanochen) · volcanochen@outlook.com

**License:** MIT
