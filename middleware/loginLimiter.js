const rateLimit = require("express-rate-limit");
const { logEvents } = require("./logger");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, //1 min
  max: 5, //limit each ip to 5 login req per window per min
  message: {
    message: "too many login attempts from this ip, plz try after 1 min",
  },
  handler: (req, res, next, options) => {
    logEvents(
      `Too many Request: ${options.message.message}\t${req.method}t${req.url}\t${req.headers.origin}`,
      "errLog.log"
    );
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, //return rate limit info in the ratelimit headers
  legacyHeaders: false, //disable the x-ratelimit headers
});

module.exports = loginLimiter;
