// spawn.js
// test launching a TensorFlow server on EC2 on demand

const awsCli = require('aws-cli-js');
const Options = awsCli.Options;
const Aws = awsCli.Aws;

const hasher = require('string-hash');
const Task = require('./models/task');
const Instance = require('./models/instance');

async function spawn(ctx) {
  var body = ctx.request.body;
  
  // previously requested exact same images
  var matchingTask = null;
  if (body.original) {
    matchingTask = await Task.findOne({
      image: hasher(body.original),
      mask: hasher(body.mask),
      newmask: hasher(body.newmash),
      experiment: body.experiment
    });
  } else if (body.source) {
    matchingTask = await Task.findOne({
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
      maxlen: ((1 * body.maxlen) || 25),
      redun_step: ((1 * body.redun_step) || 3),
      batch_size: ((1 * body.batch_size) || 128),
      temperature: ((1 * body.temperature) || 0.5),
      learning_rate: ((1 * body.learning_rate) || 0.001)
    };
  } else {
    return ctx.json = { error: 'unknown experiment' };
  }
  
  var hasServer = await serverWaiting(body);
  if (hasServer) {
    // take over this server
    // console.log('resuming server');
    // console.log(hasServer);
    hasServer.finished = null;
    hasServer.save();  // await?
    
    t.server = {
      ip: hasServer.ip,
      started: hasServer.started
    };
  } else {  
    var newserve = await spawnServer(body);
    // console.log('setting up new server');
    // console.log(newserve);
  
    // identify server name and IP address
    // ping {IP address}/status repeatedly outside of this task? or only using user JS?
    t.server = {
      ip: newserve.ip || '0.0.0.0',
      started: new Date()
    };
  }
  
  await t.save();

  ctx.body = t;
}

async function serverWaiting(postbody, callback) {
  // look for instances with the same kind of experiment
  // must have started and finished in the past half-hour (so experiments can run on it)
  var halfHour = (new Date()) - 30 * 60 * 1000;
  var x = await Instance.findOne({
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
}

async function spawnServer(postbody) {   
  var cmdOptions = new Options(process.env.ACCESSKEY, process.env.SECRETKEY, null);
  var aws = new Aws(cmdOptions);
  // --image-id ami-6867717f --count 1 --instance-type g2.2xlarge
  var data = await aws.command('ec2 run-instances --region us-east-1 --image-id ami-8715e591 --count 1 --instance-type t2.nano --key-name animalsound --security-groups "Deep Learning AMI-1-5-AutogenByAWSMP-1"')
  
  var x = new Instance({
    ip: data.ip,
    started: new Date(),
    running: true
  });
  x = await x.save();
  
  /*
  var x = new Instance({
    ip: '127.0.0.1',
    started: new Date(),
    running: true
  });
  x = await x.save();
  */
  
  return x;
}

module.exports = {
  spawn: spawn
};