const mongoose = require('mongoose');

var taskSchema = mongoose.Schema({
  original: String,
  mask: String,
  newmask: String,
  archive: String,
  started: Date,
  finished: Date,
  user: String
});

module.exports = mongoose.model('task', taskSchema);