

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
        www: 'www/',
        dist: 'dist/',
        test: 'test/'
    };
    var c = {
        dist: {
            concat: p.temp+'ngTouch.js',
            dist: p.dist+'ngTouch.min.js',
            build: p.test+'build/ngTouch.min.js'
        },
        test: {
            js: p.www+'scripts.js',
            css: p.www+'styles.css',
        }
    };
    
    // Project configuration.
    grunt.initConfig({
        clean:{
            build:[p.www,p.dist],
            temp:[p.temp],
            dist:[c.dist.build]
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
            },
            test:{
                src:[
                    p.test+ 'libs/angular/angular.min.js',
                    p.test+ 'libs/angular/**',
                    p.test+ 'libs/angular-ui-router.min.js',
                    p.test+ 'build/**',
                    //p.test+ 'libs/angular-touch.original.min.js',
                    p.test+ '*.js',
                    p.test+ 'test/**/*.js',
                ],
                dest: c.test.js
            },
            test_css: {
                src:[
                    p.test+ 'index.css',
                    p.test+ 'styles.css',
                    p.test+ 'test/*.css',
                    p.test+ 'test/**/*.css',
                ],
                dest: c.test.css
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
            },
            test:{
                files:[{
                    expand: true,
                    cwd: p.test,
                    src: ['**.html', '**/*.html'],
                    dest: p.www
                }]
            }
        }
    });
    
    
    grunt.registerTask('default',['clean','concat:dist','uglify','copy','concat:test','concat:test_css']); 
    
};
