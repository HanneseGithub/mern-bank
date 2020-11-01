const express = require("express");
const router = express.Router();
const verifyUser = require('./authorizations/authUser');

const Account = require("../models/Account");

// Add verification middleware.
router.post('/:amount', verifyUser, async (req, res) => {
  try {
    // Store the logged in account's balance
    const withdrawingAccount = await Account.findOne({ 'user': req.user._id }).select('balance');

    // Don't allow withdrawing, when the user doesn't have enough money.
    if (withdrawingAccount.balance < req.params.amount) return res.status(409).json({"error": "Insufficent funds!"})

    // If user has enough money, go through with the deal.
    const updateBalance = await Account.updateOne(
      { 'user': req.user._id },
      {
        $inc: {
          balance: -req.params.amount
        }
      }
    );
    res.status(200).json({"You successfully withdrew ":  req.params.amount + " €"});
  } catch(err) {
    res.status(400).json({"error" : "Could not withdraw money!"});
  }
})

module.exports = router;