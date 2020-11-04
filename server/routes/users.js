const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs');

const verifyUser = require('./authorizations/authUser');

// Import models
const User = require("../models/User");
const Account = require("../models/Account");

// Import validation
const { registerValidation } = require('./validations/validations');

// CREATE AN USER -> path: /users
router.post("/", async (req, res) => {

  // Validate data before creating an user
  const {error} = registerValidation(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // Check if the user is already in the database.
  const emailExists = await User.findOne({
    'email': req.body.email
  });
  if (emailExists) {
    return res.status(409).json({ error: "Email already in use!" });
  }

  // Hash the password
  // The salt is just a randomly generated string, that will be added on top of the password before hashing. The number tells how many loops of hashes it does for generation.
  const salt = await bcrypt.genSalt(10);
  // This creates a hashed password, what only bcrypt can decrypt.
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    password: hashPassword,
    email: req.body.email
  });

  const account = new Account({
    // Assign created user id to account
    user: user._id,
    bankPrefix: process.env.BANK_PREFIX
  });

  try {
    const newUser = await user.save();
    const newAccount = await account.save();
    res.status(201).json({ newUser, newAccount });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/account", verifyUser, async (req, res) => {
  console.log("Retrieving user's information")

  // Get logged in user's user and account information
  const currentUser = await User.findOne({_id: req.user._id});

  if(!currentUser) return res.status(500).json({error: "Couldn't find you user information from the database."})

  const currentAccount = await Account.findOne({user: req.user._id});

  if(!currentAccount) return res.status(500).json({error: "Couldn't find your account information from the database."})

  res.status(200).json({
    firstname: currentUser.firstname,
    lastname: currentUser.lastname,
    email: currentUser.email,
    accountnumber: currentAccount.accountnumber
  })
});

module.exports = router;