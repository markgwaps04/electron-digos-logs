var pjson = require('../../package.json');
const electron = require("electron");
const app = electron.app;
const moment = require('moment')
const moment_tz = require('moment-timezone');
const dotenv = require('dotenv').config();
const process = require("process");
const env = process.env;
const axios = require('axios');
const form_data = require("form-data");

const database = require('knex')({
    client: 'mysql2',
    acquireConnectionTimeout: 5000,
    connection: {
        host: env.DB_HOST_LIVE,
        user: env.DB_USER_LIVE,
        password: env.DB_PASSWORD_LIVE,
        database: env.DB_DATABASE_LIVE
    },
    debug: false
});


const DIGOS_MUN_CODE = "112403";

exports.database = database;


exports.sms_send = function(to_number, message) {

    const response = axios({
        method : "GET",
        responseType: 'json',
        headers: { 'Content-Type': 'application/json' },
        url : "",
        data : {
            "message-type" : "sms.automatic",
            "message" : message,
            "to" : to_number
        }
    });

    response.catch(function (error){
        var err = new Error(`${error.response.status}, ${error.message} `);
        err.status = error.response.status;
    });

}


exports.pages = function (menu_template, win) {

    menu_template.submenu = menu_template.submenu || [];
    menu_template.submenu.push({
        label: "Hive",
        click: function () {
            init(win)
        }
    });

    win.express.get('/hive/sms', async function (req, res) {

        // const test = await database_sms("group").select("*");
        // console.log(test);

        res.render('hive/sms.html', {
            path: app.getAppPath(),
            sidebar: "sms",
            page_title: "HIVE",
            date : moment().format("YYYY-MM-DD")
        });

    });

    win.express.get('/hive', (req, res) => {

        res.render('hive/index.html', {
            path: app.getAppPath(),
            sidebar: "hive",
            page_title: "HIVE"
        });

    });


    win.express.post('/hive/view/members_info', async (req, res, next) => {

        const data = req.body.id;

        const query = await database
            .select({
                "hds_id": "hugpong_member.hds_mem_id",
                // "mem_img_id" : "mem_img.hds_img_id",
                // "mem_pic": "hugpong_member.hds_mem_id",
                "gender": "hugpong_member.gender",
                "db_dbo": database.raw("DATE_FORMAT(`hugpong_member`.`dob`, '%m/%d/%Y')"),
                "db_dbo_alias": "hugpong_member.dob",
                "db_dbo_alias1": database.raw("DATE_FORMAT(`hugpong_member`.`dob`, '%Y-%m-%d')"),
                "voter_name": "vw_voter_pop_merge.voter_name",
                "mun_city": "vw_voter_pop_merge.mun_city",
                "barangay": "vw_voter_pop_merge.barangay",
                "address": "hugpong_member.address",
                "contact": "hugpong_member.contact",
                "voter_id": "vw_voter_pop_merge.voter_id",
                "prec_no": "vw_voter_pop_merge.prec_no",
                "img_file": "hugpong_member.filename",
                "print_official_since": "hugpong_member.print_official_since",
                "print_temporary_since": "hugpong_member.print_temporary_since"
            })
            .from("hugpong_member")
            .leftJoin(
                'vw_voter_pop_merge',
                'hugpong_member.mem_id',
                'vw_voter_pop_merge.voter_id'
            )
            .where("hugpong_member.hds_mem_id", data)
            .limit(1);

        const details = query[0];

        res.render('include/modal_update_info.html', details);


    });


    win.express.post('/hive/profile_img/set', async (req, res, next) => {

        const current = moment_tz().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");

        if (!(req.body.hasOwnProperty("hds_id") && req.body.hds_id > -1)) {
            const err = new Error("No sumit id parameter");
            err.status = 507;
            return next(err);
        }


        if (!(req.body.hasOwnProperty("gender") && req.body.gender)) {
            const err = new Error("No gender parameter");
            err.status = 507;
            return next(err);
        }

        if (!(req.body.hasOwnProperty("birthday") && req.body.birthday)) {
            const err = new Error("No birthday parameter");
            err.status = 507;
            return next(err);
        }

        if (req.hasOwnProperty("files") && req.files) {

            if (!req.files.hasOwnProperty("image")) {
                const err = new Error("File image property not exists");
                err.status = 508;
                return next(err);
            }

            if (req.files.image.size <= -1) {
                const err = new Error("Invalid file size");
                err.status = 508;
                return next(err);
            }

            const acceptable_image_file = ["image/png", "image/jpg", "image/jpeg"];
            const is_image = acceptable_image_file.indexOf(req.files.image.mimetype) > -1;

            if (!is_image) {
                const err = new Error("Invalid file type");
                err.status = 508;
                return next(err);
            }

            //const image_selected =   .image;

            const uploaded_base64_value = Buffer
                .from(image_selected.data)
                .toString("base64");

            const data_base64 = `data:${image_selected.mimetype};base64,${uploaded_base64_value}`;

            if (req.body.hasOwnProperty("mem_img_id") && req.body.mem_img_id > 0) {

                const image_update = await database({'mem_img': "mem_img-x"})
                    .where('hds_img_id', req.body.mem_img_id)
                    .update({img: data_base64});

            } else {

                const uri = [
                    env.SITE_LIVE_URL,
                    'rest/uploadImg/'
                ].join("");

                const form = new form_data();
                form.append("image", )

                const response = axios({
                    method : "POST",
                    responseType: 'json',
                    headers: { 'Content-Type': 'application/json' },
                    url : uri,
                    data : {}
                });

                return;

                const image_insert = await database("mem_img-x")
                    .insert({
                        img: data_base64,
                        hds_mem_id: req.body.hds_id,
                        last_update: current
                    });

            }


        }

        const birthday = moment(req.body.birthday)
            .format("YYYY-MM-DD")
            .toString();

        return;

        const of_update = await database("hugpong_member")
            .where('hds_mem_id', req.body.hds_id)
            .update({
                gender: req.body.gender,
                update_image_since: current,
                dob : birthday,
                has_img: true
            });


        return res.end(`${req.body.hds_id}, successfully updated `);

    });


    win.express.get('/hive/set_profile_image', (req, res) => {
        res.render('hive/hive_set_profile_image.html', {
            path: app.getAppPath(),
            sidebar: "set_profile_image",
            page_title: "HIVE"
        });
    });

    win.express.post('/hive/update/temporary', (req, res) => {

        const data = req.body.value;
        const current = moment_tz().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");

        const update = database("hugpong_member")
            .whereIn('hds_mem_id', data)
            .update({"print_temporary_since": current});

        update.then(function (respond) {
            res.end(`${data}, successfully updated `);
        });

    });


    win.express.post('/hive/update/official', (req, res) => {

        const data = req.body.value;
        const current = moment_tz().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");

        const update = database("hugpong_member")
            .whereIn('hds_mem_id', data)
            .update({"print_official_since": current});

        update.then(function (respond) {
            res.end(`${data}, successfully updated `);
        });

    });

    win.express.post("/hive/get_image", async (req, res, next) => {

        if (!req.body.hasOwnProperty("db_hds_id")) {
            var err = new Error("Field for id is not found");
            err.status = 101;
            return next(err);
        }

        const id = req.body.db_id;

        const query = database.select({db_img_new: "hugpong_member.filename"});

        query.from("hugpong_member");
        query.where({'hugpong_member.hds_mem_id': String(req.body.db_hds_id)});
        query.limit(1);

        const old_base = await query;
        const has_result = Array.from(old_base).length;

        if (has_result > 0) {

            const image_file = old_base[0]['db_img_new'];

            const uri = [
                env.SITE_LIVE_URL,
                'rest/getImage/',
                image_file
            ].join("");

            const response = axios({
                method : "POST",
                responseType: 'json',
                headers: { 'Content-Type': 'application/json' },
                url : uri
            });

            response.then(function (response) {
                const details = response.data.data;

                if(!details.hasOwnProperty(image_file))
                {
                    var err = new Error(`No image found!`);
                    err.status = 509;
                    return next(err);
                }

                const ofBuffer = Buffer.from(details[image_file]);
                old_base[0].db_mem_pic = ofBuffer;
                old_base[0].is_img_base64 = true;
                return res.json(old_base);
            });

            response.catch(function (error){
                var err = new Error(`${error.response.status}, ${error.message} `);
                err.status = error.response.status;
                return next(err);
            });

            return;

        }

        var err = new Error("Error could not found image");
        err.status = 101;
        return next(err);


    });

    win.express.post("/hive/get_images", async function (req, res, next) {

        if (!req.body.hasOwnProperty("value")) {
            var err = new Error("No value specified");
            err.status = 101;
            return next(err);
        }

        const uri = [
            env.SITE_LIVE_URL,
            'rest/getImage'
        ].join("");

        const response = axios({
            method : "POST",
            responseType: 'json',
            headers: { 'Content-Type': 'application/json' },
            url : uri,
            data : { value : req.body.value }
        });

        response.then(function (response) {
            const details = response.data;
            return res.json(details);
        });

        response.catch(function (error){
            var err = new Error(`${error.response.status}, ${error.message} `);
            err.status = error.response.status;
            return next(err);
        });

    });

    win.express.post('/hive/summit_members', (req, res, next) => {

        const pageIndex = req.body.pageIndex || 0;
        let pageSize = req.body.pageSize || 10;

        let of_test = database.select(
            {db_id: "hugpong_member.hds_mem_id"},
            {db_lname: "hugpong_member.mem_lname"},
            {db_gender: "hugpong_member.gender"},
            {db_fname: "hugpong_member.mem_fname"},
            {db_mname: "hugpong_member.mem_mname"},
            {db_position: "summit_member.summit_pos"},
            {db_suffix: "hugpong_member.mem_suffix"},
            {db_address: "hugpong_member.address"},
            {db_contact: "hugpong_member.contact"},
            {db_qr_code: "hugpong_member.mem_code"},
            {db_img_file_name: "hugpong_member.filename"},
            {db_has_image: "hugpong_member.has_img"},
            {db_dbo: database.raw("DATE_FORMAT(`hugpong_member`.`dob`, '%m/%d/%Y')")},
            {db_dbo_alias: "hugpong_member.dob"},
            {db_voter_name: "vw_voter_pop_merge.voter_name"},
            {db_barangay: "vw_voter_pop_merge.barangay"},
            {db_prec_no: "vw_voter_pop_merge.prec_no"},
            {db_mun_city: "vw_voter_pop_merge.mun_city"},
            {db_last_official_printed: "hugpong_member.print_official_since"},
            {db_last_temporary_printed: "hugpong_member.print_temporary_since"},
            {db_updated_image_since: "hugpong_member.update_image_since"}
        )
            .from('hugpong_member')
            .leftJoin(
                'summit_member',
                'hugpong_member.hds_mem_id',
                'summit_member.sum_mem_id'
            )
            .leftJoin(
                'vw_voter_pop_merge',
                'hugpong_member.mem_id',
                'vw_voter_pop_merge.voter_id'
            )
            .orderBy('hugpong_member.hds_mem_id', 'desc')

        const of_body_data = Object
            .entries(req.body)
            .reduce((a, [k, v]) => (v ? (a[k] = v, a) : a), {});

        //-----------FILTER---------------

        if (of_body_data.hasOwnProperty("db_voter_name")) {

            of_test
                .where('vw_voter_pop_merge.voter_name', 'like', `%${of_body_data.db_voter_name}%`);

        }

        if (of_body_data.hasOwnProperty("birthday_range")) {

            const of_splited = String(of_body_data.birthday_range).split("-");
            const mapped = of_splited.map(e => String(e).trim());

            if (mapped.length >= 2) {
                const start = moment(mapped[0], 'MM/DD/YYYY').format('YYYY-MM-DD');
                const end = moment(mapped[1], 'MM/DD/YYYY').format('YYYY-MM-DD');
                const year = moment().format('YYYY');

                of_test.whereRaw(`DATE_FORMAT(hugpong_member.dob,?) BETWEEN ? AND ?`, [
                    String(year.toString()) + '-%m-%d',
                    start.toString(),
                    end.toString()
                ])

            }

        }


        if (of_body_data.hasOwnProperty("db_prec_no")) {

            of_test
                .where('vw_voter_pop_merge.prec_no', 'like', `%${of_body_data.db_prec_no}%`);

        }


        if (of_body_data.hasOwnProperty("db_barangay")) {

            of_test.where('vw_voter_pop_merge.barangay', of_body_data.db_barangay);

        }


        if (of_body_data.hasOwnProperty("db_contact")) {

            of_test.where('hugpong_member.contact', 'like', `%${of_body_data.db_contact}%`);

        }


        if (of_body_data.hasOwnProperty("db_position")) {

            of_test.where('summit_member.summit_pos', of_body_data.db_position);

        }

        if (of_body_data.hasOwnProperty("last_pol")) {
            if (of_body_data.last_pol == 1) {
                of_test.where(function () {

                    this
                        .whereNull('hugpong_member.print_official_since')
                        .orWhere('hugpong_member.print_official_since', '0000-00-00 00:00:00')
                        .orWhere('hugpong_member.print_official_since', '');

                });

            } else {

                of_test.where(function () {

                    this
                        .whereNotNull('hugpong_member.print_official_since')
                        .whereNot({'hugpong_member.print_official_since': "0000-00-00 00:00:00"})
                        .whereNot('hugpong_member.print_official_since', '');

                });

            }

        }


        if (of_body_data.hasOwnProperty("last_ptl")) {

            if (of_body_data.last_ptl == 1) {

                of_test.where(function () {

                    this
                        .whereNull('hugpong_member.print_temporary_since')
                        .orWhere('hugpong_member.print_temporary_since', '0000-00-00 00:00:00')
                        .orWhere('hugpong_member.print_temporary_since', '');

                });

            } else {

                of_test.where(function () {

                    this
                        .whereNotNull('hugpong_member.print_temporary_since')
                        .whereNot('hugpong_member.print_temporary_since', '0000-00-00 00:00:00')
                        .whereNot('hugpong_member.print_temporary_since', '');

                });

            }

        }


        if (of_body_data.hasOwnProperty("profile_set")) {

            // of_test.leftJoin(
            //     {'mem_img' : "mem_img-x"},
            //     'hugpong_member.hds_mem_id',
            //     'mem_img.hds_mem_id'
            // );
            //
            // of_test.select(
            //     {db_img_id: "mem_img.hds_img_id"},
            //     {db_image_pic_length: database.raw("length(mem_img.img)")},
            //     {db_live_img : "hugpong_member.filename"}
            //  );


            if (of_body_data.profile_set == 1) {
                of_test.whereNull('hugpong_member.filename');
               // of_test.where('hugpong_member.has_img', false);
            } else {
                //of_test.where('hugpong_member.has_img', true);
                of_test.whereNotNull('hugpong_member.filename');
            }

        }


        if (of_body_data.hasOwnProperty("page_limit") && of_body_data.page_limit > 0) {

            pageSize = of_body_data.page_limit;

        }

        //---------END OF FILTER --------------


        const pageOffset = (pageIndex - 1) * pageSize;

        let all_data_query = of_test.clone();

        all_data_query = database
            .count({items_count: 1})
            .from({'that_table': all_data_query});

        all_data_query.then(function (respond) {

            const of_query = of_test.limit(pageSize).offset(pageOffset);

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
                });

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

    win.loadURL(`http://localhost:${env.LOCAL_PORT}/hive`);

}
