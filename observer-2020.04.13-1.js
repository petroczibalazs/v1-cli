const argv   = require('yargs').argv;
let {mappa} = argv || null;
const err_msg = `----------  ERROR! WRONG SYNTAX OR NO SUCH DIRECTORY ----------------\nUse this syntax:\nnode observer --mappa=mappaNeve\n\nobserver = the name of the file you will call to start observation tasks\nmappa    = a sub-folder under the root directory in which you want to watch for changes in the styles.scss file.\n ---------------------------------- `;

const fs = require('fs');
let dir = fs.existsSync('./src/' + mappa);
let readWriteSettings = require('./readWriteSettings');
  
  if(!dir){
    
  console.log("Nem létező dir");
	console.log(err_msg);
	process.exit();
	return;
}else{
   readWriteSettings("baseFolder", './src/' + mappa + '/dist');
};
  
const baseFolder = './src/' + mappa + '/dist';
const scssTargetFile = baseFolder + '/scss/style.scss';
let exists = fs.existsSync(scssTargetFile);

if(exists){
const start_msg = `\n[${new Date().toLocaleString()}] Watching for file changes on: ${scssTargetFile}\n---------- ------- --------\nDo not forget to stop watching this file by pressing (Ctrl+ C) two times in the end!\n---------- ------- --------`;
console.log(start_msg);

/*fs.watch is fast and efficient because it relies on the native op system events to follow changes in files
but the operating system generates a number events while saving a file and I want to let the program 
only to react on each once.
*/
  let timer = null;
  const scssChange = require('./scssChange');  
  /*Elmentetem a style.scss fájl induló állapotát!*/
  scssChange(scssTargetFile, true);

  fs.watch(scssTargetFile, (eventName, fileName) => {    

    if(timer){
      return;
    }
    timer = setTimeout(function(){
      timer = false;
      scssChange(scssTargetFile, false);
    }, 100); 
  });
}






