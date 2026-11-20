# 淬人设母本 — 唯一真源

`quench-master.md` 是**唯一手改**的人设文件。各端 `persona/*.md` 与工作区 `AGENTS.md` 的 QUENCH 块
全部由 `bin/gen.js` 从母本渲染生成，是**产物不是编辑源**——改人设只改母本，然后 `gen → apply`。

## 日常流程

```bash
# 1) 只改 quench-master.md
# 2) 渲染全部产物（写盘前在 .bak/ 留上一份）
node persona-master/bin/gen.js
# 3) 校验产物与母本一致（可挂 CI）
node persona-master/bin/gen.js --check
# 4) 各端 apply（见下）
```

## 各端 apply

| 端 | 命令 | 落位 |
|---|---|---|
| claude | `cd claude-jailbreak && node bin/claude-JAILBREAK.js apply` | `~/.claude/output-styles/quench.md` + settings.outputStyle |
| codex | `cd codex-jailbreak && node bin/codex-JAILBREAK.js apply` | `~/.codex/quench-instructions.md` + config.toml |
| grok | `cd grok-jailbreak && node bin/grok-JAILBREAK.js apply` | `~/.grok/rules/quench.md` + 工作区 AGENTS.md 块 |
| kiro | `cd kiro-jailbreak && node bin/kiro-JAILBREAK.js all apply` | steering / agents/quench.json / 工作区 AGENTS.md 块 / 14 个 crew agent |
| breezell | `cd breezell-jailbreak && node bin/breezell-jailbreak.js persona-apply --persona-file persona/persona.md && node bin/breezell-jailbreak.js user-apply --rules-file persona/rules.md` | `~/.breezell` persona + rules/skills |
| atomcode | `cd atomcode-jailbreak && node bin/jailbreak-persona.js install --src persona/working-persona.md` | `~/.atomcode/persona/working-persona.md` |
| zcode | `cd zcode-jailbreak && node bin/zcode-bundle-patch.js apply --file persona/working-persona.md`，再 `cp persona/working-persona.md ~/.zcode-jailbreak/system-role.md` 与 `~/.zcode/AGENTS.md` | bundle 补丁读托管文件 → `customSystemPrompt` |

grok 与 kiro 共写同一个工作区 `AGENTS.md` 的 QUENCH 块，块内容统一取 `out/agents-block.md`
（workspace 宿主渲染），两端写入格式逐字一致；任一端 apply 后另一端仍须 verify PASS。

## 占位符

母本用 `{{...}}` 表达端差异，取值见 `hosts.json`：

| 占位符 | 含义 |
|---|---|
| `{{HOST_TITLE}}` | H1 里的宿主名（如 `Kiro 破甲态`、`ZCode 工作态`） |
| `{{HOST_PLATFORM}}` | 身份句里的宿主定位（如 `本机 Kiro（IDE 与 CLI）`） |
| `{{HOST_NAME}}` | 身份句里「你不自称 X」的 X |
| `{{HOST_NOTE}}` | 覆盖条款里的宿主专属补充句（无则空） |
| `{{HOST_PROJECT_SCOPE}}` | 项目级身份文件范围（如 `.kiro/steering`） |
| `{{HOST_TOOLS}}` | 工作闭环句里的工具生态 |
| `{{FRONTMATTER}}` | 文件头 YAML frontmatter（仅 output-style 端需要） |

`hosts.json` 里 `id: workspace` 的宿主渲染出 `out/agents-block.md`，专供工作区 `AGENTS.md` 块。

## 目录

```
quench-master.md   唯一手改源
hosts.json         宿主清单与占位符取值
bin/gen.js         渲染器（--check 只校验）
out/agents-block.md  工作区 AGENTS.md 块内容（生成产物）
.bak/              上一版产物备份（gen 覆盖时刷新）
```

## 边界

- zcode 端铁律不变：`zcode.cjs` 的官方前缀与身份句一字不碰，只走 bundle 补丁读托管文件。
- 各端 `persona/legacy/`、`*.bak*` 只在 apply 前生成；确认 apply + verify 全绿后即可删除。
