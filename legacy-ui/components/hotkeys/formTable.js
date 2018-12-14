import { Template } from 'meteor/templating';


Template.hotkeysFormTable.helpers({
    getLabel(input) {
        let result = input.label;
        if (input.key.indexOf('WLPreset') === 0) {
            const presetIndex = parseInt(input.key.replace('WLPreset', ''));
            const preset = OHIF.viewer.wlPresets[presetIndex];
            if (preset.id) {
                result += ` (${preset.id})`;
            }
        }

        return result;
    }
});
