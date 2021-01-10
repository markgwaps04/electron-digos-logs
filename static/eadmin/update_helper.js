const electron = require("electron");
const ipc = electron.ipcRenderer;

(function(jq) {

    const jquery = require("jquery")

    const download_app_release = document.getElementById("download_app_release");
    download_app_release.addEventListener("click" , function () {
        ipc.send("access_download_new_release");
        jquery(".download-progress").removeClass("hide");
        jquery("#download_app_release").addClass("hide");
    });

    ipc.on("download-progress", function (event, value) {
        console.log(value);
        jquery(".download-progress").find(".bar").css("width", [String(value.progress_percent),"%"].join(""));
        jquery(".download-progress").find("label").html(`Downloading... <b>${value.progress_percent}%</b>`);
    });

})(jQuery)