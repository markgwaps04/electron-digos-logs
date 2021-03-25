const qr = require('qr-image');

const text_newline_generator = function (str, max_length) {

    const re = function (that_arr) {

        const target = String(that_arr[max_length]).trim();

        if (!target) {
            that_arr.splice(max_length, 1, "<||>");
            const new_arr = that_arr.join("").split("<||>");
            return new_arr;
        }

        if (max_length <= 0) return [that_arr.join("")];
        max_length = max_length - 1;
        return re(that_arr);

    };

    if (!str || str.length < max_length)
        return [str];

    const arr = String(str).split("");
    return re(arr);

}

module.exports.text_newline_generator = text_newline_generator;

module.exports.generate_id_front = function (params) {
    const canvas = document.createElement("canvas");
    canvas.width = "1000";
    canvas.height = "600";
    canvas.style.letterSpacing = '2px';
    const context = canvas.getContext('2d');

    const base_image = new Image();
    base_image.src = '/images/front.jpg';

    return new Promise(function (resolve) {

            base_image.onload = function () {

                context.drawImage(base_image, 0, 0, base_image.width, base_image.height, // source rectangle
                    0, 0, canvas.width, canvas.height);

                var f = new FontFace('AvrileSans', 'url(/fonts/AvrileSans-ExtraBold.ttf)');

                f.load().then(function (font) {

                        document.fonts.add(font);

                        context.font = '700 30px "AvrileSans"';
                        context.fillStyle = "#28166f";
                        context.fillText(params.surname, 240, 185);
                        context.fillText(params.firstname, 240, 232);
                        context.fillText(params.middlename, 240, 280);
                        context.fillText(params.gender, 240, 326);
                        context.fillText(params.birthdate, 240, 375);

                        let of_address = text_newline_generator(params.address, 24);

                        if (params.address && String(params.address).length < 24) {
                            context.fillText(of_address[0], 240, 417);
                            context.fillText("-", 240, 465);
                        } else {
                            of_address.forEach(function (value, index) {
                                    context.fillText(value, 240, 417 + (index * 30));
                                }
                            );
                        }


                        context.fillText(params.precinct_no, 240, 567)
                        if (!params.barangay && String(params.barangay).length >= 25)
                            context.font = '700 23px "AvrileSans"';

                        context.fillText(params.barangay, 240, 522);

                        if(!params.qr_code)
                        {
                            alert(`Not valid data to proccess at name:  ${params.surname}, ${params.firstname}` );
                            throw new Error("ERROR PROCESSING");
                        }
                        var qr_img_string = qr.imageSync(params.qr_code,
                            {
                                type: 'png',
                                margin: 1,
                                size: 8
                            }
                        );

                        const qr_image = new Image();
                        qr_image.src = `data:image/png;base64,${qr_img_string.toString('base64')}`

                        qr_image.onload = function () {

                            context.drawImage(qr_image, 710, 385);

                            const profile_pic = new Image();
                            profile_pic.src = `/images/default.png`;

                            if (params.hasOwnProperty("img_pic") && params.img_pic) {

                                if (params.img_pic.hasOwnProperty("mimitype")) {
                                    profile_pic.src = `data:${params.img_pic.mimitype};base64,${params.img_pic.data}`;
                                } else {
                                    const img_profile = Buffer.from(params.img_pic.data).toString();
                                    profile_pic.src = img_profile;
                                }
                            }

                            profile_pic.width = 500;
                            profile_pic.width = 500;

                            profile_pic.onload = function () {

                                context.drawImage(profile_pic, 676, 145, 245, 232);

                                return resolve(canvas.toDataURL("image/jpeg"));

                            }


                        }


                    }
                );


            }

        }
    );

}
