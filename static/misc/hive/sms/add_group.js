const parsely = require('parsleyjs');

(function(jq) {

    $("#example-basic").steps({
        headerTag: "h3",
        bodyTag: "section",
        autoFocus: true,
        onStepChanging : function (event, currentIndex, newIndex) {

            const SECOND_PAGE = 1;
            const FIRST_PAGE = 0;

            if(newIndex === SECOND_PAGE && currentIndex === FIRST_PAGE)
            {
                const form_group_description = jQuery("#group_description");
                var instance = parsely.Factory(form_group_description);
                return instance.isValid();
            }

            return true;
        }
    });

})(jQuery)