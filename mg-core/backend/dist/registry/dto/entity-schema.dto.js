"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryImpactLevel = exports.RegistryAttributeType = void 0;
var RegistryAttributeType;
(function (RegistryAttributeType) {
    RegistryAttributeType["STRING"] = "STRING";
    RegistryAttributeType["INTEGER"] = "INTEGER";
    RegistryAttributeType["DECIMAL"] = "DECIMAL";
    RegistryAttributeType["BOOLEAN"] = "BOOLEAN";
    RegistryAttributeType["DATE"] = "DATE";
    RegistryAttributeType["DATETIME"] = "DATETIME";
    RegistryAttributeType["ENUM"] = "ENUM";
    RegistryAttributeType["JSON"] = "JSON";
})(RegistryAttributeType || (exports.RegistryAttributeType = RegistryAttributeType = {}));
var RegistryImpactLevel;
(function (RegistryImpactLevel) {
    RegistryImpactLevel["BLOCKING"] = "BLOCKING";
    RegistryImpactLevel["WARNING"] = "WARNING";
    RegistryImpactLevel["INFO"] = "INFO";
    RegistryImpactLevel["NONE"] = "NONE";
})(RegistryImpactLevel || (exports.RegistryImpactLevel = RegistryImpactLevel = {}));
