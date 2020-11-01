const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { loginValidation } = require('./validations/validations');

const User = require("../models/User");
const Session = require("../models/Session");

// Login -> path : /sessions
router.post('/', async (req, res) => {

  // Validate user's request parameters
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).json({ "error": error.details[0].message });
  }

  // Check if inserted email exists
  const logInUser = await User.findOne({
    'email': req.body.email
  });
  if (!logInUser) {
    return res.status(401).json({ "error": "This email is invalid!"});
  }

  // Check if password is correct. Bcrypt compares the inserted password against user's hashed password that bcrypt can only decrypt, and tells if it matches.
  const passwordValidation = await bcrypt.compare(req.body.password, logInUser.password);

  if (!passwordValidation) {
    return res.status(401).json({"error" : "This password is invalid!"});
  }

  // Create and assign a jwt token.
  // The first parameter will be the payload (data that you want to store/keep in the token), second one the secret key. Right now we are keeping user id in the token after logging in.
  const token = jwt.sign({ _id: logInUser._id, firstname: logInUser.firstname }, process.env.TOKEN_SECRET)

  // Create a session log
  const sessionLog = new Session({
    authToken: token
  });

  try {
    const newSession = await sessionLog.save()
  } catch(err) {
    if (err) {
      res.status(500).json({ "error": "Could not create a session log" });
    }
  }

  // Save session as a cookie
  res.cookie('authorization', token, {
    httpOnly: true
    // sameSite: 'none',
    // secure: true
  });
  res.status(200).json({
    "message": 'You have successfully logged in!'
  })

});

module.exports = router;