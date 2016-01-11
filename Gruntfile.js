

module.exports = function (grunt) {
    
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    
    var p = {
        dev: 'src/',
        temp: 'www_temp/',
        www: 'www/build/',
        dist: 'dist/'
    };
    var c = {
        dist: {
            concat: p.temp+'ngTouch.js',
            dist: p.dist+'ngTouch.min.js',
            build: p.www+'ngTouch.min.js'
        }
    };
    
    // Project configuration.
    grunt.initConfig({
        clean:{
            build:[p.www,p.dist],
            temp:[p.temp]
        },
        concat:{
            dist:{
                src:[
                    //p.dev+ 'prefix.txt',
                    p.dev+ 'touch.js',
                    p.dev+ 'swipe.js',
                    p.dev+ 'directive/**'
                    //p.dev+ '**',
                    //p.dev+ 'sufix.txt'
                ],
                dest: c.dist.concat
            }
        },
        uglify:{
            dist:{
                files: [{
                    //expand: true,
                    //cwd: p.dev+'build',
                    src:[ c.dist.concat ],
                    dest: c.dist.build
                }]
            }
        },
        copy:{
            dist:{
                files:[{
                    src: c.dist.build,
                    dest: c.dist.dist
                }]
            }
        }
    });
    
    
    
    grunt.registerTask('default',['clean','concat','uglify','copy']); 
    
};
