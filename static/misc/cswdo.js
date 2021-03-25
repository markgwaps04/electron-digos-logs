var pjson = require('../../package.json');
const { port } = require("../../main.js");
const electron = require("electron");
const dotenv = require('dotenv').config();
const process = require("process");
const env = process.env;

const app = electron.app;

exports.pages = function(menu_template, win) {

	menu_template.submenu = menu_template.submenu || [];
	menu_template.submenu.push({
		label: "CSWDO",
		click: function() {
			init(win)
		}
	});

	win.express.get('/cswdo', (req, res) => {

		res.render('cswdo/index.html', {
            path: app.getAppPath()
        });

	});

}

const init = function(win) {

	win.loadURL(`http://localhost:${env.LOCAL_PORT}/cswdo`);

}