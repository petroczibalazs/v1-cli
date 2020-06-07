
const args = require('yargs').argv;
const def = require('./gulpfile.js');
console.log("Hello from gulpStarter!");

const gulp_file = require('./gulpfile');
gulp_file(args._[0]);


