import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export const validateDto = <T>(DtoClass: ClassConstructor<T>) => {
  return async (req, res, next) => {
    const dto = plainToInstance(DtoClass, req.body, {
      enableImplicitConversion: false, // false to prevent type coercion and for trim() to work
    });

    //protection against whitelisting
    const errors = await validate(dto as object, {
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