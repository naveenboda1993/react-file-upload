const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation Error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

const schemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'admin').default('user')
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required()
  }),

  updateUser: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    email: Joi.string().email().lowercase(),
    role: Joi.string().valid('user', 'admin'),
    isActive: Joi.boolean()
  }).min(1),

  createUser: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'admin').default('user')
  })
};

module.exports = { validateRequest, schemas };