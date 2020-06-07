const {
	src, 
	dest, 
	parallel, 
	series, 
	watch
} = require('gulp');

const gulp		  = require('gulp');
const browserSync = require('browser-sync').create();
const sass        = require('gulp-sass');
const sourceMaps  = require('gulp-sourcemaps');
const cleanCSS    = require('gulp-clean-css');
const replace     = require('gulp-replace');
const groupMediaQueries = require('gulp-group-css-media-queries');
const mergeStream = require('merge-stream');
const fs = require('fs');


//compile SCSS
function scss(){

	return src(['src/' + mappa + '/dist/scss/*.scss'])
	.pipe(sourceMaps.init())
	.pipe(sass().on('error', sass.logError))
	.pipe(groupMediaQueries())	
	.pipe(cleanCSS({
		format : 'beautify',
		level: {

			    1: {
			    	all: true,
				    semicolonAfterLastProperty: true,
				    tidySelectors: true
			      },
				2 : {						
						removeDuplicateRules : true,
						mergeSemantically: true,
						restructureRules: true,
						mergeMediaQueries : true,
						mergeNonAdjacentRules: true
				    }
		       }		
	}))
	.pipe(replace('!important', ' !important'))
	.pipe(replace(/[\s\n]*\*\/\/\*\!/g, ''))
	.pipe(replace(/(@media(\s|\n)*IGNORE[^{]*?{)(((?!}[\s\n]*})(\w|\W))*)(})(\s|\n)*(})/g, '$1\n\/*\n<style type="text/css" ignore="1">\n$2$3$6\n</style>\n*\/\n$8'))
	.pipe(replace(/((?!;)(?!(\s|\n))(?![\/*}]+)(\w|\W))([\s\n]+})/g, '$3;$4'))
	.pipe(sourceMaps.write('.'))
	.pipe(dest('src/' + mappa + '/dist/css'))
	.pipe(browserSync.stream())
};


// watch and serve
function serve(path = null){

	const err_msg = `----------  ERROR! WRONG SYNTAX OR NO SUCH DIRECTORY ----------------\nYou should call gulp with this syntax:
	gulp --mappa=mappaNeve - where mappaNeve equals with one of the existing sub-folders.\n ---------------------------------- `;
	

	let dir = fs.existsSync('./src/' + path);
	
	if(!dir){
		console.log(err_msg);
		process.exit();
		return;
	}


console.log('Serve task was called');
console.log('Current mappa: ' + dir);
		  	browserSync.init({
				  	  server : {
				  	  				baseDir: './src/' + path + '/dist',
				  	  				index  : 'index.css.html'
				  	           } 				  	  
				  	});
			   scss();

			 watch('./src/' + path + '/dist/scss/*.scss', scss);
		     watch('./src/' + path + '/dist/element-groups/**/meta-data/*.scss', scss);
			 watch('./src/' + path + '/dist/*.html').on('change', browserSync.reload);
		  };

// default task
module.exports = serve;


