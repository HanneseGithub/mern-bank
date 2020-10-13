const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RemoteBankSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    transactionUrl: {
        type: String,
        required: true
    },
    apiKey: {
        type: String,
        required: true
    },
    bankPrefix: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 3
    },
    owners: {
        type: String,
        required: true,
        minlength: 1
    },
    jwksUrl: {
        type: String,
        required: true
    },
});

const RemoteBank = mongoose.model("remotebanks", RemoteBankSchema);
module.exports = RemoteBank;