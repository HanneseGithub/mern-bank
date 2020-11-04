const Joi = require('joi');

const registerValidation = (data) => {
  const validationSchema = Joi.object({
    firstname: Joi.string()
    .min(2)
    .required(),
    lastname: Joi.string()
    .min(2)
    .required(),
    password: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
    .min(6),
    email: Joi.string()
    .min(6)
    .required()
    .email(),
  })

  return validationSchema.validate(data);
}

const loginValidation = (data) => {
  const validationSchema = Joi.object({
    email: Joi.string()
    .min(6)
    .required()
    .email(),
    password: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
    .min(6),
  })

  return validationSchema.validate(data);
}

const transferValidation = (data) => {
  const validationSchema = Joi.object({
    accountFrom: Joi.string()
    .length(15)
    .required(),
    accountTo: Joi.string()
    .min(6)
    .required(),
    amount: Joi.number()
    .min(0)
    .required(),
    explanation: Joi.string()
    .required()
  })

  return validationSchema.validate(data);
}

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.transferValidation = transferValidation;
