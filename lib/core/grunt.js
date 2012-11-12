module.exports = function(grunt) {

  grunt.initConfig({
      concat: {
        dist: {
          src: ['source/class.js', 'source/pubsub.js', 'source/logging.js','source/model.js','source/system.js','source/network.js'],
          dest: 'dist/core.js',
          separator: ';'
        }
      },
      min: {
        dist: {
          src: ['dist/core.js'],
          dest: 'dist/core.min.js'
        }
      },
      uglify: {
      mangle: {toplevel: true},
      squeeze: {dead_code: false},
      codegen: {quote_keys: true}
     }
  });

  grunt.registerTask('default', 'concat min');

};