var pjson = require('./package.json');
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
const ipc = electron.ipcMain;
const hive = require("./static/misc/page_hive.js");
const cswdo = require("./static/misc/cswdo.js");
const express = require('express');
const fileUpload = require('express-fileupload');
const express_app = express()
var ejs = require('ejs');
var bodyParser = require('body-parser')
const globalShortcut = electron.globalShortcut;

const log = require('electron-log');
log.transports.file.file = process.cwd() + '/log.log';
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
//autoUpdater.setFeedURL('http://10.0.0.252:98/dist');
const port = pjson.server.port;

autoUpdater.autoDownload = false;


function createWindow() {

	let loading = new BrowserWindow({
		title: "ICT PORTAL v" + app.getVersion(),
		focusable: true,
		show: true,
		closable: false,
		width: "100%",
		height: "100%",
		icon: './static/images/digos-icon.ico',
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			nativeWindowOpen: true
		}
	});



	win = new BrowserWindow({
		title: "ICT PORTAL v" + app.getVersion(),
		show: true,
		maximizable: true,
		transparent: false,
		focusable: false,
		icon: './static/images/digos-icon.ico',
		width: "100%",
		height: "100%",
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			nativeWindowOpen: true
		}
	});



	loading.hide();
	loading.loadFile(path.join(__dirname, 'view/loading.html'));
	loading.maximize();

	loading.on("close", function() {
		win.close();
		//app.quit();
	});
	loading.setEnabled(false);

	win.minimize();
	win.express = express_app;

	win.on("close", function() {
		app.exit();
	});


	autoUpdater.on('update-downloaded', () => {

		win.webContents.send("download-progress", {
			"progress_percent": 100,
			"download_per_second": 0,
			"total": 100
		});

		setTimeout(function() {
			autoUpdater.quitAndInstall()
		}, 5000);


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
		win.webContents.send("download-progress", {
			"progress_percent": Math.round(progressObj.percent),
			"download_per_second": progressObj.bytesPerSecond,
			"total": progressObj.total
		});
	});


	ipc.on("access_download_new_release", function(event, data) {
		autoUpdater.downloadUpdate()
	});

	const main_page = win.loadURL("http://10.0.0.252:99");

	// win.webContents.openDevTools();

	win.webContents.on('did-finish-load', function() {

		fs.readFile(app.getAppPath() + '/static/index.css', 'utf-8', function(error, data) {
			if (error) throw new Error(error);
			win.webContents.insertCSS(data)
		});

		win.setTitle("ICT PORTAL v" + app.getVersion());
		console.log('did-finish-load');

	});

	win.once('ready-to-show', () => {
		autoUpdater.checkForUpdates();
		win.show();
		win.maximize();
		loading.hide();
		win.setFocusable(true);
		console.log("ready-to-show");

	});



	win.webContents.on("did-fail-load", function() {

		win.loadFile(path.join(__dirname, 'view/server_error.html'));
		win.show();
		win.maximize();
		loading.hide();
		win.setEnabled(true);
		win.setFocusable(true);
		console.log("did-fail-load");



	});

	win.webContents.on("will-navigate", function() {
		//win.hide();
		loading.show();
		console.log("will-navigate");
	});

	win.webContents.on("did-stop-loading", function() {
		//win.show();
		loading.hide();
		console.log("did-stop-loading");

	});

	const template = [
		{
			label: "File"
		},
		{
			label: "Pages",
			id: 'menu_pages',
		}
	]

	hive.pages(template[1], win);
	cswdo.pages(template[1], win);


	const menu_template = menu.buildFromTemplate(template);
	menu.setApplicationMenu(menu_template);


	globalShortcut.register('Shift+F11', () => {
		win.webContents.openDevTools();
	});


	return win;

}


app.allowRendererProcessReuse = false;


app.once("ready", function() {

	express_app.listen(port, () => {
		console.log(`Example app listening at http://localhost:${port}`)
		createWindow();
	});

	express_app.use(bodyParser.json());
	express_app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
		limit: "10000000000000",
		extended: true
	}));

	express_app.use(express.static(path.join(app.getAppPath(), 'static')));
	express_app.use(fileUpload());
	express_app.engine('html', ejs.renderFile);
	express_app.set('view engine', 'html');
	express_app.set('views', path.join(app.getAppPath(), 'view'));


});

app.on("window-all-closed", function() {
	if (process.platform !== "darwin") {
		app.quit();
	}
})

app.on('activate', function() {
	if (win == null)
		createWindow();
})
