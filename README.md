# superhero-tf

NodeJS server to invite people to deep learning. Spawns TensorFlow instances for custom experiments.

## Setup

Prerequisites: NodeJS, git, MongoDB

```
# MongoDB should be running
mongod &

git clone https://github.com/mapmeld/superhero-tf.git
cd superhero-tf
npm install
npm start
```

Install AWS CLI: http://docs.aws.amazon.com/cli/latest/userguide/installing.html

Set ACCESSKEY and SECRETKEY environment variables from an AWS IAM user with EC2 access.

## Open source libraries

Includes:

* <a href='https://github.com/WolframHempel/photobooth-js'>Photobooth.JS</a> for user camera in native JS
* <a href='https://github.com/jseidelin/pixastic'>Pixastic</a> for blurring images
* Bootstrap 3 CSS

## License

Open source, MIT license
