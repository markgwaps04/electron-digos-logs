(function (jq) {

    const puppeteer = require("puppeteer");
    const xlsx = require("xlsx");
    const file_saver = require("file-saver");
    const lodash = require("lodash");
    const moment = require("moment");

    const excel_table_template = jQuery("#excel_table_format").html();

    jq("#export_excel").click(function () {

        var workbook = xlsx.utils.book_new();
        const table = jq('#jsGrid');
        const data = table.jsGrid("option", "data");

        let ofData = lodash.groupBy(data, function (item) {
            const date = item.db_dbo_alias;
            const month = moment(date).format("MM");
            console.log(month);
            return month;
        });

        const ofkeys = lodash.orderBy(Object.keys(ofData));

        const worksheets = ofkeys.map(function (key) {

            let item = ofData[key];
            item = lodash.orderBy(item, function(per_item) {
                const date_of_birth = per_item.db_dbo_alias;
                const dob = moment(date_of_birth);
                if(!dob.isValid()) return -9999;
                return Number(dob.format("DD"));
            });

            const container = jQuery("<item>").html(excel_table_template);
            const month_name = moment(key, "MM").format("MMMM");

            item.forEach(function (per) {

                const table_row = jq("<tr>");

                const name = jq("<td>");
                name.text(per.db_voter_name);

                const precinct = jq("<td>");
                precinct.text(per.db_prec_no);

                const municipality = jq("<td>");
                municipality.text(per.db_mun_city);

                const barangay = jq("<td>");
                barangay.text(per.db_barangay);

                const purok = jq("<td>");
                purok.text(per.db_address);

                const contact = jq("<td>");
                contact.text(per.db_contact);

                const dob_format = jq("<td>");
                const _dob_format = moment(per.db_dbo_alias).format("LLLL");
                dob_format.text("(" + _dob_format.toString() + ")");

                table_row.append(name);
                table_row.append(precinct);
                table_row.append(municipality);
                table_row.append(barangay);
                table_row.append(purok);
                table_row.append(contact);
                table_row.append(dob_format);

                container.find("table").append(table_row);

            });

            container.attr("data-month", month_name);
            return container;

        });

        worksheets.forEach(function (item) {

            var ws1 = xlsx.utils.table_to_sheet(item[0]);
            xlsx.utils.book_append_sheet(workbook, ws1, item.attr("data-month"));

            var wscols = [
                {wpx: 350}, //name
                {wpx: 100}, //precinct
                {wpx: 100}, //municipality
                {wpx: 120}, //barangay
                {wpx: 100}, //purok
                {wpx: 100}, //contact
                {wpx: 350}, //date of birth
            ];
            ws1['!cols'] = wscols;

        });


        function s2ab(s) {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }

        var wbout = xlsx.write(workbook, {bookType: 'xlsx', type: 'binary'});

        file_saver.saveAs(new Blob([s2ab(wbout)], {type: "application/octet-stream"}), 'test.xlsx');

    });

})(jQuery);