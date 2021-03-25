const path = require("path");
const misc = require("electron-dir-solved-ict-portal");

const blackTheme = require(path.join
    (
        misc.parent_dir,
        "/static/plugins/tui-image-editor/black-theme.js"
    )
);


const {generate_id_front} = require(path.join
    (
        misc.parent_dir,
        "/static/misc/scripts/hive_global.js"
    )
);

const hasImageOf =  function(item) {

    if (!item.db_has_image)
        return false;

    if (!item.db_img_file_name)
        return false;

    return true;

};

function delay(callback, ms) {
    var timer = 0;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            callback.apply(context, args);
        }, ms || 0
        );
    };
}

function dataURLtoFile(dataurl, filename) {

	var arr = dataurl.split(','),
		mime = arr[0].match(/:(.*?);/)[1],
		bstr = atob(arr[1]),
		n = bstr.length,
		u8arr = new Uint8Array(n);

	while(n--){
		u8arr[n] = bstr.charCodeAt(n);
	}

	return new File([u8arr], filename, {type:mime});
}

(function (jq) {

        const main_table = $("#jsGrid")

        var originalFilterTemplate = jsGrid.fields.text.prototype.filterTemplate;
        jsGrid.fields.text.prototype.filterTemplate = function () {

            var grid = this._grid;
            var $result = originalFilterTemplate.call(this);

            $result.on("keyup", delay
                (function (e) {
                        grid.search();
                    }, 500
                )
            );

            return $result;

        }

        const misc = jq.ajax({
            url: "/hive/misc",
            method: "POST",
            dataType: "json",
            error : function(e) {
                alert("Error: No Internet Connection");
            }
        });

        misc.then(function (misc_desc) {

            const jsgrid_no_data = jq("#jsgrid_no_data").html()

            main_table.jsGrid(
                {
                    width: "100%",
                    height: "auto",
                    pageSize: 10,
                    pageCount: 5,
                    pageButtonCount: 5,
                    filtering: true,
                    sorting: true,
                    paging: true,
                    inserting: false,
                    editing: false,
                    autoload: true,
                    pageLoading: true,
                    loadIndication: true,
                    loadIndicationDelay: 500,
                    loadMessage: "Getting members list ...",
                    noDataContent: jsgrid_no_data,
                    data: [],
                    fields: [
                        {
                            title: "NAME",
                            name: "db_voter_name",
                            type: "text",
                            width: 200
                        },
                        {
                            title: "PREC NO",
                            name: "db_prec_no",
                            align: "right",
                            type: "text",
                            width: 50
                        },
                        {
                            title: "BARANGAY",
                            name: "db_barangay",
                            type: "select",
                            valueField: "db_name",
                            textField: "db_name",
                            align: "left",
                            items: [{db_name: ""}].concat(misc_desc.list_brgy),
                            width: 100,
                            itemTemplate: function (value, item) {
                                return item[this.name];
                            }
                        },
                        {
                            title: "POSITION",
                            name: "db_position",
                            type: "select",
                            valueField: "db_name",
                            textField: "db_name",
                            align: "left",
                            items: [{db_name: ""}].concat(misc_desc.lis_post),
                            width: 100,
                            itemTemplate: function (value, item) {
                                return item[this.name];
                            }
                        },
                        {
                            title: "Is profile set ?",
                            name: "profile_set",
                            type: "select",
                            valueField: "value",
                            textField: "name",
                            items: [
                                {name: ""},
                                {name: "NOT SET", value: 1},
                                {name: "ALREADY SET", value: 2}
                            ],
                            width: 100,
                            itemTemplate: function (value, item) {

                                const hasImage =  hasImageOf(item);
                                if(!hasImage) return;

                                const badge = jq("<b>");
                                badge.addClass("label bg-success");
                                badge.text("ALREADY SET");
                                return badge;

                            }
                        },
                        {
                            type: "control",
                            editButton: false,
                            deleteButton: false,
                            width: 100,
                            itemTemplate: function (value, item) {

                                const button = jq("<button>");
                                button.addClass("btn btn-success");
                                button.text("View");
                                button.click(function () {
                                    on_click_view_id(item);
                                });

                                return button;

                            }
                        }
                    ],

                    controller: {
                        loadData: function (filter) {

                            const load = jq.ajax(
                                {
                                    url: "/hive/summit_members",
                                    method: "POST",
                                    data: filter,
                                    error : function(e) {
                                        return alert("Error: No Internet Connection");
                                    }
                                }
                            );

                            return load;

                        }
                    }

                }
            );

        });

        const overlay_main = jq(".overlay-spinner");

        function on_click_view_id(item) {

            const send = jq.ajax({
                url: "/hive/view/members_info",
                method: "POST",
                data: {id: item.db_id},
                beforeSend: e => overlay_main.addClass("show"),
                complete: e => overlay_main.removeClass("show"),
                error : function(e) {
                    alert("Error: could not load resource");
                    this.complete(e);
                }
            });


            send.done(function (result) {

                const modal = jQuery.parseHTML(result);
                const open_modal = jq(modal)
                    .modal("show")
                    .on('hidden.bs.modal', function () {
                        jq(modal).remove();
                        jq(".modal-backdrop").remove();
                    });

                let cropperImg = null;


                open_modal
					.find("form")
					.off("submit")
					.on("submit", function(e) {
						e.preventDefault();

						const data = jq(this).serialize_form();
						const formData = new FormData();

						const image = open_modal
							.find(".img_hover_container .image");


						if(image.is("[changed]"))
						{
							const file_image = dataURLtoFile(image.attr("src"));
							formData.append('image', file_image);
						}

						Object
							.keys(data)
							.forEach(function(item) {
								formData.append(item, data[item]);
							});

						const send = jq.ajax({
							url: '/hive/profile_img/set',
							data: formData,
							type: 'POST',
							contentType: false, // NEEDED, DON'T OMIT THIS (requires jQuery 1.6+)
							processData: false, // NEEDED, DON'T OMIT THIS
							beforeSend: e => overlay_main.addClass("show"),
							complete: e => overlay_main.removeClass("show")
						});

						send.done(function () {

						    main_table.jsGrid("loadData");
                            open_modal.find("#success_update_message").removeClass("hide");

                            setTimeout(function() {
                                open_modal.find("#success_update_message").addClass("hide");
                            },5000);

                        });

						send.error(function (error) {
						    alert('Error occured: ' + error.statusText);
						    throw new Error(error.statusText);
                        })

					});

                open_modal.find(".img_hover_container")
                    .off("click")
                    .on("click", function () {

                        let input = document.createElement('input');
                        input.type = 'file';
                        input.accept = "image/*";
                        input.onchange = async function () {

                            const files = this.files;
                            if (!files.length) return;

                            const base64image = await new Promise((res, rej) => {
                                const reader = new FileReader();
                                reader.onload = e => res(e.target.result);
                                reader.onerror = e => rej(e);
                                reader.readAsDataURL(files[0]);
                            });

                            const cropper_container = open_modal.find("#container_croppie");
                            cropper_container.attr("src", base64image);
                            const of_container_image = cropper_container[0];

                            if (cropperImg) {
                                cropperImg.destroy();
                                cropperImg = "";
                            }

                            const cropper = new Cropper(of_container_image, {
                                minContainerWidth: 200,
                                minContainerHeight: 200,
                                aspectRatio: 2 / 2,
                                minCropBoxWidth: 100,
                                minCropBoxHeight: 100,
                            });

                            cropperImg = cropper;

							open_modal.addClass("step2");
							open_modal.removeClass("step1");

                            open_modal
                                .find("#cropper_action .save")
                                .off("click")
                                .on("click", function () {

                                    const canvas = cropper.getCroppedCanvas();
                                    const base64image_canvas = canvas.toDataURL();
                                    open_modal
										.find(".img_hover_container .image")
										.attr("src", base64image_canvas)
										.attr("changed", true);

                                    jq("#container_update").removeClass("hide");
                                    jq("#container_image_cropper").addClass("hide");

									open_modal.addClass("step1");
									open_modal.removeClass("step2");

                                })

                            open_modal
                                .find("#cropper_action .cancel")
                                .off("click")
                                .on("click", function () {

									open_modal.addClass("step1");
									open_modal.removeClass("step2");

                                })


                        };

                        input.click();


                    });




            });

        }


    }
)(jQuery)




