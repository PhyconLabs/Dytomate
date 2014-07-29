module.exports = function(grunt) {
	var lodash = require("lodash");
	
	var requirejsOptions = grunt.file.readJSON("build.json");
	
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		
		requirejs: {
			minified: {
				options: lodash.assign({
					out: "build/dytomate.min.js"
				}, requirejsOptions)
			},
			
			unminified: {
				options: lodash.assign({
					optimize: "none",
					
					out: "build/dytomate.js"
				}, requirejsOptions)
			}
		}
	});
	
	grunt.loadNpmTasks("grunt-contrib-requirejs");
	
	grunt.registerTask("default", [ "requirejs:minified", "requirejs:unminified" ]);
};