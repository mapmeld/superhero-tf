'use strict';

let spawn = (() => {
  var _ref = _asyncToGenerator(function* (ctx) {
    var body = ctx.request.body;

    // previously requested exact same images
    var matchingTask = null;
    if (body.original) {
      matchingTask = yield Task.findOne({
        image: hasher(body.original),
        mask: hasher(body.mask),
        newmask: hasher(body.newmash),
        experiment: body.experiment
      });
    } else if (body.source) {
      matchingTask = yield Task.findOne({
        image: hasher(body.source),
        experiment: body.experiment
      });
    }
    if (matchingTask) {
      return ctx.redirect('/results/' + matchingTask._id + '?familiar=true');
    }

    var t = new Task({
      started: new Date(),
      user: ctx.user || null
    });

    if (['analogy', 'anyface'].indexOf(body.experiment) > -1) {
      t.image = hasher(body.original);
      t.mask = hasher(body.mask);
      t.newmask = hasher(body.newmash);
    } else if (['monster', 'skull'].indexOf(body.experiment) > -1) {
      t.image = hasher(body.original);
      t.mask = hasher(body.mask);
      t.newmask = hasher(body.newmash);
    } else if (['shakespeare'].indexOf(body.experiment) > -1) {
      t.image = hasher(body.source);
      t.parameters = {
        maxlen: 1 * body.maxlen || 25,
        redun_step: 1 * body.redun_step || 3,
        batch_size: 1 * body.batch_size || 128,
        temperature: 1 * body.temperature || 0.5,
        learning_rate: 1 * body.learning_rate || 0.001
      };
    } else {
      return ctx.json = { error: 'unknown experiment' };
    }

    var hasServer = yield serverWaiting(body);
    if (hasServer) {
      // take over this server
      // console.log('resuming server');
      // console.log(hasServer);
      hasServer.finished = null;
      hasServer.save(); // await?

      t.server = {
        awsid: hasServer.awsid,
        started: hasServer.started
      };
    } else {
      var newserve = yield spawnServer(body);
      // console.log('setting up new server');
      // console.log(newserve);

      // identify server name and IP address
      // ping {IP address}/status repeatedly outside of this task? or only using user JS?
      t.server = {
        awsid: newserve.awsid,
        started: new Date()
      };
    }

    yield t.save();

    ctx.body = t;
  });

  return function spawn(_x) {
    return _ref.apply(this, arguments);
  };
})();

let serverWaiting = (() => {
  var _ref2 = _asyncToGenerator(function* (postbody, callback) {
    // look for instances with the same kind of experiment
    // must have started and finished in the past half-hour (so experiments can run on it)
    var halfHour = new Date() - 30 * 60 * 1000;
    var x = yield Instance.findOne({
      running: true,
      experiment: postbody.experiment,
      started: {
        $gt: halfHour
      },
      finished: {
        $gt: halfHour
      }
    });
    return x;
  });

  return function serverWaiting(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
})();

let spawnServer = (() => {
  var _ref3 = _asyncToGenerator(function* (postbody) {
    var cmdOptions = new Options(process.env.ACCESSKEY, process.env.SECRETKEY, null);
    var aws = new Aws(cmdOptions);
    var data = yield aws.command('ec2 run-instances --region us-east-1 --image-id ami-8715e591 --count 1 --instance-type g2.2xlarge --key-name animalsound --security-groups "Deep Learning AMI-1-5-AutogenByAWSMP-1"');

    /* data.object.Instances[
      InstanceId
      LaunchTime
      Monitoring: { State: 'disabled' }
      Placement: { AvailabilityZone: 'us-east-1c' }
      State: { Name: 'pending' }
    ] */

    // finding my instance ID on AWS machines
    // http://stackoverflow.com/questions/625644/find-out-the-instance-id-from-within-an-ec2-machine

    var x = new Instance({
      awsid: data.object.Instances[0].InstanceId,
      started: new Date(),
      running: true
    });
    x = yield x.save();

    /*
    var x = new Instance({
      awsid: '127.0.0.1',
      started: new Date(),
      running: true
    });
    x = await x.save();
    */

    return x;
  });

  return function spawnServer(_x4) {
    return _ref3.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// spawn.js
// test launching a TensorFlow server on EC2 on demand

const awsCli = require('aws-cli-js');
const Options = awsCli.Options;
const Aws = awsCli.Aws;

const hasher = require('string-hash');
const Task = require('./models/task');
const Instance = require('./models/instance');

module.exports = {
  spawn: spawn
};

