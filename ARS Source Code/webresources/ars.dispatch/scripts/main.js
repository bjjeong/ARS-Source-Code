/*global $, window */

$(function() {
    "use strict";

    // demo only
    $('.fc-axis')
        .on('click', function(){
            $('.fc-axis').removeClass('selected');
            $(this).toggleClass('selected');
        });

    $("body").layout({
        applyDefaultStyles: true,
        north__resizable: false,
        north__showOverflowOnHover: true,
        south__applyDefaultStyles: false,
        north__applyDefaultStyles: false,
        east__size: $(window).width() * (1/3)
    });
});
