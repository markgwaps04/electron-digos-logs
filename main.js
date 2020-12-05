
const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const menu = electron.Menu;
const dialog = electron.dialog;
const path = require("path");
const url = require("url");
const fs = require("fs");
const updater = require('electron-updater');
const autoUpdater = updater.autoUpdater;
const process = require("process");

const log = require('electron-log');
log.transports.file.file = process.cwd() + '/log.log';
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
//autoUpdater.setFeedURL('http://10.0.0.252:98/dist');

function createWindow()
{

    win = new BrowserWindow({
        title : "ICT PORTAL v" + app.getVersion(),
        icon: './static/images/raffle_draw.ico',
        width: "100%",
        height : "100%%",
        webPreferences : {
            nodeIntegration : true,
            enableRemoteModule: true
        }
    });
    win.maximize();

    win.once('ready-to-show', () => {
        autoUpdater.checkForUpdates();
        // const a = autoUpdater.downloadUpdate()
        // a.then(function (b) {
        //     //Path
        //     console.log(b);
        // });
    });

    autoUpdater.on('update-downloaded', () => {
       // autoUpdater.quitAndInstall()
    });

    autoUpdater.on('update-available', (ev, info) => {
        win.loadFile(path.join(__dirname, 'view/update_helper.html'))
    });

    autoUpdater.on('update-not-available', (ev, info) => {
        console.log('Update not available');
    });

    autoUpdater.on('download-progress', (progressObj) => {
        // let log_message = "Download speed: " + progressObj.bytesPerSecond;
        // log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        // log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        win.webContents.send("download-progress",{
            "progress_percent" : Math.round(progressObj.percent),
            "download_per_second" : progressObj.bytesPerSecond,
            "total" : progressObj.total
        });
    });

    const main_page = win.loadURL("http://10.0.0.252:99");
    console.log(main_page);

    // win.webContents.openDevTools();

    win.webContents.on('did-finish-load', function() {

        fs.readFile(app.getAppPath() + '/static/index.css', 'utf-8', function(error, data) {
            if(error) throw new Error(error);
            win.webContents.insertCSS(data)
        });

        win.setTitle("ICT PORTAL v" + app.getVersion());

    });



    return win;

}


app.allowRendererProcessReuse = false;


app.on("ready", function() {

    createWindow();

});

app.on("window-all-closed", function () {
    if(process.platform !== "darwin")
    {
        app.quit();
    }
})

app.on('activate', function () {
    if (win==null)
        createWindow();
})
