/**
* @author: zhouquan.yezq
* @description: mini the js file of all the modules/ais.modulName/module.js
*/

module.exports = function(grunt) {

  // External libs.
  var path = require('path'),
    fs = require('fs');

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('mins', 'Minify files with UglifyJS.', function() {
    var files = grunt.file.expandFiles(this.file.src);
    grunt.log.writeln('+++++++++++++++++start mins file for every module+++++++++++++++ "');
    var dirList = fs.readdirSync(path.normalize('./'+this.file.src));
    var me=this;
    dirList.forEach(function(item){
          if(fs.statSync(me.file.src + '/' + item).isDirectory() && item!==".svn"){
            var _dir=fs.readdirSync(path.normalize('./')+me.file.src+"/"+item);
            grunt.log.writeln("current dir:"+path.normalize('./'+item));
            _dir.forEach(function(e){
              if(fs.statSync(path.normalize('./')+me.file.src+"/"+item+"/"+e).isFile()){
               //grunt.log.writeln("file name:"+e);
                if(/^\w+.js$/.test(e)){
                    grunt.log.writeln("file name:"+e);
                    var files = grunt.file.expandFiles(me.file.src + '/' + item+"/"+e);
                    var max = grunt.helper('concat', files, {separator: me.data.separator});
                    var min = grunt.helper('uglify', max, grunt.config('uglify'));
                    grunt.log.writeln("min file name:"+me.file.src + '/' + item+"/"+e.split(".js")[0]+"-min.js")
                    grunt.file.write(me.file.src + '/' + item+"/"+e.split(".js")[0]+"-min.js", min);
                }
                //todo , to min other js file ,not just for module.js 
              }
              //grunt.log.writeln("file name:"+e);
            })
           
          }
    });
    grunt.log.writeln('+++++++++++++++++End mins file for every module+++++++++++++++ "');

    // Fail task if errors were logged.
    if (this.errorCount) { return false; }

  });
};

