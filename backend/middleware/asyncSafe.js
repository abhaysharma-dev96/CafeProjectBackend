import express from 'express';

// Express 4 does not catch errors thrown inside async route handlers: a DB hiccup would
// crash the whole server. This wraps every route handler so such errors go to the
// error handler in server.js (which returns a clean 500) instead.
const wrap = (fn) =>
  typeof fn === 'function' && fn.length < 4
    ? function (req, res, next) {
        try {
          const result = fn.call(this, req, res, next);
          if (result && typeof result.catch === 'function') result.catch(next);
        } catch (err) {
          next(err);
        }
      }
    : fn;

['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
  const original = express.Router[method];
  express.Router[method] = function (path, ...handlers) {
    return original.call(this, path, ...handlers.flat().map(wrap));
  };
});
