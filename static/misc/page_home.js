var pjson = require('../../package.json');
const electron = require("electron");
const app = electron.app;
const moment = require('moment')
const moment_tz = require('moment-timezone');
const dotenv = require('dotenv').config();
const process = require("process");
const env = process.env;


exports.pages = function (menu_template, win)
{
    menu_template.submenu = menu_template.submenu || [];
    menu_template.submenu.push({
        label: "Home",
        click: function () {
            init(win)
        }
    });

    win.express.get('/home', async function (req,res) {

        res.render('home/welcome_page.html', {
            path: app.getAppPath(),
            sidebar : "home",
            page_title : "HOME"
        });

    });
}

const init = function (win) {

    win.loadURL(`http://localhost:${env.LOCAL_PORT}/home`);

}