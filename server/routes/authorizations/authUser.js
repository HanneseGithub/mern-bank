const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');

// We are creating a middleware function, which we can add to any routes that we want to be protected. We can also export it like that.
module.exports = function (req, res, next) {
  // We are saving/checking the requester's auth-token.
  const token = req.cookies.authorization;

  // Deny access for someone not logged in (doesn't have the auth-token).
  if (!token) return res.status(401).send('Access Denied!')

  // If user has an token, we try to verify it. req.user parameter will save the decoded payload (data stored in the token).
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;
    // Call the next middleware, when auth is okay.
    next();
  } catch(err) {
    res.status(400).send('Invalid token.')
  }
}
