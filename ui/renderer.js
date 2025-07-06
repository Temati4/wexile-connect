const { ipcRenderer } = require('electron');

// Window controls with hover effect
const windowControls = document.querySelectorAll('.window-controls button');
windowControls.forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-1px)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.transform = '';
    });
});

document.querySelector('.minimize').addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});
document.querySelector('.close').addEventListener('click', () => {
    ipcRenderer.send('close-window');
});

document.querySelector('.header').style.webkitAppRegion = 'drag';
document.querySelector('.window-controls').style.webkitAppRegion = 'no-drag';

// Global state
let isConnected = false;
let selectedConfig = 'wg0.conf';
let configSelectionResolver = null;

// DOM Elements
const wireguardOptions = document.getElementById('wireguard-options');
const wgManualOption = document.getElementById('wg-manual-option');
const wgSelect = document.getElementById('wg-select');
const wgConfigModal = document.getElementById('wg-config-modal');
const wgConfigClose = document.getElementById('wg-config-close');
const configList = document.querySelector('.config-list');
const connectBtn = document.querySelector('.connect-btn');
const connectText = document.querySelector('.connect-text');
const powerIcon = connectBtn.querySelector('svg');

// Tab switching functionality
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all tabs and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding pane
        button.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
});

// Load WireGuard configs for manual selection
async function loadWgConfigs() {
    const configs = await ipcRenderer.invoke('list-wg-configs');
    wgSelect.innerHTML = '';
    configs.forEach(config => {
        const opt = document.createElement('option');
        opt.value = config;
        opt.textContent = config;
        wgSelect.appendChild(opt);
    });
    if (configs.length > 0) {
        selectedConfig = configs[0];
        wgSelect.value = selectedConfig;
    }
}

// WireGuard option selection logic
wireguardOptions.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', async () => {
        if (option.classList.contains('selected')) return;
        
        wireguardOptions.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
            opt.style.transform = '';
        });
        
        option.classList.add('selected');
        option.style.transform = 'scale(1.02) translateY(-2px)';
        setTimeout(() => {
            option.style.transform = 'translateY(-2px)';
        }, 200);
        
        if (option === wgManualOption) {
            wgSelect.style.display = 'block';
            await loadWgConfigs();
            selectedConfig = wgSelect.value;
        } else {
            wgSelect.style.display = 'none';
            selectedConfig = option.dataset.config || 'wg0.conf';
        }
    });
});

// Handle manual config selection change
wgSelect.addEventListener('change', () => {
    selectedConfig = wgSelect.value;
});

// Show config selection modal and return a promise that resolves with the selected config
function showConfigSelectionModal() {
    return new Promise(async (resolve) => {
        // If manual option is selected, use the dropdown value
        if (wgManualOption.classList.contains('selected')) {
            resolve(selectedConfig);
            return;
        }
        
        // Load configs for modal selection
        const configs = await ipcRenderer.invoke('list-wg-configs');
        configList.innerHTML = '';
        
        configs.forEach(config => {
            const configItem = document.createElement('div');
            configItem.className = 'config-item' + (config === selectedConfig ? ' selected' : '');
            configItem.innerHTML = `
                <div class="config-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                </div>
                <div class="config-name">${config}</div>
            `;
            configItem.addEventListener('click', () => {
                document.querySelectorAll('.config-item').forEach(item => {
                    item.classList.remove('selected');
                });
                configItem.classList.add('selected');
                selectedConfig = config;
                resolve(config);
                wgConfigModal.style.display = 'none';
            });
            configList.appendChild(configItem);
        });
        
        configSelectionResolver = resolve;
        wgConfigModal.style.display = 'flex';
    });
}

// Close modal on backdrop click
wgConfigModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    if (configSelectionResolver) {
        configSelectionResolver(null);
        configSelectionResolver = null;
    }
    wgConfigModal.style.display = 'none';
});

// Close modal on close button click
wgConfigClose.addEventListener('click', () => {
    if (configSelectionResolver) {
        configSelectionResolver(null);
        configSelectionResolver = null;
    }
    wgConfigModal.style.display = 'none';
});

function updateConnectButtonText() {
    if (isConnected) {
        connectText.textContent = 'Отключить WireGuard';
    } else {
        connectText.textContent = 'Подключиться к WireGuard';
    }
}

async function handleConnect() {
    // If manual option is selected, show config selection modal
    if (wgManualOption.classList.contains('selected')) {
        // Show config selection modal for manual mode
        const config = await showConfigSelectionModal();
        if (!config) {
            return false;
        }
        selectedConfig = config;
        const result = await ipcRenderer.invoke('connect-wireguard', config);
        if (result.success) {
            connectText.textContent = 'Отключить WireGuard';
            return true;
        } else {
            connectText.textContent = 'Ошибка подключения';
            connectText.style.color = '#ef4444';
            return false;
        }
    } else {
        // Recommended mode: connect immediately with wg0.conf
        selectedConfig = 'wg0.conf';
        const result = await ipcRenderer.invoke('connect-wireguard', selectedConfig);
        if (result.success) {
            connectText.textContent = 'Отключить WireGuard';
            return true;
        } else {
            connectText.textContent = 'Ошибка подключения';
            connectText.style.color = '#ef4444';
            return false;
        }
    }
}

async function handleDisconnect() {
    const killed = await ipcRenderer.invoke('disconnect-wireguard');
    if (killed) {
        connectText.textContent = 'Подключиться к WireGuard';
        return true;
    }
    return false;
}

async function updateConnectionState(connected) {
    if (isConnected === connected) return;
    
    if (connected) {
        connectBtn.classList.add('connected');
        connectText.textContent = 'Отключение...';
        connectText.style.color = '#ef4444';
        powerIcon.style.transform = 'rotate(360deg) scale(0.8)';
        setTimeout(() => {
            powerIcon.style.transform = 'rotate(360deg) scale(1)';
        }, 300);
        
        const success = await handleConnect();
        if (!success) {
            connectBtn.classList.remove('connected');
            powerIcon.style.transform = 'rotate(0deg) scale(1)';
            return;
        }
    } else {
        const success = await handleDisconnect();
        if (success) {
            connectBtn.classList.remove('connected');
            connectText.style.color = '';
            powerIcon.style.transform = 'rotate(0deg) scale(0.8)';
            setTimeout(() => {
                powerIcon.style.transform = 'rotate(0deg) scale(1)';
            }, 300);
        }
    }
    
    isConnected = connected;
    updateConnectButtonText();
}

// Listen for process exit (do not auto-disconnect UI)
ipcRenderer.on('wireguard-exited', () => {
    // Do not change isConnected or UI state automatically
});

// Connect button logic: toggle only on click
connectBtn.addEventListener('click', async () => {
    if (!isConnected) {
        await updateConnectionState(true);
    } else {
        await updateConnectionState(false);
    }
});

// Footer buttons hover effects
const footerButtons = document.querySelectorAll('.footer button');
footerButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-1px)';
        const icon = button.querySelector('svg');
        if (icon) {
            icon.style.transform = 'scale(1.1)';
        }
    });
    button.addEventListener('mouseleave', () => {
        button.style.transform = '';
        const icon = button.querySelector('svg');
        if (icon) {
            icon.style.transform = '';
        }
    });
});

// On load: if manual option is selected, load configs
if (wgManualOption.classList.contains('selected')) {
    wgSelect.style.display = 'block';
    loadWgConfigs();
}

// === THEME & LANGUAGE ===
const themeSelect = document.getElementById('theme-select');
const langSelect = document.getElementById('lang-select');
const root = document.documentElement;

const THEMES = [
    'purple',
    'royal-purple',
    'ocean-blue',
    'sky-blue',
    'emerald',
    'forest',
    'ruby',
    'rose',
    'amber',
    'orange',
    'teal',
    'cyan',
    'midnight',
    'magenta',
    'lime',
    'gold',
    'graphite',
    'pink',
    'brown',
    'indigo',
    'lavender',
    'mint',
    'sand',
    'silver',
    'neon',
    'peach',
    'olive',
    'ice',
    'coral',
    'violet',
    'steel',
    'bronze'
];
const LANGS = ['ru', 'en'];

const TEXTS = {
    ru: {
        connect: 'Подключиться',
        disconnect: 'Отключиться',
        disconnecting: 'Отключение...',
        error: 'Ошибка запуска',
        recommended: 'Рекомендованный',
        recommendedDesc: 'Использовать стандартную конфигурацию',
        manual: 'Выбрать вручную',
        manualDesc: 'Выберите конфигурацию WireGuard',
        settings: 'Настройки',
        theme: 'Тема интерфейса',
        lang: 'Язык',
        about: 'О программе',
        aboutText: 'Wexile Connect<br>v0.2',
        faq: 'FAQ',
        themes: {
            purple: 'Фиолетовый',
            'royal-purple': 'Королевский пурпур',
            'ocean-blue': 'Океанский синий',
            'sky-blue': 'Небесно-голубой',
            emerald: 'Изумрудный',
            forest: 'Лесной',
            ruby: 'Рубиновый',
            rose: 'Розовый',
            amber: 'Янтарный',
            orange: 'Оранжевый',
            teal: 'Бирюзовый',
            cyan: 'Голубой',
            midnight: 'Полуночный',
            magenta: 'Маджента',
            lime: 'Лаймовый',
            gold: 'Золотой',
            graphite: 'Графитовый',
            pink: 'Ярко-розовый',
            brown: 'Коричневый',
            indigo: 'Индиго',
            lavender: 'Лавандовый',
            mint: 'Мятный',
            sand: 'Песочный',
            silver: 'Серебряный',
            neon: 'Неоновый',
            peach: 'Персиковый',
            olive: 'Оливковый',
            ice: 'Ледяной',
            coral: 'Коралловый',
            violet: 'Фиалковый',
            steel: 'Стальной',
            bronze: 'Бронзовый'
        }
    },
    en: {
        connect: 'Connect',
        disconnect: 'Disconnect',
        disconnecting: 'Disconnecting...',
        error: 'Error running',
        recommended: 'Recommended',
        recommendedDesc: 'Use the default config',
        manual: 'Manual select',
        manualDesc: 'Choose a WireGuard config',
        settings: 'Settings',
        theme: 'Theme',
        lang: 'Language',
        about: 'About',
        aboutText: 'Wexile Connect<br>v0.2',
        faq: 'FAQ',
        themes: {
            purple: 'Purple',
            'royal-purple': 'Royal Purple',
            'ocean-blue': 'Ocean Blue',
            'sky-blue': 'Sky Blue',
            emerald: 'Emerald',
            forest: 'Forest',
            ruby: 'Ruby',
            rose: 'Rose',
            amber: 'Amber',
            orange: 'Orange',
            teal: 'Teal',
            cyan: 'Cyan',
            midnight: 'Midnight',
            magenta: 'Magenta',
            lime: 'Lime',
            gold: 'Gold',
            graphite: 'Graphite',
            pink: 'Pink',
            brown: 'Brown',
            indigo: 'Indigo',
            lavender: 'Lavender',
            mint: 'Mint',
            sand: 'Sand',
            silver: 'Silver',
            neon: 'Neon',
            peach: 'Peach',
            olive: 'Olive',
            ice: 'Ice',
            coral: 'Coral',
            violet: 'Violet',
            steel: 'Steel',
            bronze: 'Bronze'
        }
    }
};

function applyTheme(theme) {
    THEMES.forEach(t => root.classList.remove('theme-' + t));
    root.classList.add('theme-' + theme);
    localStorage.setItem('theme', theme);
    themeSelect.value = theme;
}
function applyLang(lang) {
    localStorage.setItem('lang', lang);
    langSelect.value = lang;
    const t = TEXTS[lang];
    connectText.textContent = isConnected ? t.disconnect : t.connect;
}
// Restore theme/lang on load
const savedTheme = localStorage.getItem('theme') || 'purple';
const savedLang = localStorage.getItem('lang') || 'ru';
applyTheme(savedTheme);
applyLang(savedLang);
// Theme select
THEMES.forEach(t => {
    if (!themeSelect.querySelector(`[value="${t}"]`)) {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
        themeSelect.appendChild(opt);
    }
});
themeSelect.value = savedTheme;
themeSelect.addEventListener('change', e => applyTheme(e.target.value));
// Lang select
langSelect.value = savedLang;
langSelect.addEventListener('change', e => applyLang(e.target.value));

// Colorful option panels
function updateOptionTheme() {
    const theme = localStorage.getItem('theme') || 'purple';
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('theme-purple','theme-blue','theme-green','theme-red');
        opt.classList.add('theme-' + theme);
    });
}
// Call on theme change
const origApplyTheme = applyTheme;
applyTheme = function(theme) {
    origApplyTheme(theme);
    updateOptionTheme();
};
updateOptionTheme(); 

function updateThemeSelectLang() {
    while (themeSelect.firstChild) themeSelect.removeChild(themeSelect.firstChild);
    const lang = localStorage.getItem('lang') || 'ru';
    THEMES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = TEXTS[lang].themes[t];
        themeSelect.appendChild(opt);
    });
    themeSelect.value = localStorage.getItem('theme') || THEMES[0];
}
const origApplyLang2 = applyLang;
applyLang = function(lang) {
    origApplyLang2(lang);
    updateThemeSelectLang();
};
updateThemeSelectLang(); 