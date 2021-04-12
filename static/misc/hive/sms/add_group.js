const parsely = require('parsleyjs');

(function(jq) {

    $("#example-basic").steps({
        headerTag: "h3",
        bodyTag: "section",
        autoFocus: true,
        onStepChanging : function (event, currentIndex, newIndex) {

            const SECOND_PAGE = 1;
            const THIRD_PAGE = 2;
            const FOURTH_PAGE = 3;
            const FIRST_PAGE = 0;
            console.log(newIndex,currentIndex)
            if(newIndex === SECOND_PAGE && currentIndex === FIRST_PAGE)
            {
                const form_group_description = jQuery("#group_description");
                var instance = parsely.Factory(form_group_description);
                instance.validate();
                return instance.isValid();
            }
            if(newIndex === THIRD_PAGE && currentIndex === SECOND_PAGE)
            {
                jQuery("#jsGrid-add-members").jsGrid("loadData");
            }

            return true;
        },
        finish : function()
        {
            alert('Success');
        }
    });

})(jQuery)