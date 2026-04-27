# Git 工作流

---

## 开发工作流

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **进行更改并测试**
   - 编写代码
   - 添加测试
   - 运行测试确保通过
   - 运行 linter 检查代码质量

3. **提交更改**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

4. **推送并创建 Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 发行通道

- 推送到 `unstable` 后会先运行 `Test` workflow；测试成功后，GitHub Actions 会自动为该提交发布一版 `edge` 预发布以及对应的 Docker 镜像。
- `edge` 通道用于主线最新提交验证。GitHub 侧保持单一可滚动的 `edge` 预发布，Docker 同时发布 `xiaomoy/axonhub:edge` 和 `xiaomoy/axonhub:edge-<shortsha>`。
- 正式版仍然只由 tag 驱动。只有推送 `v*` tag 时，才会触发原有的 GitHub Release 和 Docker 发布流程。

## 提交前检查（prek）

仓库内已包含 `.pre-commit-config.yaml`。`prek` 可以作为 `pre-commit` 的 drop-in 替代品使用。

### 安装 prek

- macOS/Linux（Homebrew）
  ```bash
  brew install prek
  ```

- Python（uv）
  ```bash
  uv tool install prek
  ```

也可以不安装直接运行一次：

```bash
uvx prek --version
```

- Python（pipx）
  ```bash
  pipx install prek
  ```

- Node.js（pnpm）
  ```bash
  pnpm add -D @j178/prek
  ```

- Standalone installer（Linux/macOS）
  ```bash
  curl --proto '=https' --tlsv1.2 -LsSf https://github.com/j178/prek/releases/latest/download/prek-installer.sh | sh
  ```

如果使用 standalone installer，建议从 GitHub Releases 的最新版本页面复制安装脚本链接。

如果你已经在该仓库使用过 `pre-commit`：
- 将脚本/文档中的 `pre-commit` 命令替换为 `prek`
- 执行一次 `prek install -f` 重新安装 hooks

### 手动运行 hooks

```bash
prek run
```

对整个仓库运行所有 hooks：

```bash
prek run --all-files
```

### 安装 git hooks

```bash
prek install
```

如果你以前执行过 `pre-commit install`，建议重新安装一次：

```bash
prek install -f
```

卸载：

```bash
prek uninstall
```

如果通过 standalone installer 安装，prek 可以自更新：

```bash
prek self update
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更改
- `style:` 代码格式更改
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动
