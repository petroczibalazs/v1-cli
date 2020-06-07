const fs = require('fs');
const schemesPath = './marker_schemes.json';

const readWriteSchemes = (key, value) => {
  
  if(key && typeof value == "undefined"){
    return JSON.parse(fs.readFileSync(schemesPath, 'utf8'))[key];
  }else if(key && typeof value != "undefined"){
    let tmp = JSON.parse(fs.readFileSync(schemesPath, 'utf8'));
    tmp[key] = value;
    fs.writeFileSync(schemesPath, JSON.stringify(tmp));
    return true;
  }else{
    return JSON.parse(fs.readFileSync(schemesPath, 'utf8'));
  }
};

module.exports = readWriteSchemes;