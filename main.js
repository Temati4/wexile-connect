const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn, execSync, exec } = require('child_process')

let mainWindow;
let zapretProcess = null;
let wireguardProcess = null;
let userRequestedDisconnect = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 500,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        movable: true
    })

    mainWindow.loadFile('ui/index.html')
}

// Window controls
ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});
ipcMain.on('close-window', () => {
    mainWindow.close();
});

// List .bat files in ./zapret
ipcMain.handle('list-bat-files', async () => {
    const zapretDir = path.join(process.resourcesPath, 'zapret');
    try {
        const files = await fs.promises.readdir(zapretDir);
        return files.filter(f => f.endsWith('.bat'));
    } catch (e) {
        return [];
    }
});

// List WireGuard config files
ipcMain.handle('list-wg-configs', () => {
    try {
        const configPath = path.join(__dirname, 'resources', 'wireguard');
        const files = fs.readdirSync(configPath);
        return files.filter(f => f.endsWith('.conf'));
    } catch (error) {
        console.error('Error listing WireGuard configs:', error);
        return [];
    }
});

// Run selected .bat file silently in background and track process (no auto-restart)
ipcMain.handle('run-bat-file', async (event, batFile) => {
    const zapretDir = path.join(process.resourcesPath, 'zapret');
    const filePath = path.join(zapretDir, batFile);
    try {
        if (zapretProcess && !zapretProcess.killed) {
            return { success: false, error: 'Already running' };
        }
        userRequestedDisconnect = false;
        zapretProcess = spawn(filePath, [], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
        });
        zapretProcess.unref();
        zapretProcess.on('exit', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('zapret-exited');
            }
            zapretProcess = null;
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Connect to WireGuard using selected config
ipcMain.handle('connect-wireguard', async (event, configName) => {
    try {
        const configPath = path.join(__dirname, 'resources', 'wireguard', configName);
        
        // Check if config exists
        if (!fs.existsSync(configPath)) {
            console.error('WireGuard config not found:', configPath);
            return { success: false };
        }
        
        // Start WireGuard connection
        const command = `wireguard /installtunnelservice "${configPath}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error starting WireGuard:', error);
                return { success: false };
            }
            console.log('WireGuard started successfully');
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error connecting to WireGuard:', error);
        return { success: false };
    }
});

// Disconnect from WireGuard
ipcMain.handle('disconnect-wireguard', async () => {
    try {
        // Get tunnel name from active connections
        const command = 'wireguard /uninstalltunnelservice wg0';
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error stopping WireGuard:', error);
                return false;
            }
            console.log('WireGuard stopped successfully');
        });
        return true;
    } catch (error) {
        console.error('Error disconnecting from WireGuard:', error);
        return false;
    }
});

// Allow renderer to check if zapret is running
ipcMain.handle('is-zapret-running', () => {
    return !!(zapretProcess && !zapretProcess.killed);
});

// Allow renderer to check if WireGuard is running
ipcMain.handle('is-wireguard-running', () => {
    return !!wireguardProcess;
});

// Allow renderer to force kill zapret
// NOTE: This handler requires the app to be run as administrator for full effect!
ipcMain.handle('kill-zapret', async () => {
    userRequestedDisconnect = true;
    let killed = false;
    // Kill tracked process
    if (zapretProcess && !zapretProcess.killed) {
        try {
            process.kill(zapretProcess.pid);
            zapretProcess = null;
            killed = true;
        } catch (e) {}
    }
    // Windows: kill all zapret and winws processes and windows
    if (process.platform === 'win32') {
        try {
            // Kill processes with 'zapret' and 'winws' in name
            execSync('taskkill /F /FI "IMAGENAME eq zapret*"');
            execSync('taskkill /F /FI "IMAGENAME eq winws*"');
            killed = true;
        } catch (e) {}
        try {
            // Kill windows with 'zapret' in title
            const ps = `Add-Type @'
using System;
using System.Runtime.InteropServices;
public class Win {
  [DllImport("user32.dll")] public static extern int PostMessage(IntPtr hWnd, uint Msg, int wParam, int lParam);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern int EnumWindows(Func<IntPtr, IntPtr, bool> enumProc, IntPtr lParam);
}
'@
[Win]::EnumWindows({
    param($hWnd, $lParam)
    $sb = New-Object System.Text.StringBuilder 512
    [Win]::GetWindowText($hWnd, $sb, $sb.Capacity) | Out-Null
    $title = $sb.ToString()
    if ($title -like '*zapret*' -and [Win]::IsWindowVisible($hWnd)) {
        [Win]::PostMessage($hWnd, 0x0010, 0, 0) # WM_CLOSE
    }
    $true
}, [IntPtr]::Zero)
`;
            execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '`"')}"`);
            killed = true;
        } catch (e) {}
    }
    return killed;
});

// Clean up on app quit
app.on('before-quit', async () => {
    // Kill zapret if running
    if (zapretProcess && !zapretProcess.killed) {
        try {
            process.kill(zapretProcess.pid);
        } catch (e) {}
    }
    
    // Stop WireGuard if running
    if (wireguardProcess) {
        try {
            execSync('net stop WireGuardTunnel$wg0');
        } catch (e) {}
    }
});

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
}) 