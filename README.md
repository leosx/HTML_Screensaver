# HTML_Screensaver
一个基于Electron的屏保程序，有如下特性：
- 支持自定义扩展HTML屏保特效
- 多屏合并为一屏展示屏保特效
- 多个屏幕，每个屏幕指定不同特效

------ 

## 使用说明：
屏保扩展分为两部分
- config.json 配置文件
```json
{
    "MultipleDeviceFullScreen": false,
    "Random": true,
    "ScreenEffects": [{
        "x": 0,
        "y": 0,
        "effect": "TimeCompass\\index.html"
    }, {
        "x": -1920,
        "y": 0,
        "effect": "particleSpiral\\index.html"
    }]
}
```
*MultipleDeviceFullScreen* 指定了是否将多个屏幕合并为单屏显示屏保特效；*Random* 指定了是否随机（仅在MultipleDeviceFullScreen=false时生效）；*ScreenEffects* 指定了每个屏幕的显示特效（仅在MultipleDeviceFullScreen=false时生效）。

- ScreenEffects文件夹
> ScreenEffects文件夹里面的每一个文件夹表示一个屏保特效HTML源代码。扩展特效时，只需要在ScreenEffects文件夹下新建一个文件夹，然后将写好的HTML屏保特效代码放入新建的文件夹，然后再config.json中配置好就可以了。

- 安装使用：
> 下载.zip压缩包后，找到HTML屏保.scr文件，鼠标右键菜单中选择安装即可