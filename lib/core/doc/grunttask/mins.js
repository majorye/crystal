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
    grunt.log.writeln('Author: zhouquan.yezq(骁勇) Alibaba-inc')
    grunt.log.writeln('+++++++++++++++++start mins file for every module +++++++++++++++ "');
    var dirList = fs.readdirSync(path.normalize('./'+this.file.src));
    var me=this;

    var _process=function(_name,_path){
        if(fs.statSync(_path+'/'+_name).isDirectory() && _name!==".svn"){
          var dirList = fs.readdirSync(path.normalize(_path+'/'+_name));
          var _path=_path+'/'+_name;
          dirList.forEach(function(item){
                _process(item,_path);
          });
        }else if(fs.statSync(_path+"/"+_name).isFile()){
           if(/^\w+.js$/.test(_name)){
                grunt.log.writeln("file name:"+_name);
                var files = grunt.file.expandFiles(_path + '/'+_name);
                var max = grunt.helper('concat', files, {separator: me.data.separator});
                var min = grunt.helper('uglify', max, grunt.config('uglify'));
                grunt.log.writeln("min file name:"+_path + '/' +_name.split(".js")[0]+"-min.js")
                grunt.file.write(_path + '/' + _name.split(".js")[0]+"-min.js", min);
            }
        }
    };

    _process(this.file.src,'.');

    grunt.log.writeln('+++++++++++++++++End mins file for every module+++++++++++++++ "');

    // Fail task if errors were logged.
    if (this.errorCount) { return false; }

  });
};

