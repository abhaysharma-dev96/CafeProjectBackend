import { validationResult } from 'express-validator';

// Runs after express-validator checks; if any failed, returns a clean error message
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};
