(function () {

    $.fn.phil_iri = {};

    /** To prevent a form submitting again when refresh **/

    String.prototype.setTokens = function (replacePairs, callBack = new Function) {

        let str = this.toString(), key, re;

        for (key in replacePairs) {

            if (!isNaN(key)) key = "\\" + key;

            re = new RegExp("\{" + key + "\}", "gm");
            str = str.replace(re, replacePairs[key]);

            if (typeof callBack !== "function") continue;

            callBack.prototype.constructor({
                current: key,
                isEqual: re,
                value: str
            });


        }
        return str;

    };


    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href)
    }

    String.prototype.capitalize = function () {
        return this.charAt(0).toUpperCase() + String(this.slice(1)).toLowerCase();
    }

    String.prototype.capitalizeAll = function () {
        return this.replace(/(?:^|\s)\S/g,function(a) { return a.toUpperCase() })
    }

    String.prototype.ucwords = function () {
        return this.replace(/(?:^|\s)\S/g, function (a) {
            return a.toUpperCase();
        });
    }

    window.define_const = function (name, value, property = window) {

        Object.defineProperty(property, name, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: false
        });

    };

    window.define_value = function (name, value, property = window) {

        Object.defineProperty(property, name, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });

    };

    define_const("serialize_form", function () {

        const self = this[0];
        const $element = jQuery(this);
        const nodeName = self.nodeName;

        if (nodeName !== "FORM")
            throw new Error("Invalid node");

        if (this.length > 1)
            throw new Error("Invalid length of node");

        const serialize = this.serializeArray();
        const obj = {};

        serialize.forEach(function (value) {
            obj[value.name] = value.value;
        });

        const element_that_has_names = $element.find("[name]").get();

        const that_obj = {};

        element_that_has_names.forEach(function(ele) {
            const that_element = jQuery(ele);
            const has_value_attr = that_element.is("[value]");
            const name_value = that_element.attr("name");
            if(!has_value_attr) return;
            that_obj[name_value] = that_element.attr("value");
        });


        return obj;


    }, $.fn);

    define_const("serialize_to_url", function () {

        const value = this;
        return  Object.keys(value).map(function(key) {
            return key + '=' + value[key];
        }).join('&');

    }, Object)

    if (jQuery.fn.hasOwnProperty("expandable"))
    {
        jQuery('.read_more_toggle').expandable({
         'height': 100
        });
    }


    // Javascript to enable link to tab
    var url = document.location.toString();
    if (url.match('#')) {
        const tab_by_url_element = $('.nav-tabs a[href="#' + url.split('#')[1] + '"]');
        if(tab_by_url_element.length)
            tab_by_url_element.tab('show');
    }

    // Change hash for page-reload
    $('.nav-tabs a').on('shown.bs.tab', function (e) {
        window.location.hash = e.target.hash;
    });

    const card_body_state_hide = function()
    {
        const $target = jQuery(this);
        const $parent = $target.parents(".card");
        const $body = $parent.find(".card-body");
        const $icon = $target.find("i");


        $body.slideUp();
        $icon.removeClass("fa-angle-up");
        $icon.addClass("fa-angle-down");

        jQuery($target).off("click").on("click",function() {
            $body.slideDown();
            $icon.removeClass("fa-angle-down");
            $icon.addClass("fa-angle-up");
            jQuery($target).off("click").on("click",card_body_state_hide);
        });

    }

    jQuery("button.cad_body_state")
        .off("click")
        .on("click",card_body_state_hide);



    window.card_body_state = function()
    {
        console.log(this);
        debugger;
    }



})();


(function(jq)
{

const full_screen_element_off = function(that_element, on = true) {

const element = jq(this === window ? that_element : this);
const parent = element.closest(".modal-lg, .fullscreen-container");
const literal_btn_fullscreen = parent.find("button.btn-fullscreen");

parent.removeClass("fullscreen");
const content = parent.find(".modal-content, fullscreen-content");
content.removeClass("full-height");

if(document.fullscreenElement) document.exitFullscreen();

literal_btn_fullscreen.find("i.fa")
    .removeClass("fa-window-restore")
    .addClass("fa-window-maximize");

literal_btn_fullscreen.find("i.fa").attr("data-original-title","Fullscreen");

if(this && on) element.off("click").on("click", full_screen_element_on);

}


const full_screen_element_on = function(that_element) {

console.warn("Attempting to start full screen");

const element = jq(this === window ? that_element : this);
const parent = element.closest(".modal-lg, .fullscreen-container");
const literal_btn_fullscreen = parent.find("button.btn-fullscreen");

parent.addClass("fullscreen");
const content = parent.find(".modal-content, fullscreen-content");
content.addClass("full-height");

try { parent[0].requestFullscreen();  }catch(err) {  }

literal_btn_fullscreen.find("i.fa")
        .removeClass("fa-window-maximize")
        .addClass("fa-window-restore");

literal_btn_fullscreen.find("i.fa").attr("data-original-title","Close to exit fullscreen");
literal_btn_fullscreen.off("click").on("click", full_screen_element_off);

const close_equivalent = parent.find(".header-action button, .close-fullscreen ");

document.addEventListener("fullscreenchange", function(e) {
    if (document.fullscreenElement) return;
    full_screen_element_off(literal_btn_fullscreen[0], false);
    literal_btn_fullscreen.on("click", full_screen_element_on );
});

close_equivalent
    .not(element)
    .on("click", function() {
        full_screen_element_off(this, false);
        literal_btn_fullscreen.on("click", full_screen_element_on );
    });

};


jq(".btn-fullscreen").on("click", full_screen_element_on );

jq(".btn-close-fullscreen").on("click", function() {
    const element = jq(this);
    const parent = element.closest(".modal-lg, .fullscreen-container");
    parent.removeClass("fullscreen");
    if(document.fullscreenElement) document.exitFullscreen();
});

$.fn.fullscreen = function() {
    return jq(this).on("click", full_screen_element_on);
};

$.fn.restore_fullscreen = function() {

    const element = jq(this);

    if (!document.fullscreenElement)
    {
        element
            .find(".btn-fullscreen")
            .off("click")
            .on("click", full_screen_element_on);
        return;
    }

    const parent = element.closest(".modal-lg, .fullscreen-container");
    const literal_btn_fullscreen = parent.find("button.btn-fullscreen");


    const content = parent.closest(".modal-content, fullscreen-content");
    content.addClass("full-height");

    literal_btn_fullscreen.find("i.fa")
        .removeClass("fa-window-maximize")
        .addClass("fa-window-restore");


    literal_btn_fullscreen.find("i.fa").attr("data-original-title","Close to exit fullscreen");
    literal_btn_fullscreen.off("click").on("click", full_screen_element_off);

    const close_equivalent = parent.find(".header-action button, .close-fullscreen ");

    close_equivalent
        .not(element)
        .off("click")
        .on("click", function() {
            full_screen_element_off(this, false);
            literal_btn_fullscreen.on("click", full_screen_element_on );
        });

}

})(jQuery);



(function(jq) {

    $.fn.zoom_content = function() {

        let zoomArr = [0.5,0.75,0.85,0.9,1,1.2,1.5];
        let indexofArr = 4;
        const $element = jq(this);
        const element = $element[0];
        const $content = $element.find(".fullscreen-content");
        console.log($content);
        const content = $content[0];
        const $btn_zoom_in = $element.find("button.btn-zoom-in");
        const $btn_zoom_out = $element.find("button.btn-zoom-out");
        const $btn_zoom_reset = $element.find("button.btn-zoom-reset");
        let value = element.getBoundingClientRect().width / element.offsetWidth;

        const zoom_in = function()
        {
            if(!(indexofArr < zoomArr.length-1)) return;
            indexofArr += 1;
            value = zoomArr[indexofArr];
            element.style['transform'] = `scale(${value})`;
            $element.addClass("zoom_in_trigger");

        }

        const zoom_out = function()
        {
            if(!(indexofArr > 0)) return;
            indexofArr -= 1;
            value = zoomArr[indexofArr];
            element.style['transform'] = `scale(${value})`
        }

        const zoom_reset = function()
        {
            $element.removeClass("zoom_in_trigger");
            element.style['transform'] = null;
            indexofArr = 4;
            value = zoomArr[indexofArr];
        }

        $btn_zoom_in.on("click", zoom_in);
        $btn_zoom_out.on("click", zoom_out);
        $btn_zoom_reset.on("click", zoom_reset);

    }
    jq(".fullscreen-container").zoom_content();

})(jQuery);



(function(jq) {

jq.cus_alert = function(obj)
{

    const of_default = {
        title : "Alert!",
        body : ""
    };

    obj = typeof(obj) === "object" ? obj : { title : obj };
    obj = Object.assign(of_default, obj);
    obj.title = obj.title || "Alert!";

    const overlay = jq("<div>");
    overlay.addClass("cus-alert overlay is-visible");

    const container = jq("<div>");
    container.addClass("window-message-container type-alert");

    const content = jq("<div>");
    content.addClass("window-message-container__text");

    const title = jq("<h1>");
    title.text(obj.title);

    const description = jq("<p>");
    description.text(obj.body);

    content.append(title);
    if(obj.body.trim()) content.append(description);

    container.append(content);

    const action = jq("<ul>");
    action.addClass("buttons alert");

    const li = jq("<li>");
    const a1 = jq("<a>");
    a1.text("Ok");

    a1.on("click", function() {
        overlay.remove();
    });

    li.append(a1);
    action.append(li);

    container.append(action);

    const close = jq("<a>");
    close.addClass("alert-close img-replace");
    close.text("Close");

    container.append(close);
    overlay.append(container);

    jq("body").append(overlay);

    return overlay;

}


})(jQuery)

