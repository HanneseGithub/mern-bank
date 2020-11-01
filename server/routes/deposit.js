const express = require("express");
const router = express.Router();
const verifyUser = require('./authorizations/authUser');

const Account = require("../models/Account");

// Add verification middleware.
router.post('/:amount', verifyUser, async (req, res) => {
  try {
    // Find the account of the logged in user (id stored in req.user) and deposit the specified amount to the account.
    const depositAccount = await Account.findOneAndUpdate(
      { 'user': req.user._id },
      {
        $inc: {
          balance: req.params.amount
        }
      });
    res.status(200).json({"You successfully deposited ": req.params.amount + " €"});
  } catch(err) {
    res.status(400).json({error: "Could not deposit money"});
  }
})

module.exports = router;