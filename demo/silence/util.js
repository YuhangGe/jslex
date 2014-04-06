/**
 * User: xiaoge
 * At: 14-4-6 11:00下午
 * Email: abraham1@163.com
 */
var fs = require("fs");
var path = require("path");

var $ = {
    log : function(msg) {
        console.log(msg);
    },
    /**
     * js 面向对象。
     *
     */
    inherit : function(inheritClass, baseClass) {
        if(typeof inheritClass === 'undefined' || typeof baseClass ==='undefined'){
            console.trace();
            throw 'inherit error!';
        }
        //首先把父类的prototype中的函数继承到子类中
        for(var pFunc in baseClass.prototype) {
            var sp = inheritClass.prototype[pFunc];
            //如果子类中没有这个函数，添加
            if( typeof sp === 'undefined') {
                inheritClass.prototype[pFunc] = baseClass.prototype[pFunc];
            }
            //如果子类已经有这个函数，则忽略。以后可使用下面的callBase函数调用父类的方法

        }
        //保存继承树，当有多级继承时要借住继承树对父类进行访问
        inheritClass.__base_objects__ = new Array();
        inheritClass.__base_objects__.push(baseClass);

        if( typeof baseClass.__base_objects__ !== 'undefined') {
            for(var i = 0; i < baseClass.__base_objects__.length; i++)
                inheritClass.__base_objects__.push(baseClass.__base_objects__[i]);
        }

        /**
         * 执行父类构造函数，相当于java中的this.super()
         * 不使用super是因为super是ECMAScript保留关键字.
         * @param {arguments} args 参数，可以不提供
         */
        inheritClass.prototype.base = function(args) {

            var baseClass = null, rtn = undefined;
            if( typeof this.__inherit_base_deep__ === 'undefined') {
                this.__inherit_base_deep__ = 0;
            } else {
                this.__inherit_base_deep__++;
                //$.dprint('d+:'+this.__inherit_deep__);
            }

            baseClass = inheritClass.__base_objects__[this.__inherit_base_deep__];

            if( typeof args === 'undefined' || args == null) {
                rtn = baseClass.call(this);
            } else if( args instanceof Array === true) {
                rtn = baseClass.apply(this, args);
            } else {
                // arguments 是Object而不是Array，需要转换。
                rtn = baseClass.apply(this, [].slice.call(arguments));
            }

            this.__inherit_base_deep__--;

            return rtn;
        };
        /**
         * 给继承的子类添加调用父函数的方法
         * @param {string} method 父类的函数的名称
         * @param {arguments} args 参数，可以不提供
         */
        inheritClass.prototype.callBase = function(method, args) {

            var baseClass = null, rtn = undefined;

            if( typeof this.__inherit_deep__ === 'undefined') {
                this.__inherit_deep__ = 0;

            } else {
                this.__inherit_deep__++;
            }

            baseClass = inheritClass.__base_objects__[this.__inherit_deep__];

            var med = baseClass.prototype[method];
            if( typeof med === 'function') {
                if( typeof args === 'undefined' || args === null) {
                    rtn = med.call(this);
                } else if( args instanceof Array === true) {
                    rtn = med.apply(this, args);
                } else {
                    rtn = med.apply(this, [].slice.call(arguments, 1));
                }
            } else {
                throw 'There is no method:' + method + ' in baseClass';
            }

            this.__inherit_deep__--;
            return rtn;
        };
    },
    readFile : function(filename) {
        return fs.readFileSync(filename, "utf-8");
    },
    writeFile : function(filename, content) {
        fs.writeFileSync(filename, content);
    },
    parseFileName : function(filename) {
        if(filename.charAt(0)==='/') {
            return filename;
        } else {
            return path.normalize(process.env.PWD + '/' + filename);
        }
    },
    getFileBasePath : function(filename, base_path) {
        if(filename.charAt(0)!=='/') {
            filename =  path.normalize((base_path ? base_path : process.env.PWD) + '/' + filename);
        }
        return filename.substr(0, filename.lastIndexOf('/') + 1);
    },
    getPathBasePath : function(pathname, base_path) {
        if(pathname.charAt(0) !== '/') {
            pathname = path.normalize((base_path ? base_path : process.env.PWD) + '/' + pathname);
        }
        return pathname;
    },
    isFSExists : function(file_or_path) {
        return fs.existsSync(file_or_path);
    },
    readDirectory : function(dir_name) {
        return fs.readdirSync(dir_name);
    }
};

module.exports = $;