const express = require("express");
const router = express.Router();
const verifyUser = require('./authorizations/authUser');

// Import central pank refreshing logic.
const refreshCentralPank = require('../processes/refreshCentralPank');

// Import transfer validation.
const { transferValidation } = require('./validations/validations');

// Import models used in the transfer proccess.
const Transfer = require("../models/Transfer");
const Account = require("../models/Account");
const User = require("../models/User");
const RemoteBank = require("../models/RemoteBank");

// Transfers - local transfer / money from my bank to other bank / money from other bank to my bank.

// POST /transfer handles transaction sending.
router.post('/', verifyUser, async(req, res) => {

  // Validate transaction's parameter's with JOI. Make it catch errors.
  const { error } = transferValidation(req.body);

  // If validation catches errors, it displays it quite specifically to request sender.
  if(error) {
    return res.status(400).json({"message": error.details[0].message});
  };

  try {
    // Cut away/isolate the bank prefixes.
    const accountFromBankPrefix = req.body.accountFrom.slice(0,3);
    const accountToBankPrefix = req.body.accountTo.slice(0,3);

    // Make sure that accountFrom prefix is from the LOCAL bank.
    if (accountFromBankPrefix != process.env.BANK_PREFIX) {
      res.status(400).json({"error": "You shouldn't be making a transfer to this endpoint."})
    }

    // Get logged in user's account number and balance from DB.
    const currAccountNumber = await Account.findOne({'user': req.user._id}).select('accountnumber balance');

    // Check if the logged in user's account could be found.
    if (!currAccountNumber) return res.status(401).json({error: "You must be logged in to make a transfer."});

    // Check if logged in user's account matches to the accountFrom account.
    if(req.body.accountFrom !== currAccountNumber.accountnumber) return res.status(401).json({error: "You can only make transfers under your account. Please enter your account number again."});

    // Check if sending account has enough money.
    if (currAccountNumber.balance < req.body.amount) return res.status(409).json({error: "Insufficent funds!"});



    // Transfer 1: LOCAL -> LOCAL
    if (accountFromBankPrefix == process.env.BANK_PREFIX && accountToBankPrefix == process.env.BANK_PREFIX) {

      // Find the receiving local bank's data from the database.
      const accountToExists = await Account.findOne({'accountnumber': req.body.accountTo});

      // Check if receiving bank was found from the database.
      if (!accountToExists) return res.status(400).json({"error": "Please enter correct receiving account number!"})

      // Subtract transfer amount from the sending account's balance.
      const giveMoney = await Account.updateOne(
        currAccountNumber,
      {
        $inc: {
          balance: -req.body.amount
        }
      });

      // Add transfer amount to the receiving account's balance.
      const getMoney = await Account.updateOne(
        accountToExists,
      {
        $inc: {
          balance: req.body.amount
        }
      });

      // Save the local transfer in the database.
      const localTransfer = new Transfer({
        userId: req.user._id,
        amount: req.body.amount,
        currency: req.body.currency,
        accountFrom: req.body.accountFrom,
        accountTo: req.body.accountTo,
        explanation: req.body.explanation,
        status: "completed",
        senderName: req.user.firstname
      });

      await localTransfer.save();
      res.status(201).json({"message": "Local transfer completed!"});
    };

    // Transfer 2: LOCAL -> REMOTE
    if (accountFromBankPrefix == process.env.BANK_PREFIX && accountToBankPrefix != process.env.BANK_PREFIX) {
      // Find receiving bank's bank prefix from local "remotebanks" collection.
      const remoteBankTo = await RemoteBank.findOne({bankPrefix: accountToBankPrefix});

      if (!remoteBankTo) {
        // If the remote bank is not found, refresh remote bank collection for new remote banks.
        const refreshResult = await refreshCentralPank.refreshCentralPank();

        // Check if there was something wrong with central pank
        if (typeof refreshResult.error !== 'undefined') {
          console.log("There was a problem with central bank communication");
          console.log(refreshResult.error);
          res.status(500).json({message: "Problems with central pank. Try again later."});
        }

        // Check again if bank with that specific prefix is found after the update. (NB! Update takes 2 tries).
        try {
          const remoteBankToUpdated = await RemoteBank.findOne({bankPrefix: accountToBankPrefix});

          if(!remoteBankToUpdated) return res.status(400).json({message: "This prefix is not any of our banks!"});
        }
        catch(errors) {
          res.status(400).json({error: errors.message})
        }
      }

      // Save the remote transfer in the database.
      const localTransfer = new Transfer({
        userId: req.user._id,
        amount: req.body.amount,
        currency: req.body.currency,
        accountFrom: req.body.accountFrom,
        accountTo: req.body.accountTo,
        explanation: req.body.explanation,
        senderName: req.user.firstname
      });

      await localTransfer.save();

      res.status(201).json({"message": "Remote transfer added!"});

    }
  } catch(err) {
    res.status(400).json({error: "Couldn't find bank prefix like that"});
  };
});

module.exports = router;