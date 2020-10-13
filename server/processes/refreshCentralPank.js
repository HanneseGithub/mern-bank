const fetch = require('node-fetch');
const AbortController = require('abort-controller');
const nock = require('nock')

const RemoteBank = require("../models/RemoteBank");

// Set up an abort controller
const controller = new AbortController();

// Set up 10 sec timer for abort
const timeout = setTimeout(() => controller.abort(), 10000);

module.exports.refreshCentralPank = async () => {
  try {
    // Add console logs for later debugging.
    console.log("Refreshing remote bank's collection'!");
    console.log("Contacting central bank at " + `${process.env.CENTRAL_BANK_URL}/banks`);

    // Delete all the banks from remote banks collection.
    const deleted = await RemoteBank.deleteMany();
    console.log("Deleted " + deleted.deletedCount + " banks");

    // If test mode is enabled, mock central bank's request. When this is set true, the fetch below will fetch against this nock instead!
    // The fetch recieves the hard-coded reply and goes on from there.
    if(process.env.TEST_MODE === 'true') {
      // Nock central bank answer (receive 2-3 hardcoded banks)
      const centralBankScope = nock(`${process.env.CENTRAL_BANK_URL}`)
      .persist()
      .get('/banks')
      .reply(200,
        [{
        name: "fooBank",
        transactionUrl: "http://foobank.diarainfra.com/transactions/b2b",
        apiKey: "94d21b14-b77b-402d-a2f5-35f85889d480",
        bankPrefix: "755",
        owners: "Henno Täht",
        jwksUrl: "http://foobank.diarainfra.com/jwks.json"
        },
        {
        name: "Kerli pank",
        apiKey: "7ec31850-2f99-4601-a161-5d151213a590",
        transactionUrl: "https://kerliarendab.xyz/transactions/b2b",
        bankPrefix: "8b9",
        owners: "Kerli Tekku",
        jwksUrl: "https://kerliarendab.xyz/keys/public/public.key"
        }]
      )
    }

    // Fetch all banks from central bank to local remote bank collection.
    const banks = await fetch(`${process.env.CENTRAL_BANK_URL}/banks`, {
      headers: { 'api-key' : process.env.API_KEY},
      // Assign timeout to this fetch
      signal: controller.signal,
    })
    .then(res => res.json())
    .then(json => {
      console.log(json);

      // User insertMany to insert all documents received as JSON at once.
      RemoteBank.insertMany(json, {
        // Skips over problematic banks, which are missing some important pieces.
        lean: true
      })
      .then(() => {
        console.log("Remote banks from central bank inserted.");
      })
      .catch(err => {
        console.log(err);
      })
    });
  } catch (err) {
    return {error: err.message};
  }
  // If fetch is successful clear timeout.
  clearTimeout(timeout);
}

// insertMany() inspiration:
// https://www.geeksforgeeks.org/mongoose-insertmany-function/
// https://stackoverflow.com/questions/37379180/bulk-insert-in-mongodb-using-mongoose