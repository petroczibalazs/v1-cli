const readline = require('readline');
const interface = readline.createInterface(process.stdin, process.stdout);
const HUB = require('./index');

interface.question('\nChoose one of these:\n   m = markers\n   h = HTML\n   d = development\n : ', (API) => {
  API = API == 'm'? 'markers' : API == 'h'? 'HTML' : API == 'd'? 'development' : 'default';
  if(API == "markers"){

    interface.question("\nChoose one of these:\n   s = show\n   h = hide\n : ", (option) => {
      option = option == 's'? 'show' : option == 'h'? 'hide' : 'nonsense';
      
      if(option == 'show'){

        const fs = require('fs');
        const settings = require('./readMarkerSchemes');
        let schemes = settings();
        let keys = Object.keys(schemes);

        interface.question("Choose one of these:\n   d = default\n   m = Monte Carlo\n : ",
         (answer) => {
            answer = answer == 'd'? 'default': answer == 'm'? 'monte_carlo' : 'nonsense';
            
            if(keys.findIndex(value => value == answer) >= 0){

              let obj = schemes[answer];
              HUB(API, option, obj);
            }
            else{
              console.log('Wrong choice: ' + answer);
              process.exit();
            }
          });
      }
      else{
            HUB(API, option);
      }
  });
}  
  else if(API == "development"){

    interface.question("\nChoose one of these:\n   c = continue\n   f = finish\n : ", (option) => {
      option = option == 'c'? 'continue' : option == 'f'? 'finish' : 'default';
      HUB('css', option);
    });
          
}else if(API == "HTML"){

  interface.question("\nChoose one of these:\n   m = maintenance\n   e = export\n   i = import\n   d = delete\n   o = reorder\n    r= reset\n : ", (option) => {
    option = option == 'm'? 'maintenance' : option == 'r'?  'reset' : 'default';
    HUB(API, option);
    process.exit();
  });
        
}
 else{

  console.log("Nonsense command! : " + API);
  process.exit();
}
});

const fs = require('fs');

