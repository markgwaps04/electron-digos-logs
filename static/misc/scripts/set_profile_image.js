const path = require("path");
const misc = require("electron-dir-solved-ict-portal");
const blackTheme = require(path.join
	(
		misc.parent_dir,
		"/static/plugins/tui-image-editor/black-theme.js"
	)
);



const { generate_id_front } = require(path.join
	(
		misc.parent_dir,
		"/static/misc/scripts/hive_global.js"
	)
);


function delay(callback, ms) {
	var timer = 0;
	return function() {
		var context = this, args = arguments;
		clearTimeout(timer);
		timer = setTimeout(function() {
			callback.apply(context, args);
		}, ms || 0
		);
	};
}


(function(jq) {
	
	const main_table = $("#jsGrid")

	var originalFilterTemplate = jsGrid.fields.text.prototype.filterTemplate;
	jsGrid.fields.text.prototype.filterTemplate = function() {

		var grid = this._grid;
		var $result = originalFilterTemplate.call(this);

		$result.on("keyup", delay
			(function(e) {
				grid.search();
			}, 500
			)
		);

		return $result;

	}

	const on_submit_view_id = function(items, param_form) {

		const that_form = param_form.serialize_form();

		if (!that_form.hasOwnProperty("gender") && !that_form.gender)
			return alert('Please select gender');

		const form = document.getElementById("view_id_form");
		const form_data = new FormData(form);

		form_data.append("id", items.db_id);

		const misc = jq.ajax({
			url: "/hive/profile_img/set",
			contentType: false,
			processData: false,
			cache: false,
			method: "POST",
			data: form_data
		});

		misc.then(function() {
			alert('Update Successfully!!');
			main_table.jsGrid("loadData");
		});

		misc.error(function() {
			alert('Error occured!!!');
			debugger;
		});


	}

	jQuery("#profile_img").on("change", async function() {
		const index = this.files[0];
		var reader = new FileReader();
		reader.onload = function() {
			const arrayBuffer = this.result;
			const base64value = Buffer.from(arrayBuffer).toString("base64");
			const of_obj = { data: base64value, mimitype: index.type }
			view_id(of_obj);
		}
		reader.readAsArrayBuffer(index);

		jq("#modal_save").removeAttr("disabled");

	});

	const view_id = function(item, callback = new Function) {

		const params = {
			surname: item.db_lname,
			firstname: item.db_fname,
			middlename: item.db_mname,
			gender: item.db_gender == 0 ? "M" : "F",
			birthdate: item.db_dbo,
			address: item.db_address,
			barangay: item.db_barangay,
			precinct_no: item.db_prec_no,
			qr_code: item.db_qr_code,
			img_pic: item.db_mem_pic
		};

		const front = generate_id_front(params);

		front.then(function(front_data) {
			jQuery("#id_card").attr("src", front_data);
			return callback();
		});

	}


	const on_click_view_id = function(item) {

		jq("#modal_save").attr("disabled", "true");
		document.getElementById('view_id_form').reset();

		view_id(item, function() {
			jQuery("#update_id_modal").modal("show");
		});

		jq("form#view_id_form").off("submit").on("submit", function(e) {
			e.preventDefault();
			return on_submit_view_id(item, jQuery(this));
		})



	}


	const misc = jq.ajax(
		{
			url: "/hive/misc",
			method: "POST"
		}
	);

	misc.then(function(misc_desc) {

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
						items: [{ db_name: "" }].concat(misc_desc.list_brgy),
						width: 100,
						itemTemplate: function(value, item) {
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
						items: [{ db_name: "" }].concat(misc_desc.lis_post),
						width: 100,
						itemTemplate: function(value, item) {
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
							{ name: "" },
							{ name: "NOT SET", value: 1 },
							{ name: "ALREADY SET", value: 2 }
						],
						width: 100,
						itemTemplate: function(value, item) {
							if (!item.db_mem_pic)
								return;
							const badge = jq("<b>");
							badge.addClass("label orange");
							badge.text("ALREADY SET");
							return badge;
						}
					},
					{
						type: "control",
						editButton: false,
						deleteButton: false,
						width: 100,
						itemTemplate: function(value, item) {

							const button = jq("<button>");
							button.addClass("btn btn-success");
							button.text("View");
							button.click(function() {
								on_click_view_id(item);
							});

							return button;

						}
					}
				],

				controller: {
					loadData: function(filter) {

						const load = jq.ajax(
							{
								url: "/hive/summit_members",
								method: "POST",
								data: filter
							}
						);

						return load;

					}
				}

			}
		);

	}
	);



}
)(jQuery)




