# Resource Hub

<p align="center">
  <strong>VSCode 资源整合插件</strong><br>
  快速访问文件、文件夹、网页和命令的侧边栏工具
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.0.5-blue" alt="version">
  <img src="https://img.shields.io/badge/VSCode-%5E1.85.0-green" alt="vscode">
  <img src="https://img.shields.io/badge/license-MIT-orange" alt="license">
</p>

---

## 功能概览

- **资源整合** — 文件、文件夹、网页链接、命令行命令，统一管理
- **分组管理** — 创建多个分组，分类组织资源
- **拖拽排序** — 拖动资源在不同组之间移动
- **右键快捷** — Explorer / Editor 右键一键添加
- **选区保存** — 选中文字直接保存为文件，自动命名
- **搜索打开** — 按名称/路径快速搜索并打开资源

## 资源类型

| 类型 | 图标 | 说明 | 打开方式 |
|------|------|------|----------|
| File | 📄 | 文件路径 | VSCode 编辑器打开 |
| Folder | 📁 | 文件夹路径 | 系统文件管理器 |
| Web | 🌐 | 网页链接 | 浏览器打开 |
| Command | 💻 | 命令行命令 | 后台执行 |

## 添加方式

| 入口 | 操作 |
|------|------|
| 工具栏 | 侧边栏顶部 Add File / Folder / Web / Command / Group |
| Explorer 右键 | 右键文件/文件夹 → Add to ResourceHub: File / Folder |
| Editor 右键 | 选中文字 → 右键 → Add Selection as File |
| ResourceHub 子菜单 | Explorer/Editor 右键 → ResourceHub → 展开完整操作 |
| 命令面板 | Ctrl+Shift+P → "Resource Hub" |

## 选区保存为文件

在编辑器中选中文字后右键 → Add Selection as File：

- 自动命名 `selection_0001.txt`、`selection_0002.js`（编号永不重复）
- 自动识别语言扩展名（js/ts/py/java/go/json 等）
- 文件真实写入磁盘（`.vscode/resource-hub-temp/`）
- 点击即可打开编辑、另存为

## 右键菜单

### 资源条目

| 操作 | 说明 |
|------|------|
| Open Resource | 打开资源 |
| Open in Terminal | 在终端中打开（仅 command/path） |
| Copy Target | 复制路径/URL |
| Rename | 重命名 |
| Edit Resource | 编辑详细信息 |
| Move to Group | 移动到其他组 |
| Delete | 删除 |

### 分组

| 操作 | 说明 |
|------|------|
| Add File/Folder/Web/Command to Group | 向组内添加资源 |
| Rename Group | 重命名组 |
| Delete | 删除组及所有资源 |

## 安装

1. 下载 [latest release](https://github.com/volcanochen/resource-hub/releases) 的 `.vsix` 文件
2. VSCode → Ctrl+Shift+P → "Extensions: Install from VSIX..."
3. 选择文件，重新加载

## 构建

```bash
git clone https://github.com/volcanochen/resource-hub.git
cd resource-hub
npm install
npm run package      # 生产编译
npx vsce package     # 打包 VSIX
```

## 项目结构

```
resource_hub/
├── src/
│   ├── extension.ts      # 插件入口
│   ├── treeProvider.ts   # TreeView + 拖拽
│   ├── storage.ts        # globalState 存储
│   ├── commands.ts       # 命令实现
│   ├── types.ts          # 类型定义
│   └── logger.ts         # 日志
├── resources/            # SVG 图标
├── dist/                 # 编译输出
└── package.json
```

## 更新日志

### v0.0.5
- 补全资源条目右键菜单（Open in Terminal / Copy Target / Rename / Edit / Move）
- 分组右键菜单（Add to Group / Rename Group）

### v0.0.3
- 工具栏恢复全部 6 个按钮
- 选区自动命名永不重复
- 选区内容真实写入磁盘

### v0.0.2
- 右键菜单改为 ResourceHub 一级子菜单
- 选区自动命名 + 临时目录保存

### v0.0.1
- 初始版本

## 作者

**volcanochen**

- GitHub: [volcanochen](https://github.com/volcanochen)
- Email: volcanochen@outlook.com

## License

MIT
