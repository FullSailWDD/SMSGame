module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    wiredep:
      target:
        src: [
          'www/index.html',
        ]

    connect:
      server:
        options:
          port: 5080
          base: 'www'
          hostname: 'localhost'
          livereload: 35729


    coffee:
      complie:
        options:
          bare: true
        files:
          'www/js/app.js': ['pre/coffee/{,*/}*.coffee']

    sass: {
      dist:{
        files:{
          'www/css/app.css': 'pre/sass/app.sass'
        }
      }
    }

    watch:
      options:
        livereload: true
      sass:
        files: 'pre/**/*.sass'
        tasks: ['sass']


      coffee:
        files: 'pre/**/*.coffee'
        tasks: ['coffee']

      html:
        files: 'www/**/*.html'





  grunt.loadNpmTasks 'grunt-wiredep'
  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-sass'

  grunt.registerTask 'default',[
    'wiredep'
    'connect'
    'watch'
  ]
