const fs = require('fs');
const settingsPath = './settings.json';

const readWriteSettings = (key, value) => {
  
  if(key && typeof value == "undefined"){
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'))[key];
  }else if(key && typeof value != "undefined"){
    let tmp = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    tmp[key] = value;
    fs.writeFileSync(settingsPath, JSON.stringify(tmp, null, 2));
    return true;
  }else{
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }
};

module.exports = readWriteSettings;