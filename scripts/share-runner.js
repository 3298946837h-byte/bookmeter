/**
 * BookMeter Public Share Runner
 * 
 * Orchestrates:
 * 1. Checks or starts the Express backend server on port 5000.
 * 2. Connects to or launches the Cloudflare Quick Tunnel daemon (scripts/tunnel-daemon.js).
 * 3. Displays a formatted banner with the public HTTPS URL, local URL, and usage instructions.
 */

const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 5000;
const TUNNEL_FILE = path.join(ROOT_DIR, 'public_tunnel.json');

let serverProc = null;
let tunnelProc = null;
let isShuttingDown = false;

// ANSI Colors
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

/**
 * Check if the Express server is currently responding on port 5000
 */
function checkServerRunning(port = PORT, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/tunnel-status`, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Start Express backend if not already running
 */
async function ensureServerRunning() {
  const isRunning = await checkServerRunning(PORT);
  if (isRunning) {
    console.log(`${GREEN}✓${RESET} Express 后端服务已就绪 (端口 ${PORT})`);
    return;
  }

  console.log(`${YELLOW}⚡${RESET} 正在启动 Express 后端服务 (端口 ${PORT})...`);
  serverProc = spawn('node', ['server/index.js'], {
    cwd: ROOT_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  serverProc.stdout.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg.includes('listening') || msg.includes('5000')) {
      // console.log(`[Express] ${msg}`);
    }
  });

  serverProc.stderr.on('data', (d) => {
    // console.warn(`[Express Error] ${d.toString().trim()}`);
  });

  serverProc.on('exit', (code) => {
    if (!isShuttingDown) {
      console.warn(`[Express] 后端进程退出 (code=${code})`);
    }
  });

  // Poll until server is responding
  const start = Date.now();
  while (Date.now() - start < 15000) {
    await new Promise((r) => setTimeout(r, 400));
    const ready = await checkServerRunning(PORT);
    if (ready) {
      console.log(`${GREEN}✓${RESET} Express 后端服务启动成功！`);
      return;
    }
  }

  throw new Error(`Express 后端服务未能于 15 秒内在端口 ${PORT} 启动`);
}

/**
 * Read current public tunnel info from public_tunnel.json
 */
function readTunnelInfo() {
  if (!fs.existsSync(TUNNEL_FILE)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(TUNNEL_FILE, 'utf8'));
    if (data && data.status === 'online' && data.publicUrl && data.publicUrl.startsWith('https://')) {
      return data;
    }
  } catch (e) {}
  return null;
}

/**
 * Check if the active public tunnel URL is responding
 */
function verifyTunnelUrl(url, timeoutMs = 3500) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.get(
        `${parsed.origin}/api/tunnel-status`,
        { timeout: timeoutMs, headers: { 'User-Agent': 'BookMeter-ShareRunner/1.0' } },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => {
            // If origin answered without Cloudflare 530
            resolve(res.statusCode === 200);
          });
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Connect to or launch Cloudflare Quick Tunnel daemon
 */
async function ensureTunnelRunning() {
  let existing = readTunnelInfo();
  if (existing) {
    process.stdout.write(`${YELLOW}⚡${RESET} 正在校验已有公网隧道连通性... `);
    const isAlive = await verifyTunnelUrl(existing.publicUrl);
    if (isAlive) {
      console.log(`${GREEN}在线有效！${RESET}`);
      return existing.publicUrl;
    }
    console.log(`${YELLOW}已有链接已过期，重新拉起隧道...${RESET}`);
  }

  console.log(`${YELLOW}⚡${RESET} 正在启动 Cloudflare Quick Tunnel 守护进程...`);
  tunnelProc = spawn('node', ['scripts/tunnel-daemon.js'], {
    cwd: ROOT_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  tunnelProc.stdout.on('data', (d) => {
    // Daemon prints info
  });

  tunnelProc.stderr.on('data', (d) => {
    // Daemon error
  });

  tunnelProc.on('exit', (code) => {
    if (!isShuttingDown) {
      console.warn(`[TunnelDaemon] 隧道进程退出 (code=${code})`);
    }
  });

  // Poll public_tunnel.json until online
  const start = Date.now();
  while (Date.now() - start < 35000) {
    await new Promise((r) => setTimeout(r, 600));
    const current = readTunnelInfo();
    if (current && current.status === 'online' && current.publicUrl) {
      console.log(`${GREEN}✓${RESET} Cloudflare Quick Tunnel 隧道建立成功！`);
      return current.publicUrl;
    }
  }

  throw new Error('Cloudflare 隧道未能于 35 秒内建立完成，请检查本地网络或 cloudflared.exe');
}

/**
 * Print formatted banner with public URL and usage instructions
 */
function printBanner(publicUrl) {
  const line = '═'.repeat(74);
  const subLine = '─'.repeat(74);

  console.log('\n' + CYAN + line + RESET);
  console.log(` ${BOLD}📚 BookMeter 全网书评与真实电子书聚合系统 · 一键公网分享已就绪${RESET}`);
  console.log(CYAN + line + RESET);
  console.log('');
  console.log(`  ${BOLD}🌐 公网免代理分享链接 (HTTPS):${RESET}`);
  console.log(`     >> ${GREEN}${BOLD}${publicUrl}${RESET} <<`);
  console.log('');
  console.log(`  ${BOLD}🏠 本地服务地址:${RESET}        http://127.0.0.1:${PORT}`);
  console.log(`  ${BOLD}📡 穿透通道技术:${RESET}        Cloudflare Quick Tunnel (全球边缘直连 · 免梯子)`);
  console.log('');
  console.log(CYAN + subLine + RESET);
  console.log(`  ${YELLOW}${BOLD}💡 极速使用指南:${RESET}`);
  console.log(`  1. 复制上方【公网免代理分享链接】发送给任何朋友 (微信 / QQ / 手机浏览器)；`);
  console.log(`  2. 朋友手机或电脑免翻墙、免代理直连秒开 BookMeter 网站；`);
  console.log(`  3. 朋友在顶部搜索框输入任意书名（如《三体》、《百年孤独》、《活着》等）；`);
  console.log(`  4. 点击“下载全书”按钮，真实完整 EPUB / PDF / TXT 电子书即刻秒下到本地！`);
  console.log(CYAN + subLine + RESET);
  console.log('');
  console.log(`  ${YELLOW}⚡ 守护进程正在后台稳定运行，按 Ctrl + C 即可停止服务并退出。${RESET}`);
  console.log(CYAN + line + RESET + '\n');
}

/**
 * Graceful cleanup on termination
 */
function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n[ShareRunner] 正在安全停止相关进程...');

  if (tunnelProc) {
    try {
      tunnelProc.kill();
    } catch (e) {}
    tunnelProc = null;
  }

  if (serverProc) {
    try {
      serverProc.kill();
    } catch (e) {}
    serverProc = null;
  }

  console.log('[ShareRunner] 退出完成，感谢使用！');
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('exit', () => {
  cleanup();
});

// Main orchestrator flow
async function main() {
  console.log(`\n======================================================`);
  console.log(`       BookMeter 公网免代理分享启动器 (Share Runner)     `);
  console.log(`======================================================\n`);

  try {
    await ensureServerRunning();
    const publicUrl = await ensureTunnelRunning();
    printBanner(publicUrl);

    // Keep event loop alive
    setInterval(() => {}, 60000);
  } catch (err) {
    console.error(`\n${RED}[错误] 启动失败: ${err.message}${RESET}\n`);
    cleanup();
    process.exit(1);
  }
}

main();
