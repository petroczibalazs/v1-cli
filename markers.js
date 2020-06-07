const fs = require('fs');
let settings = require('./readWriteSettings');
let baseFolder = settings('baseFolder');

//let html_content  = fs.readFileSync(baseFolder + '/index.css.html', 'utf8');

const getParams = (color = "#ffffff", bgColor = "#1d0642", height = "60px", lineHeight = "60px", fontSize = "22px") => {
      return {
          'color'     : color,
          'bgColor'   : bgColor,
          'height'    : height,
          'lineHeight': lineHeight,
          'fontSize'  : fontSize
      }
};

const getTemplate = (libid, color, bgColor, height, lineHeight, fontSize) => {

let template = `<div data-elem="marker" style="height: ${height}; line-height: ${height}; color: ${color}; background-color: ${bgColor}; text-align:center; ">
<span style="font-size: ${fontSize}; vertical-align: middle;">${libid}</span>
</div>`;
  return template;
};


const elGroupRegExpText = "^((?:(?!<table[^>]*?class=\"[^\"]*?libid_\\d{3}_\\d{3})(\\w|\\W))*)(<table[^>]*?class=\"[^\"]*?)(libid_\\d{3}_\\d{3}_)(DIV|TD|BOTH)((?:(?!<table[^>]*?class=\"[^\"]*?libid_\\d{3}_\\d{3})(\\w|\\W))*)";
const markerDivRegExpText = "^((?:(?!<div[^>]*?data-elem=\"marker\")(\\w|\\W))*)(<div[^>]*?data-elem=\"marker\")((\\w|\\W)*?)(<\/div>)";
/*
$1 = minden a div előtt, 
($3, $4, $6) = a marker div részei
*/

let reg   = null,
    cur   = '',
    copy  = '',
    temp  = '',
    match = null,
    leng  = 0;


const regTexts = [
  { mit: markerDivRegExpText, melyik: "marker_div"},
  { mit: elGroupRegExpText,   melyik: "element_group"}  
];

const transform = (txt, color, bgColor, height, lineHeight, fontSize, toDo) => {

  cur = txt;
  for(let t = 0; t < regTexts.length; t++){
    
    if(toDo == 'delete' && t == 1){
      continue;
    }
    reg = new RegExp(regTexts[t].mit);

        if(t > 0){
            cur = copy;
            copy = "";
        }

        while(cur.length > 0){
            
            match = cur.match(reg);

            if(match != null){

               temp = cur.substr(0, match.index + match[0].length);
               leng = temp.length;

               switch (regTexts[t].melyik){

                    case "element_group":
                      copy += match[1].replace(/\n{2,}$/, '') + getTemplate(match[4]+ match[5], color, bgColor, height, lineHeight, fontSize) + '\n' + match[3] + match[4] + match[5] + match[6];
                    break;

                    case "marker_div":
                      copy += (match[1]).replace(/\n{2,}$/, '');
                    break;
               }

               cur = cur.substr(leng);
               temp = "";                                                   
            }
            else
            { 
                copy += cur;
                cur = "";
            }
            reg = new RegExp(regTexts[t].mit); 
        }                   
}
 return copy;
};

const action = (toDo, color, bgColor, height, lineHeight, fontSize) => {

  let v = getParams(color, bgColor, height, lineHeight, fontSize);
  let html_content  = fs.readFileSync(baseFolder + '/index.css.html', 'utf8');
  html_content = transform(html_content, v.color, v.bgColor, v.height, v.lineHeight, v.fontSize, toDo);
  
  if(toDo == 'add'){
    settings("markers", true);
  }else{
    settings("markers", false);
  }
  fs.writeFileSync(baseFolder + '/index.css.html', html_content);
}


module.exports = action;