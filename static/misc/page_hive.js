const electron = require("electron");
const menu = electron.Menu;
const menuItem = electron.MenuItem;
const url = require("url");
const path = require("path");
const { dialog } = require("electron");
const app = electron.app;


const database = require('knex')({
    client: 'mysql2',
    acquireConnectionTimeout: 1000,
    connection: {
        host: '185.214.124.3',
        user: 'u212447436_hive',
        password: 'Knightf3',
        database: 'u212447436_hivedigos'
    },
    debug : true
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

        res.render('hive/index.html', {
            path: app.getAppPath()
        });

    
    });

    win.express.post('/hive/summit_members', (req, res, next) => {

        const pageIndex = req.body.pageIndex || 0;
        let pageSize = req.body.pageSize || 10;

        let of_test = database.select(
            { db_id: "summit_member.sum_mem_id" },
            { db_lname: "summit_member.mem_lname" },
            { db_fname: "summit_member.mem_fname" },
            { db_mname: "summit_member.mem_mname" },
            { db_id: "summit_member.sum_mem_id" },
            { db_position: "summit_position.position_name" },
            { db_suffix: "summit_member.mem_suffix" }, 

            { db_address: "summit_member.address" },
            { db_contact: "summit_member.contact" },
            { db_qr_code: "summit_member.mem_code" },
            { db_dbo: database.raw("DATE_FORMAT(`dob`, '%m/%d/%Y')") },
            { db_voter_name: "vw_voter_pop_merge.voter_name" },
            { db_barangay: "vw_voter_pop_merge.barangay" },
            { db_prec_no: "vw_voter_pop_merge.prec_no" },
            { db_mun_city: "vw_voter_pop_merge.mun_city" },
            { db_mem_pic: "summit_member.mem_pic" }
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


        if (of_body_data.hasOwnProperty("page_limit") && of_body_data.page_limit > 0) {

            pageSize = of_body_data.page_limit;

        }

        //---------END OF FILTER --------------


        const pageOffset = (pageIndex - 1) * pageSize;

        const of_query = of_test.limit(pageSize).offset(pageOffset);

        console.log(of_query.toString());

        const all_data = database('summit_member').count({ items_count: 'sum_mem_id' });

        of_query.then(function (result) {

            all_data.then(function (of_all_data) {
                
                res.json({ 
                    data: result,
                    itemsCount: of_all_data[0].items_count
                })

            });
        });

        of_query.catch(function (result) {
            var err = new Error(result);
            err.status = 505;
            return next(err);
        });

    });


    win.express.post('/hive/misc', (req, res, next) => {

        const barangays = database
            .select({ db_name: "brgyDesc" })
            .from('refbrgy')
            .where('citymunCode', DIGOS_MUN_CODE)
            .orderBy('brgyDesc');

        const positions = database
            .select(
                { db_id: "summit_pos_id" },
                { db_name: "position_name" }
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

    win.loadURL("http://localhost:1010/hive");

}
