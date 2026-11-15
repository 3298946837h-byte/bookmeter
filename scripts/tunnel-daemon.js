/**
 * Public Access Tunnel Daemon
 * BookMeter Cloudflare Quick Tunnel Supervisor
 *
 * Provides zero-config, zero-account, high-speed public HTTPS tunnel
 * for external sharing without requiring users or visitors to have a VPN/proxy.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLOUDFLARED_LOCATIONS = [
  'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
  'C:\\Program Files\\cloudflared\\cloudflared.exe',
  'cloudflared.exe',
  'cloudflared'
];

function findCloudflared() {
  for (const loc of CLOUDFLARED_LOCATIONS) {
    if (loc.includes('\\')) {
      if (fs.existsSync(loc)) return loc;
    } else {
      // Relative or in PATH
      return loc;
    }
  }
  return CLOUDFLARED_LOCATIONS[0];
}

const CLOUDFLARED_BIN = process.env.CLOUDFLARED_PATH || findCloudflared();
const TARGET = process.env.TUNNEL_TARGET || 'http://localhost:5000';
const OUT_FILE = path.join(__dirname, '../public_tunnel.json');
const PID_FILE = path.join(__dirname, '../public_tunnel.pid');

let currentProc = null;
let activeUrl = null;
let reconnectTimer = null;
let isShuttingDown = false;
let isSingletonOwner = false;

function isPidAlive(pid) {
  if (!pid || typeof pid !== 'number' || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

function checkSingleton() {
  if (fs.existsSync(PID_FILE)) {
    try {
      const content = fs.readFileSync(PID_FILE, 'utf8').trim();
      const existingPid = parseInt(content, 10);
      if (existingPid && isPidAlive(existingPid)) {
        let existingUrl = null;
        if (fs.existsSync(OUT_FILE)) {
          try {
            const data = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
            existingUrl = data.publicUrl;
          } catch (e) {}
        }
        console.log(`[TunnelDaemon] Another tunnel daemon is already active (PID: ${existingPid}, URL: ${existingUrl || 'N/A'}).`);
        console.log(`[TunnelDaemon] Exiting cleanly to prevent duplicate tunnel spawning and dead URLs.`);
        process.exit(0);
      } else if (existingPid) {
        console.log(`[TunnelDaemon] Stale PID file detected (PID: ${existingPid} is not running). Overwriting lock.`);
      }
    } catch (err) {
      console.warn(`[TunnelDaemon] Error reading existing PID file: ${err.message}`);
    }
  }

  try {
    fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');
    isSingletonOwner = true;
  } catch (err) {
    console.error(`[TunnelDaemon] Failed to write PID lock file: ${err.message}`);
  }
}

function updateStatus(status, url = null) {
  const payload = {
    status,
    active: status === 'online',
    daemonPid: process.pid,
    childPid: currentProc && currentProc.pid ? currentProc.pid : null,
    publicUrl: url,
    target: TARGET,
    provider: 'cloudflare',
    updatedAt: new Date().toISOString()
  };
  try {
    fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (e) {
    console.error('[TunnelDaemon] Failed to write status file:', e.message);
  }
}

function launchTunnel() {
  if (isShuttingDown) return;
  activeUrl = null;

  console.log(`\n[TunnelDaemon] Starting Cloudflare Quick Tunnel -> ${TARGET}`);
  console.log(`[TunnelDaemon] Executing: ${CLOUDFLARED_BIN} tunnel --url ${TARGET}`);

  try {
    currentProc = spawn(CLOUDFLARED_BIN, ['tunnel', '--url', TARGET], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });
    updateStatus('starting');
  } catch (err) {
    console.error('[TunnelDaemon] Failed to spawn cloudflared process:', err.message);
    updateStatus('offline');
    scheduleReconnect();
    return;
  }

  const handleStreamData = (chunk) => {
    const text = chunk.toString();
    // Look for https://*.trycloudflare.com
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !activeUrl) {
      activeUrl = match[0];
      updateStatus('online', activeUrl);

      console.log('\n' + '='.repeat(68));
      console.log('🎉 BOOKMETER 公网分享链接已成功就绪！');
      console.log('='.repeat(68));
      console.log(`🔗 公网直接访问地址: ${activeUrl}`);
      console.log(`🎯 本地服务转发目标: ${TARGET}`);
      console.log(`💡 说明: 朋友在手机/电脑浏览器中直接打开此链接，`);
      console.log(`   免翻墙、免梯子、无任何门槛即可秒开全网搜书与一键下载！`);
      console.log('='.repeat(68) + '\n');
    }
  };

  if (currentProc.stdout) {
    currentProc.stdout.on('data', handleStreamData);
  }
  if (currentProc.stderr) {
    currentProc.stderr.on('data', handleStreamData);
  }

  currentProc.on('error', (err) => {
    console.warn(`[TunnelDaemon] Process error: ${err.message}`);
    updateStatus('offline');
    scheduleReconnect();
  });

  currentProc.on('close', (code, signal) => {
    if (isShuttingDown) return;
    console.warn(`[TunnelDaemon] cloudflared process exited (code=${code}, signal=${signal}).`);
    activeUrl = null;
    updateStatus('offline');
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (isShuttingDown || reconnectTimer) return;
  console.log('[TunnelDaemon] Will attempt auto-reconnect in 3 seconds...');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    launchTunnel();
  }, 3000);
}

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  if (!isSingletonOwner) return;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  updateStatus('offline', null);
  if (currentProc) {
    try {
      currentProc.kill();
    } catch (e) {}
    currentProc = null;
  }
  try {
    if (fs.existsSync(PID_FILE)) {
      const content = fs.readFileSync(PID_FILE, 'utf8').trim();
      if (parseInt(content, 10) === process.pid) {
        fs.unlinkSync(PID_FILE);
      }
    }
  } catch (e) {}
  console.log('[TunnelDaemon] Tunnel process stopped gracefully.');
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

// Enforce single instance before launching tunnel
checkSingleton();
launchTunnel();
