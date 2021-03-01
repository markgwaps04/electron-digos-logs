var pjson = require('../../package.json');
const electron = require("electron");
const menu = electron.Menu;
const menuItem = electron.MenuItem;
const url = require("url");
const path = require("path");
const {dialog} = require("electron");
const app = electron.app;
const {port} = require("../../main.js");
const moment = require('moment')
const moment_tz = require('moment-timezone');

const database = require('knex')({
    client: 'mysql2',
    acquireConnectionTimeout: 1000,
    connection: {
        host: '185.214.124.3',
        user: 'u822707621_hive',
        password: 'Knightf3$',
        database: 'u822707621_hive'
    },
    debug: false
});

const DIGOS_MUN_CODE = "112403";

exports.database = database;


exports.pages = function (menu_template, win) {

    menu_template.submenu = menu_template.submenu || [];
    menu_template.submenu.push({
        label: "Hive",
        click: function () {
            init(win)
        }
    });

    win.express.get('/hive', (req, res) => {

//        const current = moment_tz().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");
//
//        const halo = database("summit_member")
//            .whereNotNull('print_temporary_since')
//            .update({ "print_temporary_since" : null, "print_official_since" : null });
//
//        halo.then(function(result) {
//            console.log("done >> " , result);
//            debugger;
//        });
//
//        return;


        res.render('hive/index.html', {
            path: app.getAppPath()
        });

    });


    win.express.post('/hive/profile_img/set', (req, res, next) => {

        const check_if_valid = function () {
            return (req.body.hasOwnProperty("id") && req.body.id > -1) &&
                    (req.body.hasOwnProperty("gender") && !req.body.gender) &&
                    (req.files.hasOwnProperty("profile_img") && req.files.profile_img.size > -1) &&
                    (req.files.hasOwnProperty("profile_img") && req.files.profile_img.size > -1);
        }

        if (!check_if_valid)
        {
            var err = new Error("Invalid request");
            err.status = 507;
            return next(err);
        }

        const image_selected = req.files.profile_img;
        const acceptable_image_file = ["image/png", "image/jpg", "image/jpeg"];
        const is_image = acceptable_image_file.indexOf(image_selected.mimetype) > -1;

        if (!is_image)
        {
            var err = new Error("The file selected is not valid image");
            err.status = 508;
            return next(err);
        }

        const base64_value = Buffer.from(image_selected.data).toString("base64");
        const base64 = `data:${image_selected.mimetype};base64,${base64_value}`;

        const current = moment_tz().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");

        const update = database("summit_member")
                .where('sum_mem_id', req.body.id)
                .update({
                        mem_pic: base64,
                        gender: req.body.gender,
                        update_image_since : current
                    });

        update.then(function () {
            res.end(`${req.body.id}, successfully updated `);
        });

        update.catch(function (reason) {
            var err = new Error(reason);
            err.status = 508;
            return next(err);
        })


    });


    win.express.get('/hive/set_profile_image', (req, res) => {
        res.render('hive/hive_set_profile_image.html', {
            path: app.getAppPath()
        });
    });
	
	 win.express.post('/hive/update/temporary', (req, res) => {
       
		const data = req.body.value;
		const current = moment_tz().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");
		
		const update = database("summit_member")
             .whereIn('sum_mem_id', data)
             .update({"print_temporary_since": current});
		
		update.then(function(respond) {
			console.log(data);
			res.end(`${data}, successfully updated `);
		});
		
    });
	
	
	win.express.post('/hive/update/official', (req, res) => {
       
		const data = req.body.value;
		const current = moment_tz().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");
		
		const update = database("summit_member")
             .whereIn('sum_mem_id', data)
             .update({"print_official_since": current});
		
		update.then(function(respond) {
			res.end(`${data}, successfully updated `);
		});
		
    });
	
	win.express.post("/hive/get_image", (req, res, next) => {
		
		if(!req.body.hasOwnProperty("db_id"))
		{
			var err = new Error("Field for id is not found");
            err.status = 101;
            return next(err);
		}
		
		const id = req.body.db_id;
		
		const query = database.select(
			{db_id: "summit_member.sum_mem_id"},
			{db_mem_pic: "summit_member.mem_pic"}
		);
		
		query.from('summit_member');
		query.where('summit_member.sum_mem_id', String(req.body.db_id));
		query.limit(1)
		
		query.then(function(respond) {
			
			res.json(respond);
			
		});		
		
		
	});

    win.express.post('/hive/summit_members', (req, res, next) => {

        const pageIndex = req.body.pageIndex || 0;
        let pageSize = req.body.pageSize || 10;

        let of_test = database.select(
                {db_id: "summit_member.sum_mem_id"},
                {db_lname: "summit_member.mem_lname"},
				{db_gender: "summit_member.gender"},
                {db_fname: "summit_member.mem_fname"},
                {db_mname: "summit_member.mem_mname"},
                {db_id: "summit_member.sum_mem_id"},
                {db_position: "summit_position.position_name"},
                {db_suffix: "summit_member.mem_suffix"},
                {db_address: "summit_member.address"},
                {db_contact: "summit_member.contact"},
                {db_qr_code: "summit_member.mem_code"},
                {db_dbo: database.raw("DATE_FORMAT(`dob`, '%m/%d/%Y')")},
                {db_voter_name: "vw_voter_pop_merge.voter_name"},
                {db_barangay: "vw_voter_pop_merge.barangay"},
                {db_prec_no: "vw_voter_pop_merge.prec_no"},
                {db_mun_city: "vw_voter_pop_merge.mun_city"},
				{db_last_official_printed: "summit_member.print_official_since"},
				{db_last_temporary_printed: "summit_member.print_temporary_since"},
				{db_updated_image_since: "summit_member.update_image_since"},
				{db_image_pic_length : database.raw("length(mem_pic)")}
        )
                .from('summit_member')
                .leftJoin(
                        'summit_position',
                        'summit_member.mem_position',
                        'summit_position.summit_pos_id'
                        )
                .leftJoin(
                        'vw_voter_pop_merge',
                        'summit_member.mem_id',
                        'vw_voter_pop_merge.voter_id'
                        )
                .orderBy('summit_member.sum_mem_id', 'desc')

        const of_body_data = Object
                .entries(req.body)
                .reduce((a, [k, v]) => (v ? (a[k] = v, a) : a), {});

        //-----------FILTER---------------

        if (of_body_data.hasOwnProperty("db_voter_name")) {

            of_test
                    .where('vw_voter_pop_merge.voter_name', 'like', `%${of_body_data.db_voter_name}%`);

        }


        if (of_body_data.hasOwnProperty("db_prec_no")) {

            of_test
                    .where('vw_voter_pop_merge.prec_no', 'like', `%${of_body_data.db_prec_no}%`);

        }


        if (of_body_data.hasOwnProperty("db_barangay")) {

            of_test.where('vw_voter_pop_merge.barangay', of_body_data.db_barangay);

        }


        if (of_body_data.hasOwnProperty("db_contact")) {

            of_test.where('summit_member.contact', 'like', `%${of_body_data.db_contact}%`);

        }


        if (of_body_data.hasOwnProperty("db_position")) {

            of_test.where('summit_position.position_name', of_body_data.db_position);

        }
		
		if (of_body_data.hasOwnProperty("last_pol")) {
			
            if (of_body_data.last_pol == 1)
            {

                 of_test.where(function() {

                    this
                        .whereNull('summit_member.print_official_since')
                        .orWhere('summit_member.print_official_since', '0000-00-00 00:00:00')
                        .orWhere('summit_member.print_official_since', '');

                });

            }

            else
            {

                of_test.where(function() {

                    this
                        .whereNotNull('summit_member.print_official_since')
                        .whereNot({'summit_member.print_official_since' : "0000-00-00 00:00:00"})
                        .whereNot('summit_member.print_official_since', '');

                });

            }

        }



		
		if (of_body_data.hasOwnProperty("last_ptl")) {
			
            if (of_body_data.last_ptl == 1)
            {

                of_test.where(function() {

                    this
                        .whereNull('summit_member.print_temporary_since')
                        .orWhere('summit_member.print_temporary_since', '0000-00-00 00:00:00')
                        .orWhere('summit_member.print_temporary_since', '');

                });

            }
            else
            {

                of_test.where(function() {

                    this
                        .whereNotNull('summit_member.print_temporary_since')
                        .whereNot('summit_member.print_temporary_since', '0000-00-00 00:00:00')
                        .whereNot('summit_member.print_temporary_since', '');

                });

            }

        }
		
		

        if (of_body_data.hasOwnProperty("profile_set")) {

            if (of_body_data.profile_set == 1)
                of_test.whereNull('summit_member.mem_pic');
            else
                of_test.whereNotNull('summit_member.mem_pic');

        }


        if (of_body_data.hasOwnProperty("page_limit") && of_body_data.page_limit > 0) {

            pageSize = of_body_data.page_limit;

        }

        //---------END OF FILTER --------------


        const pageOffset = (pageIndex - 1) * pageSize;

        const all_data_query = of_test.clone();
        all_data_query.count({items_count: 'sum_mem_id'});

        all_data_query.then(function(respond) {

            const of_query = of_test.limit(pageSize).offset(pageOffset);
            console.log(of_query.toString());

            of_query.then(function (result) {

                res.json({
                    data: result,
                    itemsCount: respond[0].items_count
                });

            });

            of_query.catch(function (result) {
                var err = new Error(result);
                err.status = 505;
                return next(err);
            });


        });


    });

    win.express.post('/hive/misc', (req, res, next) => {

        const barangays = database
                .select({db_name: "brgyDesc"})
                .from('refbrgy')
                .where('citymunCode', DIGOS_MUN_CODE)
                .orderBy('brgyDesc');

        const positions = database
                .select(
                        {db_id: "summit_pos_id"},
                        {db_name: "position_name"}
                )
                .from('summit_position')
                .orderBy('summit_pos_id');

        barangays.then(function (brgy_result) {

            positions.then(function (position_result) {

                return res.json({
                    "list_brgy": brgy_result,
                    "lis_post": position_result
                })

            });

        });

        barangays.catch(function (reason) {
            var err = new Error(reason);
            err.status = 506;
            return next(err);
        });

    });

}


const init = function (win) {

    win.loadURL(`http://localhost:${pjson.server.port}/hive`);

}
