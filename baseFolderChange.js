
const fse = require('fs-extra');
const fs = require('fs');
const readWriteSettings = require('./readWriteSettings');
const baseFolder = readWriteSettings('baseFolder');


const reNumber = (sameFolder, newFolder) => {

    if(sameFolder == null){
        console.log("sameFolder is NULL");
        let digs = newFolder.match(/libid_(\d{3})_(\d{3})/);
        sameFolder = `libid_${digs[1]}_000`;
        
        console.log("sameFolder after: " + sameFolder);
    }

    let libid = sameFolder.match(/libid_(\d{3})_(\d{3})/);       
    let nextOrdinal =  parseInt(libid[2].replace(/^0{0,2}/, '')) + 1;
        nextOrdinal =  (nextOrdinal < 10 ? '00': nextOrdinal < 100 ? '0' : '') + nextOrdinal;
    let digits = libid[1] + '_' + nextOrdinal;
        libid  =  'libid_' + libid[1] + '_' + nextOrdinal;

    let renamedNewFolder = newFolder.replace(/libid_\d{3}_\d{3}/, libid).replace(/\s*copy\(\d+\)\s*$/, '');

    if(fs.existsSync(baseFolder + '/' + 'tranzit' + '/' + newFolder)){
        fs.renameSync(`${baseFolder}/tranzit/${newFolder}`, `${baseFolder}/tranzit/${renamedNewFolder}`);
    }
    
    ['TD', 'DIV', 'BOTH'].forEach((folder) => {

        folder = `${baseFolder}/tranzit/${renamedNewFolder}/${folder}`;

        if(fs.existsSync(folder)){

            let HTML = fs.readFileSync(folder + '/' + 'index.css.html', 'utf8');
            HTML = HTML.replace(/libid_\d{3}_\d{3}/g, libid);
            HTML = HTML.replace(/_\d{3}_\d{3}\.(png|jpg|gif)/g, '_' + digits + '.$1');
            fs.writeFileSync(folder + '/' + 'index.css.html', HTML);
        }
    });

    let scssFile = `${baseFolder}/tranzit/${renamedNewFolder}/meta-data/_style.scss`;    

    if(fs.existsSync(scssFile)){
        let scssContent = fs.readFileSync(scssFile, 'utf8');
            scssContent = scssContent.replace(/[$]libid\s*:\s*['"]\s*libid_\d{3}_\d{3}\s*['"]/, '$libid : ' + "'" + libid + "'");
        fs.writeFileSync(scssFile, scssContent);
    }

    let picsFolder = `${baseFolder}/tranzit/${renamedNewFolder}/pics`;

    if(fs.existsSync(picsFolder)){

        fs.readdirSync(picsFolder).forEach((pic) => {
            if(pic.match(/_\d{3}_\d{3}\.(gif|png|jpg)$/)){
                let picName = pic.match(/^((?:\w|\W)+?_+)(\d{3}_\d{3})\.(gif|png|jpg)$/);
                let newPicName = `${picName[1]}${digits}.${picName[3]}`;
                fs.renameSync(picsFolder + '/' + pic, picsFolder + '/' + newPicName);
            }
        });
    }
/*
*   Most tudom átmásolni a tranzit folderből az element-groups folderbe az újonnan átnevezett elem csoport mappát!
*/

    if(!fs.existsSync(`${baseFolder}/element-groups/${renamedNewFolder}`)){
        fs.mkdirSync(`${baseFolder}/element-groups/${renamedNewFolder}`, { recursive: true });
    }

    //copy directory content including subfolders
    fse.copy(`${baseFolder}/tranzit/${renamedNewFolder}`, `${baseFolder}/element-groups/${renamedNewFolder}`, function (err) {
        if(err) {
            console.log(err);
        }
    });

    let centralScss = `${baseFolder}/scss/style.scss`;
    if (fs.existsSync(centralScss)){

        let scssContent = fs.readFileSync(centralScss, 'utf8');
            scssContent = scssContent.replace(/(\s|\n)+$/, '');
            scssContent = scssContent + `\n//@import '../element-groups/${renamedNewFolder}/meta-data/style';/*###*/`;
        fs.writeFileSync(centralScss, scssContent);
    }

    let curFolders = getFolders();
    readWriteSettings('elementGroups', curFolders);
};

const actOnEvent = (curFolders) => {
const prevFolders = readWriteSettings('elementGroups');

if(curFolders.length > prevFolders.length){    
        let newFolder = curFolders.filter( folderName => prevFolders.indexOf(folderName) == -1);
        let newFolderLibId = newFolder[0].match(/libid_(\d{3})_\d{3}/);

        if(newFolderLibId != null){
/*Ha tényleg egy element group foldert húzott be, mert csak ezek használhatók a célomnak megfelelően ...*/
            let libidDigits = newFolderLibId[1];
            const group_id = 'libid_' + libidDigits;

           let sameGroups = prevFolders.filter((folderName) => {
               return folderName.indexOf(group_id) > -1;
           });

           if(sameGroups.length > 0){
                if(sameGroups.length == 1){
                    reNumber(sameGroups[0], newFolder[0], newFolderLibId);

                }else{

                    sameGroups.sort((a, b) => {
                         let x = parseInt(b.match(/libid_\d{3}_(\d{3})/)[1].replace(/^0+/, ''));
                         let y = parseInt(a.match(/libid_\d{3}_(\d{3})/)[1].replace(/^0+/, ''));
                         return x - y;
                    });
                    
                    reNumber(sameGroups[0], newFolder[0], newFolderLibId);
                }
           }else{
                    reNumber(null, newFolder[0]);
           }
        }
    }else{
        /*
        törölt egy mappát az element-groups alól, de erre nem akarok reagálni
        */       
    }
};

const getFolders = () => {
    const elementGroupsFolder = baseFolder + '/element-groups';
    const tranzitFolder = baseFolder + '/tranzit';

    const curFolders = [];
    fs.readdirSync(elementGroupsFolder).forEach((aName) => {
        if(aName.match(/libid_\d{3}_\d{3}/) && fs.statSync(elementGroupsFolder + '/' + aName).isDirectory()){
            curFolders.push(aName);
        }
    });
    fs.readdirSync(tranzitFolder).forEach((aName) => {
        if(aName.match(/libid_\d{3}_\d{3}/) && fs.statSync(tranzitFolder + '/' + aName).isDirectory()){
            curFolders.push(aName);
        }
    });
    return [...new Set(curFolders)];
};

const eventAnalyst = function(tranzit, bool, eventName){

    const curFolders = getFolders();

    if(bool === true) {    
        readWriteSettings('elementGroups', curFolders);
        return;

    }else{
        actOnEvent(curFolders);
    }

};


module.exports = eventAnalyst;