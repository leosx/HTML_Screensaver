const electronBuilder = require('electron-builder');
const {
    src,
    dest,
    series,
    parallel
} = require('gulp');
const fs = require('fs');
const path = require('path');

function clearTask() {
    return new Promise((resolve, reject) => {
        let folderPath = __dirname;
        let distPath = path.join(folderPath, 'dist');

        _delDir(distPath);
        resolve();
    });
}

/**
 * 开始打包。
 */
async function electronPackage() {
    return await electronBuilder.build();
}

function copyFiles() {
    return src('./package.json').pipe(dest('./dist'));
}

function copyEntryjs() {
    return src('./entry.js').pipe(dest('./dist'));
}

function _delDir(p) {
    let files = [];

    if (fs.existsSync(p)) {
        files = fs.readdirSync(p);
        files.forEach((file) => {
            let curPath = p + "/" + file;

            if (fs.statSync(curPath).isDirectory()) {

                //递归删除文件夹
                _delDir(curPath);
            } else {

                //删除文件
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(p);
    }
}

/**
 * 拷贝默认特效
 */
function copyDefaultEffect() {
    return src('./defaultEffect/**/*.*').pipe(dest('../out/win-unpacked/defaultEffect'));
}

/**
 * 拷贝配置文件到根目录
 */
function copyConfig() {
    return src('./config.json').pipe(dest('../out/win-unpacked/'));
}

/**
 * 拷贝特效文件夹
 */
function copyEffects() {
    return src('./ScreenEffects/**/*.*').pipe(dest('../out/win-unpacked/ScreenEffects'));
}

/**
 * 重命名应用程序后缀名称为.scr
 */
function renameExe() {
    return new Promise((resolve, reject) => {
        try {
            let oldPath = path.join(path.dirname(__dirname), 'out', 'win-unpacked', 'HTML屏保.exe');
            let newPath = path.join(path.dirname(__dirname), 'out', 'win-unpacked', 'HTML屏保.scr');
            fs.renameSync(oldPath, newPath);
            resolve();
        } catch (e) {
            reject(e);
        }
    });
}

module.exports.default = series(clearTask, parallel(copyFiles, copyEntryjs), electronPackage, copyConfig, copyDefaultEffect, copyEffects, renameExe);