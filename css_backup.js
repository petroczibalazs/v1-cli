const fs = require('fs');
const settings = require('./readWriteSettings');
const baseFolder = settings('baseFolder');
let html_content = fs.readFileSync(baseFolder + '/index.css.html', 'utf8');
let css_content = fs.readFileSync(baseFolder + '/css/style.css', 'utf8');

/*  --------------- ----------------------------- ---------------------- -------------------------------
-----------------------------------------   COPY CSS TO HTML  ----------- ------------------------------- 
--------------- ----------------------------- ---------------------- ----------------------------------- */
const charsetRegExpText = "^((?:(?!@charset)(\\w|\\W))*)@charset\\s+\"UTF-8\";";
const sourceMappingRegExpText = "^((?:(?!\/\\\\*\\s*#\\s*sourceMappingURL)(\\w|\\W))*)\/\\\*\\s*#\\s*sourceMappingURL[^*]*?\\\*\/";
const mediaRegExpText = "^((?:(?!@media)(\\w|\\W))*)(@media\\s+\\w+?\\s+and\\s+)(\\\([^:]+?:[^)]+\\\)[\\s\\n]*\\\{)((?:(?!\\\}[\\n\\s]*\\\})(\\w|\\W))*)(\\\}[\\s\\n]*\\\})";
/*
$1 = minden, ami a media query előtt van; 
$3 = media at rule, és media type részek; 
$4 = media condition rész; 
$5 = a media query-n belüli style declarations; 
$7 = a dupla záró kapcsos zárójelek
*/
const mediaIGNORERegExpText = "^((?:(?!@media\\s+IGNORE)(\\w|\\W))*)(@media\\s+IGNORE[^{]+)\\\{[\\s\n]*\/\\\*[\\s\\n]*((?:(?!<\/style>)(\\w|\\W))*)(<\/style>)[\\s\\n]*\\\*\/[\\s\\n]*\\\}";
/*
$1 = az összes az IGNORE media query előtti rész; 
$4,$6 = az ignore stylesheet részei
*/
const keyFramesRegExpText = "^((?:(?!@keyframes\\s+TWIGES\\s*)(\\w|\\W))*)(@keyframes\\s+TWIGES[\\s\\n]*\\\{[\\s\\n]*from[\\s\\n]*\\\{[\\s\\n]*\/\\\*\\\![\\s\\n]*)(<meta\\s+name=\"edima-json\")((?:(?!\\\*\/)(\\w|\\W))*)((?:(?!\\\}[\\s\\n]*\\\})(\\w|\\W))*)\\\}[\\s\\n]*\\\}";
/*
$1 = minden, ami a @keyframes rule előtt szerepel; 
$3 = a @keyframes at rule; 
$4,$5 = a bele tett meta tag
*/

/*  --------------- ----------------------------- ---------------------- -------------------------------
-----------------------------------------   DELETE CSS FROM HTML  ------------------------------------------ 
--------------- ----------------------------- ---------------------- ----------------------------------- */
const OLStylesheetRegExpText = "^(((?!<\\\!--\\s*\\\[if[^\\\]]+\\\]\\s*>[\\s\\n]*<style\\s+type=\"text/css\")(\\w|\\W))*)(<\\\!--\\s*\\\[if[^\\\]]+\\\]\\s*>[\\s\\n]*<style(\\w|\\W)*?<\\\!\[endif\\\][\\s\\n]*-->)";
/*
$1 = a feltételes kommentbe tett stylesheet előtt minden; 
$4 = az egész feltételes megjegyzésbe tett stylesheet 
*/
const styleSheetRegExpText = "^(((?!<style\\s+type=\"text/css\")(\\w|\\W))*)(<style(\\w|\\W)*?</style>)";
/*
$1 = minden ami a stylesheetet megelőzi; 
$4 = a teljes stylesheet 
*/
const metaRegExpText = "^(((?!<meta\\s+name=\"edima-json\")(\\w|\\W))*)(<meta\\s+name=\"edima-json\"(\\w|\\W)*?>)";
/*
$1 = minden ami a speciális meta tag előtt van; 
$4 = a teljes speciális meta tag 
*/

/*  --------------- ----------------------------- ---------------------- -------------------------------
----------------------------------------- A LINK TAG REGEXP-jei ------------------------------------------ 
--------------- ----------------------------- ---------------------- ----------------------------------- */
const commentedLinkRegExpText = "<\\\!--[\\n\\s]*(<link\\s*rel=\"stylesheet\"(\\w|\\W)*?>)[\\n\\s]*-->";
const linkRegExpText          = "<link\\s*rel=\"stylesheet\"(\\w|\\W)*?>";
const LINK                    = "<link rel=\"stylesheet\" href=\"css/style.css\">";
const INACTIVE_LINK           = "<!--\n <link rel=\"stylesheet\" href=\"css/style.css\">\n-->";


const CSSregTexts = [
  { mit: charsetRegExpText,        melyik: "charset"     },
  { mit: sourceMappingRegExpText,  melyik: "sourceMap"   },
  { mit: mediaIGNORERegExpText,    melyik: "media_ignore"},
  { mit: mediaRegExpText,          melyik: "media_query" },
  { mit: keyFramesRegExpText,      melyik: "keyframes"   }
];

const HTMLregTexts = [
  { mit: OLStylesheetRegExpText,   melyik: "OLStylesheet" },
  { mit: styleSheetRegExpText,     melyik: "Stylesheet"   },
  { mit: metaRegExpText,           melyik: "metaTag"      },
  { mit: "",                       melyik: "END_MARKER"   }
];

let curRegTexts = [];
let queries_rules = ""; /* ide gyűjtöm, átmenetileg, az index.css fájlból kigyűjtött media query-ket, és szabályokat*/
let meta_tags     = ""; /* ide gyűjtöm, átmenetileg, az index.css fájlból kigyűjtött speciális meta tageket */


let STORAGE = {},
    COUNTER = 0,
    BLP_STYLESHEET = false;

const getPlaceHolder = () => {
  let PLACEHOLDER = `__PLACEHOLDER${COUNTER}__`;
  COUNTER++;
  return PLACEHOLDER;
};
const getStyleSheet = (contents) => {
  let sheet = `\n<style type="text/css">\n${contents}\n</style>`;
  return sheet;
};
const fillPlaceholders = () => {
  for (let j in STORAGE) {
    if (html_content.indexOf(j) > -1) {
      html_content = html_content.replace(j, `\n${STORAGE[j]}\n`)
    }
  }
};
const toggleLink = (bool) => {
/*
* a biztonság kedvéért először mindenképpen törölni kell
* az esetlegesen az index.css.html fájlban lévő
* kikommentelt <link taget
*/
  let reg = new RegExp(commentedLinkRegExpText);
  html_content = html_content.replace(reg, LINK);

  if (!bool) {
    reg = new RegExp(linkRegExpText);
    html_content = html_content.replace(reg, INACTIVE_LINK);
  }
};
const insertCSSContent = (CSSContent) => {

  let index = html_content.indexOf(LINK);
  if (index > -1) {
    html_content = html_content.substring(0, index) + CSSContent + LINK + html_content.substr(index + LINK.length);
  }
};

let reg = null,
  cur = '',
  copy = '',
  temp = '',
  match = null,
  leng = 0;

cur = html_content;

const transform = () => {

  for (let t = 0; t < curRegTexts.length; t++) {

    if (curRegTexts[t].melyik == 'END_MARKER') {
      /*
      * egyszerű jelölő, hogy el tudjam végezni a szükséges váltásokat
      * mielőtt a feldolgozás során áttérhetnék a html fáljlon történő
      * változtatásokról a css fájlon történőkre - mivel azt a megoldást
      * választottam, hogy egyetlen folytonos iterációban dolgozom
      */
      html_content = copy;
      cur = '';
      copy = css_content;
      css_content = "";
      continue;
    }

    reg = new RegExp(curRegTexts[t].mit);

    if (t > 0) {
      cur = copy;
      copy = "";
    }

    while (cur.length > 0) {

      match = cur.match(reg);

      if (match != null) {

        temp = cur.substr(0, match.index + match[0].length);
        leng = temp.length;

        switch (curRegTexts[t].melyik) {

          case "OLStylesheet":
            let placeholder = getPlaceHolder();
            copy += match[1] + placeholder;
            STORAGE[`${placeholder}`] = match[4];
            break;

          case "Stylesheet":
            if (BLP_STYLESHEET == false) {
              copy += match[1] + match[4];
              BLP_STYLESHEET = true;
            } else {
              copy += match[1];
            }
            break;

          case "metaTag":
            copy += match[1];
            break;

          case "charset":
          case "sourceMap":
            copy += match[1];
            break;

          case "media_ignore":
            copy += match[1];
            css_content += match[4] + match[6];
            break;

          case "media_query":
            copy += match[1];
            if (match[4].indexOf('10px') == -1) {
              queries_rules += '\n' + match[3] + match[4] + match[5] + match[7] + '\n';
            }
            break;

          case "keyframes":
            copy += match[1];
            meta_tags += '\n' + match[4] + match[5] + '\n';
            break;
        }

        cur = cur.substr(leng);
        temp = "";
      } else {
        copy += cur;
        cur = "";
      }
      reg = new RegExp(curRegTexts[t].mit);
    }
  }
  return true;
};

const action = (option) => {

  toggleLink(true);
console.log("option: " + option);
  if (option == 'finish') {
    curRegTexts = [...HTMLregTexts, ...CSSregTexts];

  } else {
    curRegTexts = [...HTMLregTexts];
  }
  transform();
  fillPlaceholders();
  toggleLink(true);
  html_content = html_content.replace(/[\n\s]+\n/g , '\n');
  
  if (option == 'finish') {
  
    css_content += (getStyleSheet(copy + '\n' + queries_rules) + meta_tags);
    css_content = css_content.replace(/\n\s*\n/g, '\n');
    insertCSSContent(css_content);
    toggleLink(false);

    fs.writeFileSync(baseFolder + '/index.css.html', html_content);
    //process.exit();
  } else {
    fs.writeFileSync(baseFolder + '/index.css.html', html_content);
  }
  return;
}
module.exports = action;