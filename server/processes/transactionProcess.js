const fetch = require('node-fetch');
const fs = require('fs');
const jose = require('node-jose');
const abortController = require('abort-controller');
const nock = require('nock');
const url = require('url');

const refreshCentralPank = require('../processes/refreshCentralPank');

const Account = require("../models/Account");
const Transfer = require("../models/Transfer");
const RemoteBank = require("../models/RemoteBank");

module.exports.transactionProcess = async () => {

  // jose signing
  // Save the private key from private_key file as a const.
  const privateKey = fs.readFileSync('keys/private.key').toString();
  // Create keystore for JWK keys.
  const keystore = jose.JWK.createKeyStore();
  // Add private key to the keystore
  const key = await keystore.add(privateKey, 'pem');

  // Get transactions that are pending
  const pendingTransactions = await Transfer.find({ status: 'pending' });

  // Loop through each pending transaction and send a new request.
  pendingTransactions.forEach(async transaction => {

    console.log("Processing pending transfers...");

    // Create transfer expiry date 3 days from now.
    const transferExpiryTime = new Date(
      transaction.createdAt.getFullYear(),
      transaction.createdAt.getMonth(),
      transaction.createdAt.getDate() + 3
    )

    // Check if tranfers expiry date is over.
    if (transferExpiryTime < new Date) {
      // Set transfer status to failed
      transaction.status = "failed"
      transaction.save();

      // Take on next transfer
      return;
    }

    // Create abortController to be able to abort the request if it's long-running.
    const controller = new abortController()

    // Check if bank that's being sent to, still exists in remote banks.
    const accountToPrefix = transaction.accountTo.slice(0, 3);
    let bankTo = await RemoteBank.findOne({ bankPrefix: accountToPrefix });

    // If bankTo does not exist, run central bank refresh.
    if (!bankTo) {
      const refreshResult = await refreshCentralPank.refreshCentralPank();

      // Check if there was something wrong with central pank
      if (typeof refreshResult.error !== 'undefined') {
        console.log("There was a problem with central bank communication");
        console.log(refreshResult.error)

        // Go to next transaction
        return;
      }
    }

    // Attempt to get the destination bank after refresh again
    bankTo = await RemoteBank.findOne({ bankPrefix: accountToPrefix });

    // If it still doesn't exist, mark transaction as failed.
    if (!bankTo ) {
      console.log("This bank prefix couldn't be found anymore");
      transaction.status = "failed";
      transaction.save();

      return;
    }

    // Create JWT from the transaction for sending to another bank.
    const jwt = await jose.JWS.createSign({alg: 'RSA256', format: 'compact'}, key)
    .update(JSON.stringify({
      accountFrom: transaction.accountFrom,
      accountTo: transaction.accountTo,
      currency: transaction.currency,
      amount: transaction.amount,
      explanation: transaction.explanation,
      senderName: transaction.senderName
    }), 'utf8').final();

    // Request to remote bank
    let serverResponseAsText;
    let serverResponseAsObject;
    let serverResponseAsJson;
    let timeout;

    try {
      console.log("Making request to " + bankTo.transactionUrl);

      // Set up 10 sec timer for aborting.
      const timeout = setTimeout(() => controller.abort(), 10000);

      // If test mode is enabled, return a hard-coded response
      if (process.env.TEST_MODE === 'true') {
        const parsedUrl = url.parse(bankTo.transactionUrl, true);

        const remoteBankScope = nock(`http://${parsedUrl.host}`)
        .persist()
        .post(parsedUrl.pathname)
        .reply(200, {
          receiverName: "John"
        })
      }

      // Send the request
      serverResponseAsObject = await fetch(bankTo.transactionUrl, {
        signal: controller.signal,
        method: 'POST',
        body: JSON.stringify({ jwt }),
        headers: {
            'Content-Type': 'application/json'
        }
      })


      // Convert server response into plain text
      serverResponseAsPlainText = await serverResponseAsObject.text()
      console.log(serverResponseAsPlainText);
    } catch (err) {
      console.log(err.message)
    }

    // Cancel aborting
    clearTimeout(timeout)

    // Server did not respond (we aborted before that)
    if (typeof serverResponseAsPlainText === 'undefined') {
        // Stop processing this transaction for now and take the next one
        return;
    }

    // Attempt to parse server response from text to JSON
    try {
      serverResponseAsJson = JSON.parse(serverResponseAsPlainText)
    } catch (e) {
      console.log(e.message + '. Response was: ' + serverResponseAsPlainText);

      transaction.status = 'failed';

      transaction.save();
      return;
    }

    // Check for unacceptable responses
    if (serverResponseAsObject.status < 200 || serverResponseAsObject.status >= 300) {
      console.log('Server response was ' + serverResponseAsObject.status);
      transaction.status = 'failed'

      transaction.save();
      return;
    }

    // Add receiverName to transaction
    transaction.receiverName = serverResponseAsJson.receiverName

    // Deduct accountFrom
    const account = await Account.findOne({ accountnumber: transaction.accountFrom });
    console.log(account);

    account.balance = account.balance - transaction.amount;
    account.save();

    // Update transaction status to completed
    console.log('Transaction ' + transaction.id + ' completed');
    transaction.status = 'completed';

    // Write changes to DB
    console.log("Saved transaction to database");
    transaction.save();
  });

  // Keep on repeating
  setTimeout(module.exports.transactionProcess, 10000);
}


