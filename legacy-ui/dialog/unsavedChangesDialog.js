import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import _ from 'underscore';


OHIF.ui.unsavedChangesDialog = function(callback, options) {

    // Render the dialog with the given template passing the promise object and callbacks
    const templateData = _.extend({}, options, {
        callback: callback
    });
    Blaze.renderWithData(Template.unsavedChangesDialog, templateData, document.body);

};
