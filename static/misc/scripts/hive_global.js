const qr = require('qr-image');

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

module.exports.text_newline_generator = text_newline_generator;

module.exports.generate_id_front = function (params) {
  const canvas = document.createElement("canvas");
  canvas.width = "1000";
  canvas.height = "600";
  canvas.style.letterSpacing = '2px';
  const context = canvas.getContext('2d');

  const base_image = new Image();
  base_image.src = '/images/front.jpg';

  return new Promise(function (resolve)
  {

      base_image.onload = function () {

        context.drawImage(base_image, 0, 0, base_image.width, base_image.height, // source rectangle
          0, 0, canvas.width, canvas.height);

        var f = new FontFace('OCR A EXTENDED', 'url(/fonts/ocr.ttf)');

        f.load().then(function (font)
        {

            document.fonts.add(font);

            context.font = '700 30px "OCR A EXTENDED"';
            context.fillStyle = "#28166f";
            context.fillText(params.surname, 460, 195);
            context.fillText(params.firstname, 460, 242);
            context.fillText(params.middlename, 460, 286);
            context.fillText(params.gender, 460, 338);
            context.fillText(params.birthdate, 460, 380);
            const of_address = text_newline_generator(params.address, 24);

            if(params.address && String(params.address).length < 15)
            {
              context.fillText(of_address[0], 460, 421);
              context.fillText("-", 460, 470);
            }
            else
            {
              of_address.forEach(function(value, index)
                {
                  context.fillText(value, 313, 450 + (index * 30));
                }
              );
            }


            context.fillText(params.precinct_no, 460, 562)

            if(params.barangay && String(params.barangay).length >= 15)
              context.font = '700 23px "OCR A EXTENDED"';

            context.fillText(params.barangay, 460, 520);


            var qr_img_string = qr.imageSync(params.qr_code,
              {
              type: 'png',
              margin: 2,
              size: 9
              }
            );

            const qr_image = new Image();
            qr_image.src = `data:image/png;base64,${qr_img_string.toString('base64')}`

            qr_image.onload = function () {

              context.drawImage(qr_image, 746, 320);

              const profile_pic = new Image();
              profile_pic.src = `/images/default.png`;

              if (params.hasOwnProperty("img_pic") && params.img_pic) {

                if(params.img_pic.hasOwnProperty("mimitype"))
                {
                    profile_pic.src = `data:${params.img_pic.mimitype};base64,${params.img_pic.data}`;
                }
                else
                {
                     const img_profile = Buffer.from(params.img_pic.data).toString();
                     profile_pic.src = img_profile;
                }
              }

              profile_pic.width = 500;
              profile_pic.width = 500;

              profile_pic.onload = function () {

                context.drawImage(profile_pic, 35, 162, 249, 249);

                return resolve(canvas.toDataURL("image/jpeg"));

              }



            }



          }
        );



      }

    }
  );

}
