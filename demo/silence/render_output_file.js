var template = function() {
    this.base();
};

template.prototype = {

};

$.inherit(template, BaseTemplate);

module.exports = template;