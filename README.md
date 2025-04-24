# XMind Preview Plugin

## 概述
XMind Preview Plugin 是一个适用于 Obsidian 笔记应用程序的插件，允许用户在 Markdown 文件中嵌入并预览 XMind 思维导图文件。通过简单的代码块语法，您可以轻松地将 XMind 文件的缩略图插入到笔记中，并提供打开完整 XMind 文件的功能。

该插件通过读取 `.xmind` 压缩包中 `Thumbnails/thumbnail.png` 文件, 实现对 `.xmind` 文件的预览效果.

## 主要功能
- **嵌入 XMind 缩略图**：在 Markdown 文件中显示 XMind 文件的缩略图。
- **缩放控制**：支持自定义缩放级别，以便更好地适应不同的显示需求。
- **对齐方式**：支持图像和按钮的左对齐、右对齐和居中对齐。
- **打开按钮**：提供“Open”按钮，方便用户直接从笔记中打开完整的 XMind 文件。
- **默认设置**：支持在插件设置中配置默认的缩放级别和对齐方式。

## 配置选项
进入 Obsidian 设置中的 `XMind Preview` 标签页，您可以看到以下配置选项：

- **XMind Folder Path**
  - 描述：指定存储 XMind 文件的文件夹路径。
  - 示例：`/drafts/xmind`

- **Show Open Button**
  - 描述：选择是否默认显示“Open”按钮。
  - 选项：`true` 或 `false`

- **Default Zoom Level**
  - 描述：设置默认的缩放级别。
  - 范围：0.5 到 2.0，默认值：1.0

- **Default Alignment**
  - 描述：设置默认的对齐方式。
  - 选项：`left`, `center`, `right`，默认值：`center`

## 使用方法
### 基本用法
要在 Markdown 文件中嵌入 XMind 缩略图，请使用以下语法：

````markdown
```xmind
name: example-mindmap
```
````

### 参数说明
- **name**
  - 描述：指定 XMind 文件的名称（不包括 `.xmind` 扩展名）。
  - 示例：`example-mindmap`

- **path**
  - 描述：指定 XMind 文件的绝对或相对路径。
  - 示例：`/drafts/xmind/example-mindmap.xmind` 或 `../xmind-files/example-mindmap.xmind`

- **zoom**
  - 描述：设置缩放级别。
  - 示例：`1.0` 表示原始大小，`0.5` 表示缩小一半，`2.0` 表示放大两倍。

- **alignment**
  - 描述：设置图像和按钮的对齐方式。
  - 可选值：`left`, `center`, `right`
  - 示例：`left` 表示左对齐，`right` 表示右对齐，`center` 表示居中对齐。

- **button-display**
  - 描述：决定是否显示“Open”按钮。
  - 可选值：`true` 或 `false`
  - 示例：`true` 表示显示按钮，`false` 表示隐藏按钮。

### 示例
#### 示例 1：基本用法
````markdown
```xmind
name: project-plan
zoom: 1
alignment: left
button-display: true
```
````

#### 示例 2：使用绝对路径
````markdown
```xmind
path: /notes/projects/project-plan.xmind
zoom: 0.8
alignment: right
button-display: false
```
````

#### 示例 3：使用相对路径
````markdown
```xmind
path: ../projects/project-plan.xmind
zoom: 0.5
alignment: center
button-display: true
```
````

## 常见问题
### Q1: 如何确定 XMind 文件的路径？
- **绝对路径**：从根目录开始的完整路径，例如 `/drafts/xmind/example-mindmap.xmind`。
- **相对路径**：相对于当前 Markdown 文件的位置，例如 `../xmind-files/example-mindmap.xmind`。

### Q2: 如何更改默认设置？
- 进入 Obsidian 设置中的 `XMind Preview` 标签页。
- 修改 `Default Zoom Level` 和 `Default Alignment` 的值。
- 点击保存后，所有未指定相应参数的代码块将使用新的默认值。

### Q3: 如果我没有指定某些参数会发生什么？
- **zoom**: 默认为 `1.0`。
- **alignment**: 默认为 `center`。
- **button-display**: 默认根据插件设置中的 `Show Open Button` 决定。

## 致谢
感谢使用 XMind Preview Plugin！如果您有任何建议或遇到问题，请随时联系开发者或在 Obsidian 社区论坛上提出。
