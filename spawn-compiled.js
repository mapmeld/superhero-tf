'use strict';

let spawn = (() => {
  var _ref = _asyncToGenerator(function* (ctx) {
    var body = ctx.request;
    console.log(ctx.req);

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

    console.log(body.experiment);
    if (['analogy', 'anyface'].indexOf(body.experiment) > -1) {
      t.image = hasher(body.original);
      t.mask = hasher(body.mask);
      t.newmask = hasher(body.newmash);
    } else if (['monster', 'skull'].indexOf(body.experiment) > -1) {
      t.image = hasher(body.original);
      t.mask = hasher(body.mask);
      t.newmask = hasher(body.newmash);
    } else if (['shakespeare'].indexOf(body.experiment) > -1) {
      console.log(body.source);
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
      hasServer.finished = null;
      hasServer.save(); // await?

      t.server = {
        ip: hasServer.ip,
        started: hasServer.started
      };
    } else {
      var response = yield spawnServer(body);
      console.log(response);

      // identify server name and IP address
      // ping {IP address}/status repeatedly outside of this task? or only using user JS?
      t.server = {
        ip: response.ip || '0.0.0.0',
        started: new Date()
      };
    }

    yield t.save();

    return ctx.json = response;
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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// spawn.js
// test launching a TensorFlow server on EC2 on demand

const awsCli = require('aws-cli-js');
const Options = awsCli.Options;
const Aws = awsCli.Aws;

const hasher = require('string-hash');
const Task = require('./models/task');
const Instance = require('./models/instance');

function spawnServer(postbody, callback) {
  // aws ec2 run-instances --image-id ami-xxxxxxxx --count 1 --instance-type t1.micro --key-name MyKeyPair --security-groups my-sg

  var cmdOptions = new Options(process.env.ACCESSKEY, process.env.SECRETKEY, null);
  var aws = new Aws(cmdOptions);
  /*
  aws.command('iam list-users').then((data) => {
    console.log('data = ', data); 
  });
  */

  // TODO: resolve conflict between using a Promise and using async/await
  aws.command('ec2 run-instances --region us-east-1 --image-id ami-6867717f --count 1 --instance-type g2.2xlarge --key-name nuveau --security-groups "Deep Learning AMI-1-5-AutogenByAWSMP-1"').then(data => {
    var x = new Instance({
      ip: data.ip,
      started: new Date(),
      running: true
    });
    x.save(function (err) {
      if (err) {
        callback(null);
      } else {
        callback(x);
      }
    });
  });
}

module.exports = {
  spawn: spawn
};

