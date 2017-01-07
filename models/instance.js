const mongoose = require('mongoose');

var instanceSchema = mongoose.Schema({
  ip: String,
  started: Date,
  finished: Date,
  running: Boolean
});

module.exports = mongoose.model('instance', instanceSchema);