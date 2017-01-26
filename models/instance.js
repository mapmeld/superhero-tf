const mongoose = require('mongoose');

var instanceSchema = mongoose.Schema({
  awsid: String,
  started: Date,
  finished: Date,
  running: Boolean
});

module.exports = mongoose.model('instance', instanceSchema);