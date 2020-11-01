const express = require("express");
const router = express.Router();
const verifyUser = require('./authorizations/authUser');
const fs = require('fs');
const jose = require('node-jose');
const axios = require('axios');
const { exchangeRates } = require('exchange-rates-api');

// Import central pank refreshing logic.
const refreshCentralPank = require('../processes/refreshCentralPank');

// Import transfer validation.
const { transferValidation } = require('./validations/validations');

// Import models used in the transfer proccess.
const Transfer = require("../models/Transfer");
const Account = require("../models/Account");
const User = require("../models/User");
const RemoteBank = require("../models/RemoteBank");

// POST /transfer handles transfer sending.
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
      res.status(200).json({"message": "Local transfer completed!"});
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
          res.status(500).json({error: "Problems with central pank. Try again later."});
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

router.post('/b2b', async(req, res) => {

  console.log('Processing incoming remote transaction');

  let transaction;

  // Save the incoming jwt.
  const incomingJwt = req.body.jwt;

  // JWT payload parsing
  try {

    // Split payload from the jwt.
    const jwtPayload = incomingJwt.split('.')[1];


    // Decode and parse it into a JSON.
    transaction = JSON.parse(Buffer.from(jwtPayload, 'base64').toString());

    console.log("Payload received: " + transaction);

  } catch (err) {
    return res.status(400).json({ error: 'Problems with parsing sent jwt: ' + err.message })
  }

  // Get local bank's account.
  const accountTo = await Account.findOne({ accountnumber: transaction.accountTo });

  // Check if accountTo exists.
  if (!accountTo) {
    return res.status(400).json({error: "Account was not found in our bank."});
  }

  // For debugging. Delete later.
  console.log("Bank found: " + accountTo);

  // Get the bank prefix, that tranfer is from.
  const bankFromPrefix = transaction.accountFrom.substring(0, 3);
  console.log("Account from bankprefix: " + bankFromPrefix);

  // Check if bank from is a remote bank.
  const bankFrom = await RemoteBank.findOne({ bankPrefix: bankFromPrefix });

  // If bankFrom is not found.
  if (!bankFrom) {
    console.log("Could not find bankFrom from local remote banks list.");

    // Refresh banks collection.
    const refreshBanks = await refreshCentralPank.refreshCentralPank();

    if (typeof refreshBanks !== 'undefined') {
      console.log("Problems communicationg with central bank.");

      res.status(502).json({error: "Error with central bank" + refreshBanks.error})
    }

    // Try getting the details of the remote bank again.
    console.log("Trying to find remote bank from local collection again.");
    bankFrom = await RemoteBank.findOne({ bankPrefix: bankFromPrefix });


    // If remote bank is still not found.
    if(!bankFrom) {
      console.log("Remote bank still not found.");

      return res.status(400).json({error: "The remote bank is not part of our central bank."})
    }
  }

  // If bank is found we'll have access to jwksurl.
  console.log("Got sending bank account's details!");
  console.log(bankFrom.jwksUrl);


  // if sending bank does not have jwksUrl.
  if (!bankFrom.jwksUrl) {
    console.log("jwksUrl of sending account not found!");

    return res.status(500).json({error: "The jwksUrl of your bank is missing."})
  }

  // Get bank's public key
  let keystore;
  try {

  // Get other bank's public key
  console.log("Attempting to contact jwksUrl.");
  const jwksUrlResponse = await axios.get(bankFrom.jwksUrl);

  // Import the JWK-set as a keystore.
  console.log("Importing public key to keystore");
  keystore = await jose.JWK.asKeyStore(jwksUrlResponse.data);
  } catch (err) {
    console.log("Importing public key failed: " + err.message);
    return res.status(400).json({error: "The jwksUrl of your bank is invalid"})
  }

  // Verify that the signature matches the payload and it's created with the private key which's public version we have.
  console.log("Verifying signature.");
  try {
    await jose.JWS.createVerify(keystore).verify(jwt);
  } catch (err) {
    return res.status(400).json({error: "Invalid signature"});
  }

  // Save amount to an variable.
  let amount = transaction.amount;

  // Convert amount from another currency (if necessary).
  if (accountTo.currency != transaction.currency) {
    console.log("Converting the currency.");

    // Get the currency rate.
    const rate = await exchangeRates().latest().base(transaction.currency).symbols(accountTo.currency).fetch();

    console.log(`1 ${transaction.currency} = 1 ${rate} ${accountTo.currency}`);

    // Save the amount after currency exchange.
    amount = parseInt(parseFloat(rate) * parseInt(amount).toFixed(0));
  }

  // Get user related to account to's account
  const accountToUser = await User.findOne({_id: accountTo.userId});

  // Increase accountTo's balance
  console.log(`Increasing ${accountToUser.name} money by: ` + amount);

  accountTo.balance = accountTo.balance + amount;

  // Save the new amount.
  accountTo.save();

  // Create transaction
  const remoteTransfer = await new Transfer({
    userId: accountTo.userId,
    amount: transaction.amount,
    currency: transaction.currency,
    accountFrom: transaction.accountFrom,
    accountTo: transaction.accountTo,
    explanation: transaction.explanation,
    senderName: transaction.senderName,
    receiverName: accountToUser.name,
    status: "completed"
  });

  // Send back receiver name
  res.status(200).json({receiverName: accountToUser.name});
});

router.get('/jwks', async(req, res) => {

  // Create new keystore
  console.log("Creating a new keystore");
  const keystore = jose.JWK.createKeyStore();

  // Add private key from file to keystore
  console.log("Reading private key and adding it to keystore");
  console.log();

  await keystore.add(fs.readFileSync('./keys/private.key').toString(), 'pem')

  return res.status(200).send(keystore.toJSON());
})

module.exports = router;