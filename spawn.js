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
  var matchingTasks = null;
  if (body.original) {
    matchingTasks = await Task.findOne({
      image: hasher(body.original),
      mask: hasher(body.mask),
      newmask: hasher(body.newmash),
      experiment: body.experiment
    });
  } else if (body.source) {
    matchingTasks = await Task.findOne({
      image: hasher(body.source),
      experiment: body.experiment
    });
  }
  if (matchingTasks) {
    return ctx.redirect('/results/' + matchingTasks[0]._id + '?familiar=true');
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
  } else {
    return ctx.json = { error: 'unknown experiment' };
  }
  
  var hasServer = await serverWaiting(body);
  if (hasServer) {
    // take over this server
    hasServer.finished = null;
    hasServer.save();  // await?
    
    t.server = {
      ip: hasServer.ip,
      started: hasServer.started
    };
  } else {  
    var response = await spawnServer(body);
    console.log(response);
  
    // identify server name and IP address
    // ping {IP address}/status repeatedly outside of this task? or only using user JS?
    t.server = {
      ip: response.ip || '0.0.0.0',
      started: new Date()
    };
  }
  
  await t.save();

  return ctx.json = response;
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
  aws.command('ec2 run-instances --region us-east-1 --image-id ami-6867717f --count 1 --instance-type g2.2xlarge --key-name nuveau --security-groups "Deep Learning AMI-1-5-AutogenByAWSMP-1"').then((data) => {
    var x = new Instance({
      ip: data.ip,
      started: new Date(),
      running: true
    });
    x.save(function(err) {
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