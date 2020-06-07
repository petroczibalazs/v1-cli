
const fs = require('fs');
const readWriteSettings = require('./readWriteSettings');
const baseFolder = readWriteSettings('baseFolder');

const reNumber = (sameFolder, newFolder) => {

    let libid = sameFolder.match(/libid_(\d{3})_(\d{3})/);    
       
    let nextOrdinal =  parseInt(libid[2].replace(/^0+/, '')) + 1;
        nextOrdinal =  (nextOrdinal < 10 ? '00': nextOrdinal < 100 ? '0' : '') + nextOrdinal;
        let digits = libid[1] + '_' + nextOrdinal;
        libid  =  'libid_' + libid[1] + '_' + nextOrdinal;

    let renamedNewFolder = newFolder.replace(/libid_\d{3}_\d{3}/, libid).replace(/\s*copy\(\d+\)\s*$/, '');

    if(fs.existsSync(baseFolder + '/' + 'element-groups' + '/' + newFolder)){
        fs.renameSync(`${baseFolder}/element-groups/${newFolder}`, `${baseFolder}/element-groups/${renamedNewFolder}`);
    }
    
    ['TD', 'DIV', 'BOTH'].forEach((folder) => {

        folder = `${baseFolder}/element-groups/${renamedNewFolder}/${folder}`;

        if(fs.existsSync(folder)){

            let HTML = fs.readFileSync(folder + '/' + 'index.css.html', 'utf8');
            HTML = HTML.replace(/libid_\d{3}_\d{3}/g, libid);
            HTML = HTML.replace(/_\d{3}_\d{3}\.(png|jpg|gif)/g, '_' + digits + '.$1');
            fs.writeFileSync(folder + '/' + 'index.css.html', HTML);
        }
    });

    let scssFile = `${baseFolder}/element-groups/${renamedNewFolder}/meta-data/_style.scss`;    

    if(fs.existsSync(scssFile)){
        let scssContent = fs.readFileSync(scssFile, 'utf8');
            scssContent = scssContent.replace(/[$]libid\s*:\s*['"]\s*libid_\d{3}_\d{3}\s*['"]/, '$libid : ' + "'" + libid + "'");
        fs.writeFileSync(scssFile, scssContent);
    }

    let picsFolder = `${baseFolder}/element-groups/${renamedNewFolder}/pics`;

    if(fs.existsSync(picsFolder)){

        fs.readdirSync(picsFolder).forEach((pic) => {
            if(pic.match(/_\d{3}_\d{3}\.(gif|png|jpg)$/)){
                let picName = pic.match(/^((?:\w|\W)+?_+)(\d{3}_\d{3})\.(gif|png|jpg)$/);
                let newPicName = `${picName[1]}${digits}.${picName[3]}`;
                fs.renameSync(picsFolder + '/' + pic, picsFolder + '/' + newPicName);
            }
        });
    }
};


const actOnEvent = (curFolders) => {
const prevFolders = readWriteSettings('elementGroups');


if(curFolders.length > prevFolders.length){    
        let newFolder = curFolders.filter( folderName => prevFolders.indexOf(folderName) == -1);
        let newFolderLibId = newFolder[0].match(/libid_(\d{3})_\d{3}/);

        if(newFolderLibId != null){
/*Ha egy element group foldert húzott be, mert csak ezek használhatók bármire..*/
            let libidDigits = newFolderLibId[1];
            const group_id = 'libid_' + libidDigits;

           let sameGroups = prevFolders.filter((folderName) => {
               return folderName.indexOf(group_id) > -1;
           });

           if(sameGroups.length > 0){
                if(sameGroups.length == 1){
                    reNumber(sameGroups[0], newFolder, newFolderLibId);

                }else{

                    sameGroups.sort((a, b) => {
                         let x = parseInt(b.match(/libid_\d{3}_(\d{3})/)[1].replace(/^0+/, ''));
                         let y = parseInt(a.match(/libid_\d{3}_(\d{3})/)[1].replace(/^0+/, ''));
                         return x - y;
                    });
                    
                    reNumber(sameGroups[0], newFolder[0], newFolderLibId);
                }
           }
        }
    }
};



const eventAnalyst = function(elementGroupsFolder, bool, eventName){

    if(eventName === 'rename'){
        return;
    }
    console.log('Real change event occured');
    const curFolders = [];
    fs.readdirSync(elementGroupsFolder).forEach((aName) => {
        if(fs.statSync(elementGroupsFolder + '/' + aName).isDirectory()){
            curFolders.push(aName);
        }
    });

    if(bool === true) {    
        readWriteSettings('elementGroups', curFolders);
        return;

    }else{
        actOnEvent(curFolders);
    }
    //console.log(curFolders);
};


module.exports = eventAnalyst;