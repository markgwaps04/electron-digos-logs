const electron = require("electron");
const ipc = electron.ipcRenderer;
const puppeteer = require("puppeteer");
const http = require("http");
const qr = require('qr-image');
const pdfjs = require('pdfobject');
const html2canvas = require('html2canvas');

console.log(html2canvas);

function delay(callback, ms) {
    var timer = 0;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            callback.apply(context, args);
        }, ms || 0);
    };
}


(function (jq) {

    var originalFilterTemplate = jsGrid.fields.text.prototype.filterTemplate;
    jsGrid.fields.text.prototype.filterTemplate = function () {

        var grid = this._grid;
        var $result = originalFilterTemplate.call(this);

        $result.on("keyup", delay(function (e) {
            grid.search();
        }, 500));

        return $result;

    }


    const misc = jq.ajax({
        url: "/hive/misc",
        method: "POST"
    });

    misc.then(function (misc_desc) {

        const jsgrid_no_data_main_table = jq("#jsgrid_no_data_main_table").html();
        const jsgrid_no_data_add_que_list = jq("#jsgrid_no_data_add_que_list").html()

        const main_table = $("#jsGrid").jsGrid({
            width: "100%",
            height: "auto",

            filtering: false,
            sorting: false,
            paging: false,
            inserting: false,
            editing: false,
            noDataContent: jsgrid_no_data_main_table,

            data: [],
            onItemInserting: function (args) {
                const already_added_data = args.grid.data;
                const group_by_db_id = _.groupBy(already_added_data, "db_id");
                const is_already_exists = group_by_db_id.hasOwnProperty(args.item.db_id);

                if (is_already_exists) {
                    args.cancel = true;
                    return alert('The selected row is already exists');
                }
            },

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
                    type: "text",
                    width: 100
                },
                {
                    title: "CONTACT",
                    name: "db_contact",
                    type: "text",
                    width: 100
                },
                {
                    title: "POSITION",
                    name: "db_position",
                    type: "text",
                    width: 100,
                },
                {
                    type: "control",
                    editButton: true,
                    deleteButton: true,
                    width: 50,
                    headerTemplate: function () {

                        const button = jq("<button>");
                        button.addClass("btn btn-success");
                        button.text("Add");
                        button.attr("href", "#myModal");
                        button.attr("data-toggle", "modal")

                        return button;

                    }
                }
            ],

        });

        const filter_section = jQuery("#filter_settings");
        const filter_val = {
            get details() {
                return Object.fromEntries(new FormData(filter_section[0]).entries());
            }
        }




        const add_que_list = $("#add_que_list").jsGrid({
            width: "100%",
            height: "auto",
            pageSize: 10,

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
            noDataContent: jsgrid_no_data_add_que_list,
            onDataLoading: function (args) {
                const already_add = main_table.jsGrid("option", "data");
                const group_by_db_id = _.groupBy(already_add, "db_id");
                this.main_table_data = group_by_db_id;
            },

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
                    items: [{ db_name: "" }].concat(misc_desc.list_brgy),
                    width: 100,
                    itemTemplate: function (value, item) {
                        return item[this.name];
                    }
                },
                {
                    title: "CONTACT",
                    name: "db_contact",
                    type: "text",
                    width: 100
                },
                {
                    title: "POSITION",
                    name: "db_position",
                    type: "select",
                    valueField: "db_name",
                    textField: "db_name",
                    align: "left",
                    items: [{ db_name: "" }].concat(misc_desc.lis_post),
                    width: 100,
                    itemTemplate: function (value, item) {
                        return item[this.name];
                    }
                },
                {
                    type: "control",
                    editButton: false,
                    deleteButton: false,
                    width: 100,
                    filterTemplate: function (value, item) {

                        const template = jsGrid
                            .fields
                            .control
                            .prototype
                            .filterTemplate();

                        const page_limit = jq("<input>");
                        page_limit.attr("type", "number");
                        page_limit.attr("value","10")
                        page_limit.attr("placeholder", "Page limit")

                        return page_limit;

                    },
                    itemTemplate: function (value, item) {

                        const filter_data = filter_val.details;
                        item.is_selected = false;

                        const grid = this._grid;
                        const main_table_data = grid.main_table_data;

                        const is_already_exists = main_table_data.hasOwnProperty(item.db_id);

                        if (is_already_exists) {
                            return;
                        }


                        if (filter_data.hasOwnProperty("is_multiple_selections")) {

                            const label = jQuery("<label>")
                            label.addClass("btn btn-info");

                            item.is_selected = false;

                            const content = jQuery("<span>");
                            content.html("Select");

                            label.append(content);

                            const input = jQuery("<input>");
                            input.attr("type", "checkbox");
                            input.addClass("badgebox");

                            if (filter_data.hasOwnProperty("select_all")) {
                                label.removeClass("btn-info");
                                label.addClass("btn-default");
                                content.html("Unselect");
                                input.attr("checked", true);
                                item.is_selected = true;
                            }

                            label.append(input);

                            input.change(function () {

                                if (this.checked) {
                                    label.removeClass("btn-info");
                                    label.addClass("btn-default");
                                    content.html("Unselect");
                                    item.is_selected = true;
                                    return;
                                }
                                label.removeClass("btn-default");
                                label.addClass("btn-info");
                                content.html("Select");
                                item.is_selected = false;

                                jQuery("#select_all input").attr("checked", false);

                            });

                            const span = jQuery("<span>");
                            span.addClass("badge");
                            span.html("&check;");
                            label.append(span);


                            return label;
                        }

                        const button = jq("<button>");
                        button.addClass("btn btn-success");
                        button.text("Select");

                        button.click(function () {

                            main_table.jsGrid("insertItem", item);
                            jq(".modal").modal("hide");

                        });

                        return button;

                    }
                }
            ],

            controller: {
                loadData: function (filter) {

                    const filter_data = filter_val.details;

                    const modal_save_btn = jQuery("#modal_save").attr("disabled", true);
                    const select_all_btn = jQuery("#select_all").addClass("hide");

                    if (filter_data.hasOwnProperty("is_multiple_selections")) {
                        modal_save_btn.removeAttr("disabled");
                        select_all_btn.removeClass("hide");
                    }

                    const load = jq.ajax({
                        url: "/hive/summit_members",
                        method: "POST",
                        data: Object.assign(filter, filter_data)
                    });

                    return load;

                }
            }
        });

        jQuery("#filter_settings input, #filter_settings select ")
            .keyup(delay(function () {
                add_que_list.jsGrid("loadData");
            }))
            .change(function () {
                add_que_list.jsGrid("loadData");
            });

        jq(".modal").on("shown.bs.modal", function () {
            add_que_list.jsGrid("loadData");
        });
        jq(".modal").on("hide.bs.modal", function () {
            add_que_list.jsGrid("option", "data", []);
        });

        jq("#remove_all").click(function () {

            const is_continue = confirm("Are you sure you want to remove all items in the que list");
            if (!is_continue) return;
            main_table.jsGrid("option", "data", []);

        });

        jq("#modal_save").click(function () {
            const que_data = add_que_list.jsGrid("option", "data");
            const selected_items = que_data.filter(e => e.is_selected);
            selected_items.forEach(function (items) {
                main_table.jsGrid("insertItem", items);
            });
            jq(".modal").modal("hide");
        });

        jq("#reset_filter").click(function () {
            add_que_list.jsGrid("clearFilter");
            jQuery("#select_all").addClass("hide");
        });

        //__________________________________________


        jq("#print").click(function () {

            jQuery(".main_container .overlay-spinner").addClass("show");

            const main_data = main_table.jsGrid("option", "data");

            const callback_generate = function () {

                let i = 0;
                const generated_list = [];
                const func = function (callback = new Function) {

                    const details = main_data[i];

                    const front = generate_id_front({
                        surname: details.db_lname,
                        firstname: details.db_fname,
                        middlename: details.db_mname,
                        gender: "M",
                        birthdate: details.db_dbo,
                        address: details.db_address,
                        barangay: details.db_barangay,
                        precinct_no: details.db_prec_no,
                        qr_code: details.db_qr_code,
                        img_pic : details.db_mem_pic
                    });


                    front.then(function (front_data) {

                        const back = generate_id_back();
                        back.then(function (back_data) {

                            generated_list.push({
                                front: front_data,
                                back: back_data
                            });

                            i += 1;

                            if (main_data.length > i) func(callback);
                            else callback(generated_list)


                        });


                    });


                }

                if (main_data.length > i)
                    func(generate_print_format)



            }

            callback_generate();


        });

        jq("#print_temporary").click(function() {

            jQuery(".main_container .overlay-spinner").addClass("show");

            const main_data = main_table.jsGrid("option", "data");

            const callback_generate = function () {

                let i = 0;
                const generated_list = [];
                const func = function (callback = new Function) {

                    const details = main_data[i];

                    const front = generate_temporary_id({
                        id : details.db_id,
                        surname: details.db_lname,
                        firstname: details.db_fname,
                        middlename: details.db_mname,
                        full_name : details.db_voter_name,
                        gender: "M",
                        birthdate: details.db_dbo,
                        address: details.db_address,
                        barangay: details.db_barangay,
                        precinct_no: details.db_prec_no,
                        qr_code: details.db_qr_code,
                        img_pic : details.db_mem_pic
                    });


                    front.then(function (front_data) {

                        const back = generate_id_back();
                        back.then(function (back_data) {

                            generated_list.push({
                                front: front_data,
                                back: back_data
                            });

                            i += 1;

                            if (main_data.length > i) func(callback);
                            else callback(generated_list)


                        });


                    });


                }

                if (main_data.length > i)
                    func(generate_print_format)


            }

            callback_generate();

        })

        const generate_print_format = function(set) {

            const container = document.createElement("div");

            set = set.map(function (item) {

               const front_img = document.createElement("img");

               front_img.src = item.front;
               front_img.style.width = "100%";
               front_img.style.height = "206px";

               front_img.style.border = "2px solid black";

               return front_img;

            });

            set = _.chunk(set, 3);
            const page_break = _.chunk(set, 3);
            page_break.forEach(function (per_third_row, index) {

                            let is_state = false;

                            const table = document.createElement("table");
                            table.style.padding = "0px";
                            table.style.margin = "0px";
                            table.style.top = "0px";
                            table.style.borderCollapse = "separate";
                            table.style.borderSpacing = "30px 30px";
                            table.style.width = "100%";
                            table.style.position = "relative"
                            table.style.top = "-30px"

                            table.style.pageBreakBefore = "always";

                            per_third_row.forEach(function (per_row) {

                                const row = document.createElement("tr");
                                if((3 - per_row.length) > 0)
                                {
                                    const items_null = Array(3 -per_row.length).fill("");
                                    const row_per_null = per_row.concat(items_null);
                                    per_row = row_per_null;
                                }

                                console.log(per_row);

                                per_row.forEach(function (per_data) {

                                    const front_td = document.createElement("td");
                                    front_td.style.width = "326px";

                                    front_td.append(per_data);
                                    row.append(front_td);
                                });

                                table.append(row);

                            });

                            container.append(table)

                        });


            const of_print_window =  async function() {

                // Set the content type so the browser knows how to handle the response.

                const browser = await puppeteer.launch({headless : true});

                const page = await browser.newPage();
                await page.setContent(container.outerHTML);
                const buffer = await page.pdf({
                      format: "A4",
                      landscape: true,
                      debug: true,
                      printBackground: true,
                      margin: {
                         top: "0.5cm",
                         right: "0.0cm",
                         bottom: "0.1cm",
                         left: "0.0cm"
                      }
                });

                await browser.close();
                console.log(buffer);

                const print_server = http.createServer(async (req, res) => {
                    res.writeHead(200, { "Content-Type": "application/pdf" });
                    res.end(buffer);
                }).listen("3055")

                var file = new Blob([buffer], { type: 'application/pdf' });

                const fileURL = URL.createObjectURL(file);
                const viewer = document.getElementById("print_window");
                pdfjs.embed(fileURL, viewer);



            }

            of_print_window().then(function() {
                var print_modal = document.getElementById("print_modal");
                jQuery(print_modal).modal("show");
                jQuery(".main_container .overlay-spinner").removeClass("show");
            });

            return;

        }

        const text_newline_generator = function(str, max_length) {

            const re = function(that_arr) {
                const target = String(that_arr[max_length]).trim();
                if(!target)
                {
                    that_arr.splice(max_length, 1, "<||>");
                    const new_arr = that_arr.join("").split("<||>");
                    return new_arr;
                }

                if(max_length <= 0) return [that_arr.join("")];
                max_length = max_length - 1;
                return re(that_arr);

            };

            if(!str || str.length < max_length)
                return [str];

            const arr = String(str).split("");
            return re(arr);

        }

        const generate_temporary_id = function(params)
        {

            const canvas = document.createElement("canvas");
            canvas.width = "1000";
            canvas.height = "600";
            const context = canvas.getContext('2d');

            const base_image = new Image();
            base_image.src = 'images/temporary_id_test.jpg';

            return new Promise(function (resolve) {

                base_image.onload = function () {

                    context.drawImage(base_image, 0, 0,
                        base_image.width,
                        base_image.height,     // source rectangle
                        0, 0, canvas.width,
                        canvas.height
                    );

                     var f = new FontFace('coresansar', 'url(fonts/core-sans-ar/CoreSansAR-65Bold.ttf)');

                     f.load().then(function (font) {

                        document.fonts.add(font);
                        context.font = '700 35px "coresansar"';
                        context.fillStyle = "#00000";
                        context.textAlign = "center";

                        if(String(params.id).length < 5)
                        {
                            let array_of_zero = Array(5 - String(params.id).length);
                            array_of_zero = array_of_zero.fill(0).join("");
                            array_of_zero += "" +String(params.id);
                            array_of_zero.replace(4)
                            context.fillText("Control No., " + array_of_zero, 490,235);
                        }
                        else
                            context.fillText("Control No., " + String(params.id), 490,235);

                        const full_name_length = String(params.full_name).length;
                        console.log(full_name_length);

                        if(full_name_length > 30 && full_name_length <= 35)
                            context.font = '700 43px "coresansar"';
                        else if(full_name_length > 35 && full_name_length <= 40)
                            context.font = '700 35px "coresansar"';
                        else if(full_name_length > 40)
                            context.font = '700 30px "coresansar"';
                        else
                           context.font = '700 50px "coresansar"';

                        context.fillStyle = "#8B0F1B";
                        context.fillText(params.full_name, 490,328); //9
                        context.font = '700 40px "coresansar"';
                        context.fillStyle = "#080000";

                        let full_address = [params.address, params.barangay];
                        full_address = full_address.filter(Boolean);
                        full_address = full_address.join(" ");

                        if(String(full_address).trim().length > 0)
                        {
                            console.log(String(full_address).trim().length);
                            if(String(full_address).trim().length > 25)
                                context.fillText(params.barangay + ", DIGOS CITY", 490,380); //9
                            else
                                context.fillText(full_address + ", DIGOS CITY", 490,380); //9
                        }
                        else
                            context.fillText("DIGOS CITY", 490,380); //9


                        return resolve(canvas.toDataURL("image/jpeg"));

                     });

                }

            });



        }

        const generate_id_front = function (params) {

            const canvas = document.createElement("canvas");
            canvas.width = "1000";
            canvas.height = "600";
            canvas.style.letterSpacing = '2px';
            const context = canvas.getContext('2d');


            const base_image = new Image();
            base_image.src = 'images/front.jpg';

            return new Promise(function (resolve) {

                base_image.onload = function () {

                    context.drawImage(base_image, 0, 0, base_image.width, base_image.height,     // source rectangle
                        0, 0, canvas.width, canvas.height);

                    var f = new FontFace('OCR A EXTENDED', 'url(fonts/ocr.ttf)');

                    f.load().then(function (font) {

                        document.fonts.add(font);

                        context.font = '700 30px "OCR A EXTENDED"';
                        context.fillStyle = "#28166f";
                        context.fillText(params.surname, 460,195);
                        context.fillText(params.firstname, 460, 242);
                        context.fillText(params.middlename, 460, 286);
                        context.fillText(params.gender, 460, 338);
                        context.fillText(params.birthdate, 460, 380);
                        const of_address = text_newline_generator(params.address,24);

                        if(params.address && String(params.address).length < 15 )
                        {
                            context.fillText(of_address[0], 460, 421);
                            context.fillText("-", 460, 470);
                        }
                        else
                        {
                            of_address.forEach(function(value, index) {
                                context.fillText(value, 313, 450 + (index * 30));
                            });
                        }


                        context.fillText(params.precinct_no, 460, 562)

                        if(params.barangay && String(params.barangay).length >= 15)
                            context.font = '700 23px "OCR A EXTENDED"';

                        context.fillText(params.barangay, 460, 520);


                        var qr_img_string = qr.imageSync(params.qr_code, {
                            type: 'png',
                            margin: 2,
                            size : 9
                        });

                        const qr_image = new Image();
                        qr_image.src = `data:image/png;base64,${qr_img_string.toString('base64')}`

                        qr_image.onload = function () {

                            context.drawImage(qr_image, 746, 320);

                            const profile_pic = new Image();
                            profile_pic.src = `images/default.png`;
                          
                            if (params.hasOwnProperty("img_pic") && params.img_pic) {
                                const img_profile = Buffer.from(params.img_pic.data).toString();
                                profile_pic.src = `data:image;base64,${img_profile}`;
                            }

                            profile_pic.width = 500;
                            profile_pic.width = 500;

                            profile_pic.onload = function () {

                                context.drawImage(profile_pic, 35, 162, 249, 249);

                                return resolve(canvas.toDataURL("image/jpeg"));

                            }

                            

                        }

                        

                    });



                }

            });

        }

        const generate_id_back = function ()
        {
            const canvas = document.createElement("canvas");
            canvas.width = "1000";
            canvas.height = "600";
            const context = canvas.getContext('2d');

            const base_image = new Image();
            base_image.src = 'images/back.jpg';

            return new Promise(function (resolve) {

                base_image.onload = function () {

                    context.drawImage(base_image, 0, 0, base_image.width, base_image.height,     // source rectangle
                        0, 0, canvas.width, canvas.height);

                    return resolve(canvas.toDataURL("image/jpeg"));

                }

            });

        }

    });








})(jQuery);
