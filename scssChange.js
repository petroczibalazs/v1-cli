const settings = require('./readWriteSettings');
const baseFolder = settings('baseFolder');

const md5 = require('md5');
const fs = require('fs');
let md5Previous = "";
const HTMLAction = require('./HTML');
const readWriteSettings = require('./readWriteSettings');

/*
const defaultWidthRegText = '\\\$default[-]width\\s*:\\s*\\d+px;';
const templateTypeRegText = '\\\$template[-]type\\s*:\\s*"[^"]+"';
let defaultWidth = null;
let templateType = null;
*/

let scssContent = '';

let rows = [],
    activeRows = [],
    commentedRows = [],
    activesInContainers = [];

let prevRows = [],
    prevActiveRows = [],
    prevCommentedRows = [],
    prevActivesInContainers = [];

let kreativ_type = null;

const resetDefaults = () => {
  scssContent = "";
  rows.length = 0;
  activeRows.length = 0;
  commentedRows.length = 0;
  activesInContainers.length = 0;

  prevRows.length = 0;
  prevActiveRows.length = 0;
  prevCommentedRows.length = 0;
  prevActivesInContainers.length = 0;

};
const saveStatus = () => {  
 readWriteSettings("scssContent", scssContent);
};

const makeRowScheme = () => {
/*
* az index.css.html fájlon végrehajtott változtatásokhoz (esetenként)
* szükség van a style.scss file-ból az aktív elem csoportokra mutató sorokat tartalmazó,
* valamint az edcontainer kezdő-, záró részeket jelölő tömbre, de CSAK EZEKRE.
* Szűri a sorokat, majd sematizálja, egyszerűsíti ezek jelölését, 
* ezáltal kezelhetőbbé, könnyebben összevethetővé teszi őket!
*/
  rows.forEach((aRow, index) => {
    aRow = aRow.trim();
    if (aRow.indexOf('EDCONTAINER') > -1) {
      /*EDCONTAINER jelölőt tartalmazó megjegyzések helyére egyszerű nyitó - záró jelölők*/
      if (aRow.indexOf('START') > -1) {
        rows[index] = '__EDCONTAINER START__';
      } else {
        rows[index] = '__EDCONTAINER END__';
      }
    }          
    else if (aRow.indexOf('@import') > -1 && !aRow.match(/^\s*\/\//)) {
      /*aktív sorok helyére az adott sorból kinyert libid azonosító*/
      rows[index] = `${aRow.match(/libid_\d{3}_\d{3}/)[0]}`;
    }
    else if (aRow.indexOf('@import') > -1) {
      /*kikommentelt sorok helyére üres string*/
      rows[index] = "";
    }    
  });
  rows = rows.filter(value => value != '');
  return;
};
const processRowData = ({content = '', force = false}) => {
  
  /*az aktuális style.scss fájl pillanatnyilag aktuális 
  * tartalma, és a fájlon észlelt eseményt megelőző (elmentett)
  * korábbi tartalma alapján feltölti a megfelelő tömböket a 
  * kommentelt, és az aktív sorokkal.
  */
  const processRows = (rows, name) => {
    
    for (let row of rows) {
      row = row.trim();
      if (row.indexOf('/') == 0 && row.indexOf('EDCONTAINER') == -1) {
          (name == "prev"? prevCommentedRows : commentedRows).push(row);
      } else {
          (name == "prev"? prevActivesInContainers : activesInContainers).push(row);
        if (row.indexOf('EDCONTAINER') < 0) {
          (name == "prev"? prevActiveRows: activeRows).push(row);
        }
      }
    }
  };

  kreativ_type = content.match(/[$]template[-]type:\s*"([^"]+)"/)[1];

  rows = (content.split('\n')).filter((value) => {
    value = value.replace(/^[\s\n]+|[\s\n]+$/g, '');
    return value != '' && value.indexOf('functions') < 0 && (value.indexOf('@import') > -1 || value.indexOf('EDCONTAINER') > -1);
  }); 

  processRows(rows, "cur");


  let prevRows = (readWriteSettings()).scssContent;
      prevRows = (prevRows.split('\n')).filter((value) => {
        value = value.replace(/^[\s\n]+|[\s\n]+$/g, '');
        return value != '' && value.indexOf('functions') < 0 && (value.indexOf('@import') > -1 || value.indexOf('EDCONTAINER') > -1);
  });

  processRows(prevRows, "prev");
  return;
};

const actOnEvent = () => {

/*
* a processRawData metódus által feltöltött tömb tárolókat
* használva megvizsgálja, konkrétan milyen esemény következett be,
* és annak megfelelő tevékenységeket inicializál - esetenként változtatásokat végeztet
* a beolvasott aktuális style.scss fájl tartalmán, és a kapcsolódó index.css.html fájlon
*/  
if ((parseInt(prevActiveRows.length) + parseInt(prevCommentedRows.length)) == (parseInt(activeRows.length) + parseInt(commentedRows.length))) {
/*
* vagyis nem került be a style.scss fájlba korábban nem szereplő, új elem csoporthoz tartozó bejegyzés
*/
      if (activeRows.length != prevActiveRows.length) {
        /*A kommenteken változtatott*/
        if (activeRows.length < prevActiveRows.length) {
          /*kikommentelt egy korábban aktív elem csoportra utaló sort*/
          let d = deletedRow = (prevActiveRows.filter(value => !activeRows.includes(value)))[0];
          d = d.substring(d.indexOf("/") + 1, d.lastIndexOf("/meta-data"));
          HTMLAction('delete', deletedRow.match(/libid_\d{3}_\d{3}/)[0], d);
        } else {
          /*levette a kommentet, aktívvá tett egy korábban kommentelt sort*/
          let newActiveRow = (activeRows.filter(value => !prevActiveRows.includes(value)))[0];
          const reg = new RegExp("\/\\\*(DIV|TD|BOTH)\\\*\/\\s*$")
          let rowEnding = (newActiveRow.trim()).match(reg);
          let [newElGroupName, newElGroupLibId] = newActiveRow.match(/(libid_\d{3}_\d{3})[^/]+/);

          if(rowEnding != null){
            /* normálisan megadta az aktív sor végén a típus jelölőt (DIV|TD|BOTH), ezért el tudom kezdeni
            *  a sor alapján az elem csoport importálását.        
            */
           rowEnding = rowEnding[1];
           /*
           *  DE! Nem elég importálni az elem csoportnak a style.scss fájlban az őt jelölő sor végén, megjegyzésben megadott
           *  típusú HTML kódját, hanem a meta-data folderben, a _style.scss partial import scss fájlban is át kell írni
           *  a $this-type változó értékét, hogy a _functions.scss fájlban lévő kódrészek  a megfelelő css szabályokat generálják le.
           *  Both típusnál viszont soha nem szabad átírni a típus jelölő változó értékét!
           */

           let elementGroupHTML = fs.existsSync(`${baseFolder}/element-groups/${newElGroupName}/${rowEnding}/index.css.html`);
              
              if(elementGroupHTML === true){
                    let newElGroupScss = fs.readFileSync(`${baseFolder}/element-groups/${newElGroupName}/meta-data/_style.scss`, 'utf8');
                    let newElGroupType = newElGroupScss.match(/\$this\-type\s*:\s*([^;]+)/)[1].trim().replace(/(^['"]|['"]$)/g, '');

                    if(newElGroupType !== 'BOTH' && newElGroupType !== rowEnding){
                        newElGroupScss = newElGroupScss.replace(/\$this\-type\s*:\s*([^;]+)/, '$this-type : "' + rowEnding + '"' );
                        fs.writeFileSync(`${baseFolder}/element-groups/${newElGroupName}/meta-data/_style.scss`, newElGroupScss);
                    }

                    elementGroupHTML = fs.readFileSync(`${baseFolder}/element-groups/${newElGroupName}/${rowEnding}/index.css.html`, 'utf8');
                    makeRowScheme();
                    HTMLAction('import', rows, newElGroupLibId, elementGroupHTML);
              }
              else{
                let row_reg =  new RegExp("(\\n[/]{0,2}@import)((?:(?!@import)(?!" + newElGroupLibId + ")(?:\\w|\\W))*)(" + newElGroupLibId + "[^;]*;)(/\\\*[^*]+\\\*/)?");            
                newActiveRow = '\n//' + newActiveRow.substring(0, newActiveRow.lastIndexOf(';') + 1) + "/*???*/";
    
                let match = scssContent.match(row_reg);
                scssContent = scssContent.substr(0, match.index) + newActiveRow + scssContent.substr(match.index + match[0].length);
                console.log('\n>>>>>>\nA ' + newElGroupLibId + ' azonosítójú elem csoporthoz nem tartozik --- ' + rowEnding + ' --- típusú változat!\n>>>>>>\n');;                
              }

          }else{
            /* az aktívvá tett sor végén nem adta meg, vagy hülyeséget adott meg arra, hogy 
            *  az adott elem csoportnak melyik változatát szeretné importálni az index.css.html fájlba. 
            */
            let row_reg =  new RegExp("(\\n[/]{0,2}@import)((?:(?!@import)(?!" + newElGroupLibId + ")(?:\\w|\\W))*)(" + newElGroupLibId + "[^;]*;)(/\\\*[^*]+\\\*/)?");            
            newActiveRow = '\n//' + newActiveRow.substring(0, newActiveRow.lastIndexOf(';') + 1) + "/*???*/";

            let match = scssContent.match(row_reg);
            scssContent = scssContent.substr(0, match.index) + newActiveRow + scssContent.substr(match.index + match[0].length);
            console.log('\n>>>>>>\nA ' + newElGroupLibId + ' azonosítójú sor végén a 3 kérdőjel helyére írd be, az elem csoport melyik változatát akarod importálni! (TD|DIV|BOTH)\n>>>>>>\n');
            
          }
        }
      }
      else {
        /* a.) átrendezte a sorokat
        *  b.) VAGY, pl.: beírta a kommentelt sor végére a DIV / TD / BOTH hiányzó infót
        *  Nem akarom, hogy a kommentelt sorok mozgatására, vagy a b.) - esetben is folyton beinduljon az API!
        */
        let changedPos = false;
  
              activeRows.forEach((sor, i) => {
                let libid = sor.match(/libid_\d{3}_\d{3}/)[0];
                let curPos = activesInContainers.findIndex((row) => {
                  return row.indexOf(libid) > -1;
                });
                let prevPos = prevActivesInContainers.findIndex((line) => {
                  return line.indexOf(libid) > -1;
                });
                if (curPos != prevPos) {
                  changedPos = true;
                }
              });
        /*Tehát csak azok a változások az érdekesek, 
        * amikor valamelyik aktív sor pozíciója változott,
        * magyarán átrendezte az aktív sorokat!
        */
              if (changedPos === true) {                 
                makeRowScheme();
                HTMLAction('reorder', rows);
              }
      }
}
    else{
      console.log("behúzott egy új mappát");
      /*Behúzta egy ÚJ elem csoport mappáját az element-groups mappa alá, és a hozzá rendelt
      * figyelő erre hozzá adott egy új KOMMENTELT sort a style.scss fájlhoz, ezért a korábbi állapothoz
      * képest nem egyezik a kikommentelt + aktív sorok száma!
      * VAGY: fizikailag kitörölt egy a.) aktív, vagy b.) egy kommentelt sort
      */
      
    }

    fs.writeFileSync(baseFolder +'/scss/style.scss', scssContent);
    readWriteSettings("scssContent", scssContent);
};

let eventAnalyst = (filePath, force = false) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const md5Current = md5(content.replace(/[\s\n]+/g, ''));
  resetDefaults();
  scssContent = content;

  if (md5Previous === md5Current) {
    return;
  } else {
    md5Previous = md5Current;
    const isEditable = readWriteSettings('isEditable');

    if(!isEditable){
      readWriteSettings('isEditable', true);      
    }

    if (force === true) {
      console.log("kiszállok, mert force == true");    
      saveStatus();
      return;
    }else{
      processRowData({"content" : content, "force" : force});
      if(force === false){
            actOnEvent();          
      }
    }
  }
};
module.exports = eventAnalyst;