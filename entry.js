const electron = require('electron');
const fs = require('fs');
const {
    app,
    BrowserWindow,
    Menu,
    screen,
    ipcMain
} = electron;
const path = require("path");
const log4js = require('log4js');
let mainWindow = null;
let exeFullPath = app.getPath('exe');
let exeFolder = path.dirname(exeFullPath);
log4js.configure({
    appenders: {
        cheese: {
            type: 'file',
            filename: 'cheese.log'
        }
    },
    categories: {
        default: {
            appenders: ['cheese'],
            level: 'error'
        }
    }
});
const logger = log4js.getLogger('cheese');

path.devjoin = function (args) {
    if (!args || !args.devargs || !args.productArgs) {
        return undefined;
    }

    let uri = '';
    if (process.env.env_mode === "development") {
        args.devargs.forEach((item, index) => {
            uri = path.join(uri, item);
        });
    } else {
        args.productArgs.forEach((item, index) => {
            uri = path.join(uri, item);
        });
    }

    return uri;
};

/**
 * 获取所有显示器拼接到一起的整体分辨率，及最小坐标点（左上角）
 */
function getAllScreenSize() {
    let displays = screen.getAllDisplays();
    let ltwidth = 0;
    let gtwidth = 0;
    let ltheight = 0;
    let gtheight = 0;
    let minx = 0;
    let miny = 0;
    let width, wposition;
    let height, hposition;
    displays.forEach((display) => {
        wposition = display.bounds.x;
        width = display.bounds.width;
        if (minx > wposition) {
            minx = wposition;
        }
        if (wposition < 0 && width > ltwidth) {
            // ＜ 0 的宽度最小值
            ltwidth = width;
        } else if (wposition >= 0 && width > gtwidth) {
            // ＞ 0 的宽度最大值
            gtwidth = width;
        }

        height = display.bounds.height;
        hposition = display.bounds.y;
        if (miny > hposition) {
            miny = hposition;
        }
        if (hposition < 0 && height > ltheight) {
            ltheight = height;
        } else if (hposition >= 0 && height > gtheight) {
            gtheight = height;
        }
    });

    return {
        width: ltwidth + gtwidth,
        height: ltheight + gtheight,
        x: minx,
        y: miny
    };
}

/**
 * 获取配置文件
 */
function getConfigInfo() {
    let configPath;
    if (process.env.env_mode === "development") {
        configPath = path.join(__dirname, 'config.json');
    } else {
        configPath = path.join(exeFolder, "config.json");
    }

    let jsonStr = fs.readFileSync(configPath, {
        encoding: 'utf8',
        flag: 'r'
    });
    let jsonResult = JSON.parse(jsonStr);
    jsonResult.ScreenEffects = [];

    let EffectFolder;
    if (process.env.env_mode === "development") {
        EffectFolder = path.join(__dirname, 'ScreenEffects');
    } else {
        EffectFolder = path.join(exeFolder, 'ScreenEffects');
    }

    let files = fs.readdirSync(EffectFolder);
    files.forEach((item, index) => {
        let folderPath = path.join(EffectFolder, item);
        let stat = fs.statSync(folderPath);
        if (stat.isDirectory()) {
            jsonResult.ScreenEffects.push(path.join(item, 'index.html'));
        }
    });

    return jsonResult;
}

/**
 * 多显示器合并为一个显示效果
 * @param {Object} config JSON配置信息
 */
function fullScreenEffect(config) {
    let {
        width,
        height,
        x,
        y
    } = getAllScreenSize();
    mainWindow = new BrowserWindow({
        width,
        height,
        minWidth: width,
        minHeight: height,
        x,
        y,
        frame: false,
        show: true,
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false
        }
    });
    setWindowScript(mainWindow);
    // mainWindow.webContents.openDevTools();
    mainWindow.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
    mainWindow.setMaximumSize(width, height);
    let uri = '';
    if (typeof (config.Random) !== 'undefined' && config.Random == true) {
        let tempindex = getRndInteger(config.ScreenEffects.length);
        uri = getConfigEffect(config, tempindex);
    } else {
        uri = getConfigEffect(config, 0);
    }

    mainWindow.loadURL(uri);
}

/**
 * 获取介于0和max之间的随机数。不包含最大值
 * @param {Number} max 最大值
 */
function getRndInteger(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

/**
 * 单显示器一个实例效果。
 */
function singleEffect(config) {
    let displays = screen.getAllDisplays();
    let tempWindow, display, historys = [];
    for (let index = 0, count = displays.length; index < count; index++) {
        display = displays[index];
        tempWindow = new BrowserWindow({
            width: display.bounds.width,
            height: display.bounds.height,
            minWidth: display.bounds.width,
            minHeight: display.bounds.height,
            x: display.bounds.x,
            y: display.bounds.y,
            frame: false,
            show: true,
            fullscreen: true,
            webPreferences: {
                nodeIntegration: true
            }
        });
        setWindowScript(tempWindow);
        // tempWindow.webContents.openDevTools();
        tempWindow.setMaximumSize(display.bounds.width, display.bounds.height);
        let uri = '';
        if (typeof (config.Random) !== 'undefined' && config.Random == true) {
            let tempindex = 0;
            if (config.ScreenEffects.length >= displays.length) {
                tempindex = getDiffrentRandomValue(config.ScreenEffects.length, historys);
            } else {
                tempindex = getRndInteger(config.ScreenEffects.length);
            }

            uri = getConfigEffect(config, tempindex);
        } else {
            uri = getConfigEffect(config, index);
        }

        tempWindow.loadURL(uri);
        if (!mainWindow) {
            mainWindow = tempWindow;
        }
    }
}

/**
 * 获取0~maxLength之间的不重复随机数。
 * @param {Number} maxLength 最大值
 * @param {Array} history 历史记录数组
 */
function getDiffrentRandomValue(maxLength, history) {
    let tempindex = getRndInteger(maxLength);
    if (history.includes(tempindex)) {
        return getDiffrentRandomValue(maxLength, history);
    } else {
        history.push(tempindex);
        return tempindex;
    }
}

/**
 * 从配置
 * @param {JSON} config 配置文件
 * @param {Number} index 索引配置项
 */
function getConfigEffect(config, index) {
    let uri = '';
    if (config.ScreenEffects && config.ScreenEffects.length > 0 && config.ScreenEffects.length > index && index >= 0) {
        let effectItem = config.ScreenEffects[index]
        if (!effectItem || !effectItem) {
            uri = "default";
        } else {
            uri = path.devjoin({
                productArgs: [exeFolder, 'ScreenEffects', effectItem],
                devargs: [__dirname, 'ScreenEffects', effectItem]
            });
        }
    } else {
        uri = "default";
    }

    if (uri === "default") {
        uri = path.devjoin({
            productArgs: [exeFolder, 'defaultEffect', 'index.html'],
            devargs: [__dirname, 'defaultEffect', 'index.html']
        });
    }

    return uri;
}

/**
 * 为窗体注入关闭脚本。
 * @param {object} win Window对象
 */
function setWindowScript(win) {
    win.webContents.on('did-finish-load', async () => {
        await win.webContents.executeJavaScript(`let {ipcRenderer} = require('electron');
          function sx_closeApp() {
            ipcRenderer.send('quit');
          }
          document.addEventListener('mousedown', sx_closeApp);
          document.addEventListener('mousemove', sx_closeApp);
          document.addEventListener('keydown', sx_closeApp);`, true);
    });
}

async function creatMainWindow() {
    Menu.setApplicationMenu(null);
    ipcMain.on('quit', (ipcmaine) => {
        app.quit();
        process.exit(0);
    });
    let config;
    try {
        config = getConfigInfo();
    } catch (e) {
        logger.error(`加载配置文件失败：${e}`);
        config = {
            "MultipleDeviceFullScreen": false,
            "Random": true,
            "ScreenEffects": []
        };
    }

    try {
        if (typeof (config.MultipleDeviceFullScreen) !== "undefined" && config.MultipleDeviceFullScreen == true) {
            fullScreenEffect(config);
        } else {
            singleEffect(config);
        }
    } catch (e) {
        logger.error(`加载屏保特效失败：${e}`);
    }

    mainWindow.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {

        // 当运行第二个实例时,将会聚焦到 mainWindow 这个窗口.
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            mainWindow.focus();
        }
    });

    app.on('ready', creatMainWindow);
}