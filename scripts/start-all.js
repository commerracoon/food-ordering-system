const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine project root
const ROOT = path.resolve(__dirname, '..');

// Determine python executable (prefer venv)
function findPython() {
    const candidates = [];
    // Windows venv
    candidates.push(path.join(ROOT, '.venv', 'Scripts', 'python.exe'));
    // POSIX venv
    candidates.push(path.join(ROOT, '.venv', 'bin', 'python'));
    // Fallback to system python
    candidates.push('python');
    candidates.push('python3');

    for (const c of candidates) {
        try {
            if (c === 'python' || c === 'python3') {
                // assume in PATH
                return c;
            }
            if (fs.existsSync(c)) return c;
        } catch (e) {
            // ignore
        }
    }
    return 'python';
}

const python = findPython();
const backendScript = path.join(ROOT, 'backend', 'app.py');

// Spawn backend
console.log('Starting backend using python:', python, backendScript);
const backend = spawn(python, [backendScript], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false
});

backend.stdout.on('data', (data) => {
    process.stdout.write(`[backend] ${data}`);
});
backend.stderr.on('data', (data) => {
    process.stderr.write(`[backend:err] ${data}`);
});

backend.on('exit', (code, signal) => {
    console.log(`Backend exited with code=${code} signal=${signal}`);
});

// Start Electron (use npx to ensure local binary)
console.log('Starting Electron...');
// Use 'inherit' stdio if this process has a TTY; otherwise fall back to 'pipe'
const electronStdio = process.stdout.isTTY ? ['inherit', 'inherit', 'inherit'] : ['pipe', 'pipe', 'pipe'];
// Prefer local electron binary if present
let electronExecutable = null;
const localElectron = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');
if (fs.existsSync(localElectron)) {
    electronExecutable = localElectron;
} else if (process.platform === 'win32') {
    electronExecutable = 'npx.cmd';
} else {
    electronExecutable = 'npx';
}

const electronArgs = fs.existsSync(localElectron) ? ['.'] : ['electron', '.'];

console.log('Spawning electron with:', electronExecutable, electronArgs);
let electron;
try {
    electron = spawn(electronExecutable, electronArgs, {
        cwd: ROOT,
        stdio: electronStdio,
        windowsHide: false
    });
} catch (spawnErr) {
    console.error('Failed to spawn electron:', spawnErr);
    // Try again with shell on Windows for .cmd wrappers
    try {
        const useShell = process.platform === 'win32' || electronExecutable.endsWith('.cmd');
        electron = spawn(electronExecutable, electronArgs, {
            cwd: ROOT,
            stdio: electronStdio,
            windowsHide: false,
            shell: useShell
        });
    } catch (spawnErr2) {
        console.error('Retry to spawn electron with shell also failed:', spawnErr2);
        process.exit(1);
    }
}

// If we are piping electron output (no TTY), forward it to our stdout/stderr
if (!process.stdout.isTTY) {
    if (electron.stdout) electron.stdout.on('data', d => process.stdout.write(`[electron] ${d}`));
    if (electron.stderr) electron.stderr.on('data', d => process.stderr.write(`[electron:err] ${d}`));
}

// When electron exits, kill backend and exit
electron.on('exit', (code, signal) => {
    console.log(`Electron exited with code=${code} signal=${signal}`);
    try {
        if (!backend.killed) {
            console.log('Stopping backend...');
            // On Windows, spawn.kill may not work if child created new process, try taskkill
            if (process.platform === 'win32') {
                const { spawnSync } = require('child_process');
                spawnSync('taskkill', ['/PID', backend.pid.toString(), '/T', '/F']);
            } else {
                backend.kill('SIGTERM');
            }
        }
    } catch (e) {
        console.error('Error stopping backend:', e);
    }
    process.exit(code || 0);
});

// Forward signals to child processes
['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
        try {
            if (!backend.killed) backend.kill('SIGTERM');
        } catch (e) {}
        try {
            if (!electron.killed) electron.kill('SIGTERM');
        } catch (e) {}
        process.exit(0);
    });
});
