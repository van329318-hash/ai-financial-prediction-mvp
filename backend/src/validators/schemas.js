const Joi = require('joi');

const placeBetSchema = Joi.object({
  roundId: Joi.string().required(),
  betType: Joi.string().valid('TAI', 'XIU').required(),
  amount: Joi.number().positive().required()
});

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const validateBet = (data) => placeBetSchema.validate(data);
const validateRegister = (data) => registerSchema.validate(data);
const validateLogin = (data) => loginSchema.validate(data);

module.exports = {
  validateBet,
  validateRegister,
  validateLogin
};
