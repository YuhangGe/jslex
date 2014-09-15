var fs = require("fs");
var path = require("path");
var _ = require('underscore');

var $ = {};

module.exports = $;

_.extend($, {
    log: function (msg) {
        console.log.apply(this, arguments);
    },
    err: function () {
        if (arguments.length > 0) {
            console.log.call(console, arguments);
        }
        console.trace();
        throw "err!";
    },
    /**
     * 绑定继承关系，使用了javascript闭包性质，使得baseType可以使用
     * @param {Object} inheritClass 继承类
     * @param {Object} baseClass 父类
     *
     */
    inherit: function (inheritClass, baseClass) {
        //首先把父类的prototype中的函数继承到子类中
        for (var pFunc in baseClass.prototype) {
            var sp = inheritClass.prototype[pFunc];
            //如果子类中没有这个函数，添加
            if (typeof sp === 'undefined') {
                inheritClass.prototype[pFunc] = baseClass.prototype[pFunc];
            }
            //如果子类已经有这个函数，则忽略。以后可使用下面的callBase函数调用父类的方法

        }
        //保存继承树，当有多级继承时要借住继承树对父类进行访问
        inheritClass.__base_objects__ = [];
        inheritClass.__base_objects__.push(baseClass);

        if (typeof baseClass.__base_objects__ !== 'undefined') {
            for (var i = 0; i < baseClass.__base_objects__.length; i++)
                inheritClass.__base_objects__.push(baseClass.__base_objects__[i]);
        }

        /**
         * 执行父类构造函数，相当于java中的this.super()
         * 不使用super是因为super是ECMAScript保留关键字.
         * @param {arguments} args 参数，可以不提供
         */
        inheritClass.prototype.base = function (args) {

            var baseClass = null, rtn = undefined;
            if (typeof this.__inherit_deep__ === 'undefined') {
                this.__inherit_deep__ = 0;
            } else {
                this.__inherit_deep__++;
                //$.dprint("d+:"+this.__inherit_deep__);
            }

            baseClass = inheritClass.__base_objects__[this.__inherit_deep__];

            if (typeof args === "undefined" || args == null) {
                rtn = baseClass.call(this);
            } else if (args instanceof Array === true) {
                rtn = baseClass.apply(this, args);
            } else {
                var _args = new Array();
                for (var i = 0; i < arguments.length; i++)
                    _args.push(arguments[i]);
                rtn = baseClass.apply(this, _args);
            }

            this.__inherit_deep__--;

            //$.dprint("d-:"+this.__inherit_deep__);
            return rtn;
        };
        /**
         * 给继承的子类添加调用父函数的方法
         * @param {string} method 父类的函数的名称
         * @param {arguments} args 参数，可以不提供
         */
        inheritClass.prototype.callBase = function (method, args) {

            var baseClass = null, rtn = undefined;

            if (typeof this.__inherit_deep__ === 'undefined') {
                this.__inherit_deep__ = 0;

            } else {
                this.__inherit_deep__++;
                //$.dprint("d+:"+this.__inherit_deep__);
            }

            //$.dprint(this.__inherit_deep__);
            baseClass = inheritClass.__base_objects__[this.__inherit_deep__];

            var med = baseClass.prototype[method];
            if (typeof med === 'function') {
                if (typeof args === "undefined" || args == null) {
                    rtn = med.call(this);
                } else if (args instanceof Array) {
                    rtn = med.apply(this, args);
                } else {
                    var _args = [];
                    //从位置1开始，因为第0位参数是method的名称
                    for (var i = 1; i < arguments.length; i++) {
                        _args.push(arguments[i]);
                    }
                    rtn = med.apply(this, _args);
                }
            } else {
                throw "There is no method:" + method + " in baseClass";
            }

            this.__inherit_deep__--;

            //$.dprint("d-:"+this.__inherit_deep__);
            //$.dprint("----");
            return rtn;
        }
    },
    _d: {
        10: "\\d", //数字：	\d
        11: "\\D", //非数字：	\D
        12: "\\s", //空字符\f\n\r\t\v：	\s
        13: "\\S", //非字符：	\S
        14: "\\w", //字符a-zA-Z_：\s
        15: "\\W", //非字符：	\W
        16: "\\a", //字母：	\a
        17: "\\A", //非字母：	\A
        18: "\\u", //大写字母：\u
        19: "\\U", //非大写字母：\U
        20: "\\l", //小写字母：\l
        21: "\\L", //非小写字母：\L
        22: ".", //除\n外任意字符：.
        '\t': '\\t',
        '\b': '\\b',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '\v': '\\v',
        get: function (id) {
            if (this[id])
                return this[id];
            else
                return id;
        }
    },
    /*
     * 排除重复元素，返回新的一个数组
     */
    uniqueArr: function (arr) {
        var u_arr = [];
        for (var i = 0; i < arr.length; i++) {
            if (u_arr.indexOf(arr[i]) === -1)
                u_arr.push(arr[i]);
        }

        return u_arr;
    },
    /**
     * 对arr进行排序，并排除重复元素，返回新的一个数组
     */
    uniqueSort: function (arr) {
        var s_arr = new Array(arr.length), end = 1;
        s_arr[0] = arr[0];
        out_for:
            for (var i = 1, len = arr.length; i < len; i++) {
                var elm = arr[i];
                for (var j = 0; j < end; j++) {
                    if (arr[i] === s_arr[j]) {
                        continue out_for;
                    } else if (elm < s_arr[j]) {
                        s_arr.splice(j, 0, elm);
                        end++;
                        continue out_for;
                    }
                }
                s_arr[end++] = elm;
            }
        s_arr.length = end;
        return s_arr;
    },
    /**
     * 简单合并两个数组，将arr2的元素添加到arr1中
     */
    arrUnion: function (arr1, arr2) {
        for (var i = 0; i < arr2.length; i++)
            arr1.push(arr2[i]);
    },
    arrCopy: function (arr) {
        var new_arr = [];
        for (var i = 0; i < arr.length; i++)
            new_arr.push(arr[i]);
        return new_arr;
    },
    /**
     * 得到实际串的不重复循环，主要用在生成DFA状态时状态的名称。
     * a,b,c,...,z,aa,bb,cc,...,zz,aaa,....
     */
    _n: {
        i: -1,
        names: "abcdefghigklmnopqrstuvwxyz".split(''),
        get: function () {
            var n = ++this.i;
            var len = this.names.length;
            var chr = [];
            var k;
            while (true) {
                k = n % len;
                chr.push(this.names[k]);
                n = (n - k) / len;
                if (n === 0)
                    break;
            }
            //$.dprint(chr);
            var rtn = "";
            for (var i = chr.length - 1; i >= 0; i--)
                rtn += chr[i];
            return rtn;
        }
    },
    /**
     * 比较两个集合是否一样，因为保证了是集合，所以算法相对简单。
     * 元素个数相同且第一个集合中每个元素都在第二个集合中就行了。
     */
    setEqual: function (set1, set2) {
        if (set1.length !== set2.length)
            return false;
        for (var i = 0; i < set1.length; i++) {
            if (set2.indexOf(set1[i]) === -1)
                return false;
        }
        return true;
    },
    isDigit: function (chr) {
        //$.dprint("isDigit:"+chr);
        return chr >= 48 && chr <= 57;
    },
    isNotDigit: function (chr) {
        return chr < 48 || chr > 57;
    },
    isLetter: function (chr) {
        //$.dprint("isLetter:"+chr);
        return chr >= 97 && chr <= 122 || chr >= 65 && chr <= 90;
    },
    isNotLetter: function (chr) {
        return chr < 65 || chr > 90 && chr < 97 || chr > 122;
    },
    isWord: function (chr) {
        //$.dprint("isWord:" + chr);
        return this.isLetter(chr) || this.isDigit(chr) || chr === 95;
    },
    isNotWord: function (chr) {
        return !this.isWord(chr);
    },
    isSpace: function (chr) {
        return chr === 32 || chr === 9 || chr === 10 || chr === 13 || chr === 12 || chr === 11;
    },
    isNotSpace: function (chr) {
        return !U.isSpace(chr);
    },
    isUpper: function (chr) {
        return chr >= 65 && chr <= 90;
    },
    isNotUpper: function (chr) {
        return chr < 65 || chr > 90;
    },
    isLower: function (chr) {
        return chr >= 97 && chr <= 122;
    },
    isNotLower: function (chr) {
        return chr < 97 || chr > 122;
    },
    isDot: function (chr) {
        return chr !== 10;
    },
    /*
     * 将数组压缩成字符串，字符串的第一个字符的ascii码代表当前字符串压缩格式。
     * 0代表直接压缩，1代表隔位压缩。如数组[2,2,2,3,3,5,0xfff0,0xfff0,9,9,9,9]
     * 直接压缩的结果是 "\0\2\2\2\3\3\5\ufff0\ufff0\9\9\9\9"
     * 隔位压缩的结果是 "\1\3\2\2\3\1\5\2\ufff0\4\9"，即前一位代表后一位字符的重复数量。
     * 压缩格式的选择根据最后生成的字符串的长度而定。
     */
    arr_to_str: function (arr) {
        var s_0 = ["\\0"], s_1 = ["\\1"], s_0_n = 0, s_1_n = 0;
        var pre_i = arr[0], pre_c = this.int_to_char(pre_i), pre_n = 1, len = arr.length - 1;
        s_0.push(pre_c);
        for (var i = 1; i <= len; i++) {
            var cur_i = arr[i], cur_c = this.int_to_char(cur_i);
            s_0_n += cur_c.length;
            s_0.push(cur_c);
            if (cur_i !== pre_i) {
                var tmp = this.int_to_char(pre_n);
                s_1_n += tmp.length + pre_c.length;
                s_1.push(tmp);
                s_1.push(pre_c);
                pre_c = cur_c;
                pre_i = cur_i;
                pre_n = 1;
            } else {
                pre_n++;
            }
            if (i === len) {
                var tmp = this.int_to_char(pre_n);
                s_1_n += tmp.length + pre_c.length;
                s_1.push(tmp);
                s_1.push(pre_c);
            }
        }
        return s_0_n <= s_1_n ? s_0.join("") : s_1.join("");
    },
    int_to_char: function (i) {
        if (i == null) {
            i = 0;
        } else {
            i++;
        }
        if (i < 64) {
            return "\\" + i.toString(8);
        } else if (i < 256) {
            return "\\x" + i.toString(16);
        } else if (i < 0x1000) {
            return "\\u0" + i.toString(16);
        } else {
            return "\\u" + i.toString(16);
        }
    },
    /**
     * 将上面函数压缩的字符串还原成
     */
    str_to_array: function (str, arr) {
        var t = str.charCodeAt(0), len = str.length, c = 0;
        for (var i = 1; i < len; i++) {
            if (t === 0)
                arr[i - 1] = str.charCodeAt(i) - 1;
            else {
                var n = str.charCodeAt(i) - 1, v = str.charCodeAt(i + 1) - 1;
                for (var j = 0; j < n; j++) {
                    arr[c] = v;
                    c++;
                }
                i++;
            }
        }
    },
    readFile: function (filename) {
        return fs.readFileSync(filename, "utf-8");
    },
    writeFile: function (filename, content) {
        fs.writeFileSync(filename, content);
    },
    parseFileName: function (filename) {
        if (filename.charAt(0) === '/') {
            return filename;
        } else {
            return path.normalize(process.env.PWD + '/' + filename);
        }
    },
    getFileBasePath: function (filename, base_path) {
        if (filename.charAt(0) !== '/') {
            filename = path.normalize((base_path ? base_path : $.__BASE_PATH__) + '/' + filename);
        }
        return filename.substr(0, filename.lastIndexOf('/') + 1);
    },
    getPathBasePath: function (pathname, base_path) {
        if (pathname.charAt(0) !== '/') {
            pathname = path.normalize((base_path ? base_path : $.__BASE_PATH__) + '/' + pathname);
        }
        return pathname;
    },
    isFSExists: function (file_or_path) {
        return fs.existsSync(file_or_path);
    },
    readDirectory: function (dir_name) {
        return fs.readdirSync(dir_name);
    },
    __BASE_PATH__ : process.env.PWD
});
