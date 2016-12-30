// spawn.js
// test launching a TensorFlow server on EC2 on demand

const awsCli = require('aws-cli-js');
const Options = awsCli.Options;
const Aws = awsCli.Aws;

const hasher = require('string-hash');
const Task = require('./models/task');

async function spawn(ctx) {
  var body = ctx.request.body;
  
  // previously requested exact same images ?
  var matchingTasks = await Task.find({
    image: hasher(body.original),
    mask: hasher(body.mask),
    newmask: hasher(body.newmash)
  });
  if (matchingTasks.length) {
    return ctx.redirect('/result/' + matchingTasks[0]._id);
  }
  
  var t = new Task({
    image: hasher(body.original),
    mask: hasher(body.mask),
    newmask: hasher(body.newmash),
    started: new Date(),
    user: ctx.user || null
  });
  await t.save();

  var response = await spawnServer(body);
  console.log(response);
  
  // identify server name and IP address
  // ping {IP address}/status repeatedly outside of this task? or only using user JS?
  
  return ctx.json = response;
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
  
  aws.command('ec2 run-instances --region us-east-1 --image-id ami-6867717f --count 1 --instance-type g2.2xlarge --key-name nuveau --security-groups "Deep Learning AMI-1-5-AutogenByAWSMP-1"').then((data) => {
    callback(data);
  });
}

module.exports = {
  spawn: spawn
};