const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transferSchema = new Schema({
  createdAt: {
    type: Date,
    required: true,
    default: Date.now()
  },
  userId: {
    type: String
  },
  accountFrom: {
    type: String,
    required: true,
    min: 12,
    max: 12
  },
  accountTo: {
    type: String,
    required: true,
    min: 12,
    max: 12
  },
  currency: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 1,
  },
  explanation: {
    type: String,
    required: true,
    min: 1
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "completed", "inProgress", "failed"],
    default: "pending"
  },
  senderName: {
    type: String,
    required: true
  },
  receiverName: {
    type: String
  }
})

const Transfer = mongoose.model('transfers', transferSchema);
module.exports = Transfer;