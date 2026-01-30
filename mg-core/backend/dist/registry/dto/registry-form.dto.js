"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormMode = exports.FormWidgetType = void 0;
var FormWidgetType;
(function (FormWidgetType) {
    FormWidgetType["INPUT_TEXT"] = "INPUT_TEXT";
    FormWidgetType["INPUT_NUMBER"] = "INPUT_NUMBER";
    FormWidgetType["INPUT_DATE"] = "INPUT_DATE";
    FormWidgetType["INPUT_BOOLEAN"] = "INPUT_BOOLEAN";
    FormWidgetType["INPUT_SELECT"] = "INPUT_SELECT";
    FormWidgetType["INPUT_REFERENCE"] = "INPUT_REFERENCE";
    FormWidgetType["INPUT_DOCUMENT"] = "INPUT_DOCUMENT";
    FormWidgetType["STATIC_TEXT"] = "STATIC_TEXT";
    FormWidgetType["HIDDEN"] = "HIDDEN"; // Should generally be pruned, but if needed for logic
})(FormWidgetType || (exports.FormWidgetType = FormWidgetType = {}));
var FormMode;
(function (FormMode) {
    FormMode["CREATE"] = "CREATE";
    FormMode["EDIT"] = "EDIT";
    FormMode["VIEW"] = "VIEW";
})(FormMode || (exports.FormMode = FormMode = {}));
