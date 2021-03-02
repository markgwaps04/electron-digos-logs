
const electron = require("electron");
const resolve = require('path').resolve
const remote = electron.remote;

module.exports = {
    get parent_dir() {
        const app_path = remote.app.getAppPath();
        return resolve(app_path + "/");
    }
}

