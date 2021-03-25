const moment = require('moment');
const no_data_template = jQuery("#jsgrid_no_data_main_table").html();


jQuery(function() {

    $('.multiple_select').fSelect({
        showSearch: false
    });

});

(function (jq) {

    const main_table = $("#jsGrid").jsGrid({
        width: "100%",
        height: "auto",
        filtering: false,
        pageCount: 5,
        sorting: false,
        paging: false,
        inserting: false,
        editing: false,
        noDataContent: no_data_template,
        data: [],
        fields: [
            {
                title: "GROUP NAME",
                name: "db_voter_name",
                type: "text",
                width: 200
            },
            {
                title: "LENGTH",
                name: "db_prec_no",
                align: "right",
                type: "text",
                width: 50
            },
            {
                title: "PROCESS",
                name: "db_barangay",
                type: "text",
                width: 100
            },
            {
                type: "control",
                editButton: true,
                deleteButton: true,
                width: 50,
                headerTemplate: function () {

                    const button = jq("<button>");
                    button.addClass("btn btn-success");
                    button.html("<i class='fa fa-plus'></i>&nbsp; ADD");
                    button.attr("href", "#add_group");
                    button.attr("data-toggle", "modal")

                    return button;

                }
            }
        ],

    });

})(jQuery);


(async function (jq) {

    const filter_val = {
        get_details : function () {
            const filter_section = jQuery("#filter_search");
            return Object.fromEntries(new FormData(filter_section[0]).entries());
        }
    }

    window.test = filter_val;

    const misc = await jq.ajax({
        url: "/hive/misc",
        method: "POST"
    });

    const add_members = jq("#jsGrid-add-members").jsGrid({
        width: "100%",
        height: "auto",
        pageSize: 10,
        pageCount: 5,

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
        noDataContent: no_data_template,
        data: [],
        fields: [
            {
                title: "NAME",
                name: "db_voter_name",
                type: "text",
                width: "100%"
            },
            {
                title: "BIRTHDATE",
                name: "db_dbo",
                align: "center",
                filtering : false,
                type: "text",
                width: 120
            },
            {
                title: "CONTACT NO.",
                name: "db_contact",
                filtering : false,
                align: "center",
                type: "text",
                width: 120
            },
            {
                title: "PREC NO",
                name: "db_prec_no",
                align: "right",
                type: "text",
                width: 100
            },
            {
                title: "BARANGAY",
                name: "db_barangay",
                type: "select",
                valueField: "db_name",
                textField: "db_name",
                align: "left",
                items: [{db_name: ""}].concat(misc.list_brgy),
                width: 100,
                __itemTemplate: function (value, item) {
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
                items: [{db_name: ""}].concat(misc.lis_post),
                width: 100,
                __itemTemplate: function (value, item) {
                    return item[this.name];
                }
            },
            {
                type: "control",
                editButton: false,
                deleteButton: false,
                width: 150,
                itemTemplate: function (value, item) {

                    const filter_data = filter_val.get_details();
                    item.is_selected = false;

                    const grid = this._grid;
                    const main_table_data = grid.main_table_data;

                    const label = jQuery("<label>")
                    const content = jQuery("<span>");

                    if(!item.db_qr_code || !item.db_dbo_alias)
                    {
                        label.addClass("btn btn-danger");
                        content.html("<i class='fa fa-times'></i> Invalid");
                        label.append(content);
                        return label;
                    }


                    item.is_selected = false;

                    label.addClass("btn btn-info");
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
            }
        ],

        controller: {
            loadData: function (filter) {

                const filter_data = filter_val.get_details();
                console.log(filter_data);

                const load = jq.ajax({
                    url: "/hive/summit_members",
                    method: "POST",
                    data: Object.assign(filter, filter_data)
                });

                return load;

            }
        }
    });



})(jQuery);

jQuery(function(jq) {

    const birthday_range = jQuery("#birthday_range").daterangepicker({
        autoUpdateInput: false,
        startDate: moment().startOf('hour'),
        endDate: moment().startOf('hour').add(32, 'hour')
    });

    birthday_range.on('apply.daterangepicker', function (ev, picker) {
            $(this).val(picker.startDate.format('L') + " - " + picker.endDate.format('L'));
            $(this).trigger("change");
        });

    birthday_range.on('cancel.daterangepicker', function (ev, picker) {
            $(this).val('');
            $(this).trigger("change");
        });

    birthday_range.trigger("change");

});