const mongoose = require('mongoose');

var taskSchema = mongoose.Schema({
  original: String,
  mask: String,
  newmask: String,
  archive: String,
  started: Date,
  finished: Date,
  user: String,
  experiment: String,
  server: {
    id: String,
    awsid: String,
    started: Date
  },
  parameters: Object
});

module.exports = mongoose.model('task', taskSchema);