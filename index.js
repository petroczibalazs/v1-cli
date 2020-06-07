const readWriteSettings = require('./readWriteSettings');

const hub = (API, option, params) => {
  
  switch(API){
    case 'css':
      const cssAction = require('./css');

      if(option == 'finish'){
        console.log("option az elosztásnál: " + option);
        const HTMLAction_1 = require('./HTML');
        cssAction(option)
        .then(() => {
          HTMLAction_1('saveAll');
        });
        readWriteSettings('isEditable', false);
      }else{
        readWriteSettings('isEditable', true);
        cssAction(option)
        .then(() => { 
          console.log("Újra szól a hatlövetű");         
          console.log("params: " + params);
          
          if(!params){
            process.exit();
          }
              
        });           
      }
    break;

    case 'markers':
    case 'HTML':
      const HTMLAction = require('./HTML');
      HTMLAction(option, params)
      .catch((err) => {console.log(err)});
    break;
  }
  return;
}
module.exports = hub;