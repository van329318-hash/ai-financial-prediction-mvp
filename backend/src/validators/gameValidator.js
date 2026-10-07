const Joi = require('joi');

const placeBetSchema = Joi.object({
  roundId: Joi.string().required(),
  betType: Joi.string().valid('TAI', 'XIU').required(),
  amount: Joi.number().positive().required()
});

const validateBet = (data) => {
  return placeBetSchema.validate(data);
};

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const validateRegister = (data) => {
  return registerSchema.validate(data);
};

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const validateLogin = (data) => {
  return loginSchema.validate(data);
};

module.exports = {
  validateBet,
  validateRegister,
  validateLogin
};
