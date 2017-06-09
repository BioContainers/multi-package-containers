import $ from 'jquery';

window.$ = window.jQuery = $;

$.fn.extend({
    animateCss: function(animationName) {
        const animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        this.addClass('animated ' + animationName).one(animationEnd, function() {
            $(this).removeClass('animated ' + animationName);
        });
    }
});

// Stylesheets
require('bootstrap-sass/assets/stylesheets/_bootstrap.scss');
require('./sass/libs/material-dashboard.scss');
require('./sass/libs/animate.scss');
require('./sass/base.scss');

require('arrive');
// require('bootstrap');
require('bootstrap-material-design');
// require('./libs/material-dashboard');
require('./libs/jquery.datatables');

require('./app/initialize');
