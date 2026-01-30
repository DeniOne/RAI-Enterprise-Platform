"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDto = validateDto;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
function validateDto(dtoClass) {
    return async (req, res, next) => {
        const dtoObj = (0, class_transformer_1.plainToInstance)(dtoClass, req.body);
        const errors = await (0, class_validator_1.validate)(dtoObj);
        if (errors.length > 0) {
            const formattedErrors = errors.map(error => ({
                property: error.property,
                constraints: error.constraints
            }));
            res.status(400).json({ errors: formattedErrors });
            return; // Explicitly return to satisfy void return type
        }
        req.body = dtoObj;
        next();
    };
}
