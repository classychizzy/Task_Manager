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
      console.log(`validating DTO: ${DtoClass.name}`);
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
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