#!/usr/bin/env node
/**
 * gen.js — 从母本 quench-master.md 渲染各端 persona 产物（零依赖，Node >= 18）
 *
 * 用法:
 *   node bin/gen.js           生成全部产物（写盘前在 .bak/ 留上一份）
 *   node bin/gen.js --check   只校验产物是否与母本一致，不写盘（漂移则 exit 1）
 *
 * 母本是唯一手改源：改人设只改 quench-master.md，然后 gen → apply。
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MASTER = path.join(ROOT, "quench-master.md");
const HOSTS = path.join(ROOT, "hosts.json");
const BAK = path.join(ROOT, ".bak");

const CHECK_ONLY = process.argv.includes("--check");

const readText = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

/** 中英日韩汉字与拉丁/数字之间补空格，避免占位符拼接后出现「本机 Claude Code里的」这类粘字 */
function cjkSpace(s) {
  return s
    .replace(/([㐀-鿿])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([㐀-鿿])/g, "$1 $2");
}

/** 渲染：替换 {{TOKEN}}，母本里出现未知占位符直接报错，避免静默产出半成品 */
function render(tpl, host) {
  const map = {
    HOST_TITLE: host.title,
    HOST_PLATFORM: host.platform,
    HOST_NAME: host.name,
    HOST_NOTE: host.note || "",
    HOST_PROJECT_SCOPE: host.projectScope,
    HOST_TOOLS: host.tools,
    FRONTMATTER: host.frontmatter || "",
  };
  let out = tpl;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  const left = out.match(/\{\{[A-Z_]+\}\}/g);
  if (left) throw new Error(`母本残留未知占位符 ${[...new Set(left)].join(", ")}（host=${host.id}）`);
  // frontmatter 为空时首行是空行，去掉；其余空行结构保持母本原样
  return cjkSpace(out).replace(/^\n+/, "").replace(/\n{3,}$/, "\n");
}

function backupOf(hostId, rel) {
  // 用 hostId + 文件名做备份路径：target 里有 ".."，直接 join 会逃出 BAK 目录
  const dst = path.join(BAK, hostId, path.basename(rel));
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(path.join(ROOT, rel), dst);
}

function main() {
  const tpl = readText(MASTER);
  const cfg = JSON.parse(readText(HOSTS));
  let drift = 0;

  for (const host of cfg.hosts) {
    const rel = path.normalize(host.target);
    const dst = path.join(ROOT, rel);
    const body = render(tpl, host);
    const cur = fs.existsSync(dst) ? readText(dst) : null;
    if (cur === body) {
      console.log(`  OK    ${host.id.padEnd(9)} ${rel}`);
      continue;
    }
    if (CHECK_ONLY) {
      console.log(`  DRIFT ${host.id.padEnd(9)} ${rel}`);
      drift++;
      continue;
    }
    if (cur !== null) backupOf(host.id, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, body, "utf8");
    console.log(`  WRITE ${host.id.padEnd(9)} ${rel}  (${body.length}B)`);
  }

  if (CHECK_ONLY) {
    if (drift) {
      console.log(`\ncheck: FAIL（${drift} 个产物与母本不一致）—— 先跑 node bin/gen.js`);
      process.exitCode = 1;
    } else {
      console.log("\ncheck: PASS（全部产物与母本一致）");
    }
    return;
  }
  console.log(`\ngen: 完成（${cfg.hosts.length} 个产物）。备份在 ${BAK}`);
}

main();
