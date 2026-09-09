"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const validateDto = (DtoClass) => {
    return async (req, res, next) => {
        const dto = (0, class_transformer_1.plainToInstance)(DtoClass, req.body, {
            enableImplicitConversion: false, // false to prevent type coercion and for trim() to work
        });
        //protection against whitelisting
        const errors = await (0, class_validator_1.validate)(dto, {
            whitelist: true,
            forbidNonWhitelisted: true,
        });
        if (errors.length > 0) {
            const firstError = errors[0]?.constraints
                ? Object.values(errors[0].constraints)[0]
                : "Validation failed";
            console.log(`validating DTO: ${DtoClass.name}`);
            return res.status(400).json({
                status_code: 400,
                success: false,
                message: firstError,
                errors: errors.map((err) => ({
                    field: err.property,
                    constraints: err.constraints,
                })),
            });
        }
        req.body = dto;
        next();
    };
};
exports.validateDto = validateDto;
