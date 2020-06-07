
const yargs = require('yargs');
const def = require('./gulpfile.js');

module.exports = () => {
const path = yargs._[0] || null;
console.log(path);

}