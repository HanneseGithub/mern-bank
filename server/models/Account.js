const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const randToken = require("rand-token");

const accountSchema = new Schema({
  accountnumber: {
    type: String,
    default: function () {
      // Generate random string 12 length.
      return process.env.BANK_PREFIX + randToken.generate(12);
    }
  },
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

const Account = mongoose.model("Account", accountSchema);
module.exports = Account;