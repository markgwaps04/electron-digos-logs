var pjson = require('../../package.json');
const { port } = require("../../main.js");
const electron = require("electron");

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

	win.loadURL(`http://localhost:${pjson.server.port}/cswdo`);

}