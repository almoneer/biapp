'use strict';
var fs = require('fs');
var config = require('./config.js');
var encoding = require('encoding');
var jschardet = require('jschardet');

var bimad = require('orabimad-server');

var HOSTNAME = 'localhost';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var dynamicServer = function(connect, dir) {
  return new bimad.server(config.pluginFile, dir).createMiddleware();
}

var readFile = function(path, enc) {
  var toEncoding = (enc === undefined)?null:enc;
  if (toEncoding !== null) {
    var buf = fs.readFileSync(path);
    var fromEncoding = 'utf-8'
    var detectEncoding = jschardet.detect(buf);
    if (detectEncoding.confidence >= 0.50) {
      fromEncoding = detectEncoding.encoding;
    }

    if (fromEncoding != toEncoding) {
      return encoding.convert(buf, toEncoding, fromEncoding);
    } else {
      return buf;
    }
  }

  return fs.readFileSync(path);
}

var archive = function(zip, path, encoding) {
  // does not includes filds staring from .
  if (path.search(/\/\./) !== -1) {
    return;
  }

  var fileStat = fs.statSync(path);

  if (fileStat.isDirectory()) {
    // read file and archive recursively
    var files = fs.readdirSync(path);

    // pick up csv files
    for (var i=0, len=files.length; i<len; i++) {
      archive(zip, path+'/'+files[i], encoding);
    }

  } else if (fileStat.isFile()) {
    // ignore some files
    if (path.search(/.DS_Store|.*~|.*\.swp/) !== -1) {
      return;
    }

    var buf = readFile(path, encoding);
    zip.file(path, buf.toString('base64'), {base64: true});
  }
}

var getPluginId = function()
{
  var vm = require('vm');
  var code = fs.readFileSync(config.pluginFile).toString('utf8');
  vm.runInThisContext('var plugin='+code);
  return vm.runInThisContext('plugin.id');
}

var reauth = function(securityService, pluginService) {
  var inquirer = require('inquirer');
  var URL = require('url');

  inquirer.prompt([{
    type: 'input',
    name: 'server',
    message: 'Enter server url',
    default: URL.format(config.baseURL)
  },{
    type: 'input',
    name: 'username',
    message: 'Enter Login name with Administrator privilege'
  }, {
    type: 'password',
    name: 'password',
    message: 'Enter Login password with Administrator privilege'
  }], function(answers) {
    var username = answers['username'];
    var password = answers['password'];
    var newURL = answers['server'];

    if (newURL !== config.baseURL) {
      config.baseURL = newURL;
      securityService.setURL(config.baseURL);
      pluginService.setURL(config.baseURL);
    }

    // login to get token
    securityService.login(username, password);
  });
}


module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    watch: {
      options: {
        nospawn: true,
        livereload: LIVERELOAD_PORT
      },
      watchFiles: {
        files: [config.pluginFile, 'data/*.csv', 'assets/*.js', 'assets/**/*.js', 'assets/*.css', 'assets/**/*.css'],
        tasks: ['reload']
      }
    },
    reload: {
      port: LIVERELOAD_PORT,
      livereload: true
    },
    connect: {
      options: {
        port: 9000,
        hostname: HOSTNAME
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              dynamicServer(connect, '.')
            ];
          }
        }
      }
    },
    open: {
      server: {
        path: 'http://\x3c%= connect.options.hostname %\x3e:\x3c%= connect.options.port %\x3e'
      }
    }
  });

  grunt.registerTask('server', ['connect:livereload', 'open', 'watch']);


  /*
  grunt.registerTask('logout', 'Logout from the server', function(a,b) {
    var SecurityService = bimad.ws.SecurityService;
    var securityService = new SecurityService(config.baseURL);
    var session = securityService.loadSession();
    if (session != null) {
      securityService.logout(session);
    }
  });
  */

  grunt.registerTask('archive', 'Archive Files for deploy', function() {
    var zip = new require('node-zip')();
    var path = require('path');
    var pluginId = getPluginId();

    // Server expects main plugin file as pluginId.js (e.g. 19564dc1da7d.test.js)
    var pluginContent = fs.readFileSync(config.pluginFile, 'utf8');
    zip.file(pluginId + '.js', pluginContent);

    if (fs.existsSync('assets')) {
      archive(zip, 'assets');
    }

    fs.writeFileSync(pluginId+'.xmp', zip.generate({base64: false, compression: 'DEFLATE'}), 'binary');
  });

  grunt.registerTask('_deploy', 'Deploy plugin code', function() {
    var done = this.async();

    var PluginService = bimad.ws.PluginService;
    var SecurityService = bimad.ws.SecurityService;

    // read plugin file
    var Buffer = require('buffer').Buffer;

    var pluginId = getPluginId();
    var data = Buffer.from(fs.readFileSync(pluginId+'.xmp', {encoding: null})).toString('base64');

    var pluginService = new PluginService(config.baseURL);
    pluginService.on('success', function() {
      console.log('SUCCESSFULLY UPLOADED');
      done();
    });

    pluginService.on('error', function(err) {
      console.log('Deploy error occurred. '+err);

      // typically, invalid (expired) token.
      // ask user to enter username and password
      securityService.once('success', function(token) {
        pluginService.deploy(token, appPath, pluginId, data);
      });

      reauth(securityService, pluginService);
    });

    // check saved session
    var securityService = new SecurityService(config.baseURL);
    var session = securityService.loadSession();

    // if there is not, re-authenticate
    var appPath = '/DUM_FORNOW';

    if (session === undefined || session === null) {
      console.log('Session code is not found reauth before deploy.');

      // typically, invalid (expired) token.
      // ask user to enter username and password
      securityService.once('success', function(token) {
        pluginService.deploy(token, appPath, pluginId, data);
      });

      reauth(securityService, pluginService);

    } else {
      // console.log("Try deploying pliugin file with session="+session);
      pluginService.deploy(session, appPath, pluginId, data);
    }
  });

  grunt.registerTask('undeploy', 'Undeploy plugin code', function() {

    var done = this.async();
    var PluginService = bimad.ws.PluginService;
    var SecurityService = bimad.ws.SecurityService;

    var pluginId = getPluginId();
    var pluginService = new PluginService(config.baseURL);
    pluginService.on('success', function(val) {

      if (val.toString() === 'true')
      {
        console.log('SUCCESSFULLY DELETED');
      }
      else
      {
        console.log('PLUGIN WAS NOT FOUND');
      }

      done();
    });

    pluginService.on('error', function(err) {
      console.log('Deploy error occurred. '+err);

      // typically, invalid (expired) token.
      // ask user to enter username and password
      securityService.once('success', function(token) {
        pluginService.undeploy(token, appPath, pluginId);
      });

      reauth(securityService, pluginService);
    });

    // check saved session
    var securityService = new SecurityService(config.baseURL);
    var session = securityService.loadSession();

    // if there is not, re-authenticate
    var appPath = '/DUM_FORNOW';

    if (session === undefined || session === null) {
      console.log('Session code is not found reauth before deploy.');

      // typically, invalid (expired) token.
      // ask user to enter username and password
      securityService.once('success', function(token) {
        pluginService.undeploy(token, appPath, pluginId);
      });

      reauth(securityService, pluginService);

    } else {
      // console.log("Try deploying pliugin file with session="+session);
      pluginService.undeploy(session, appPath, pluginId);
    }
  });

  grunt.registerTask('deploy', ['archive', '_deploy']);
};
