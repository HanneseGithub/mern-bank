const express = require("express");
const router = express.Router();
const verifyUser = require('./authorizations/authUser');

const Account = require("../models/Account");

// Add verification middleware.
router.get('/', verifyUser, async (req, res) => {
  try {
    // Find the account of the logged in user (id stored in req.user).
    const balanceAccount = await Account.findOne({ 'user': req.user._id }).select('balance');

    res.status(200).json({
      "firstname": req.user.firstname,
      "balance": balanceAccount.balance
    })
  } catch(err) {
    res.status(401).json( {"error": "Unauthorized action. Log in to do that." });
  }
})

module.exports = router;