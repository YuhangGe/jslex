/**
 * 将lex规则转换成dfa
 * 注意标志符目前暂时不支持数字。即可以
 * NUM \d+ 但不能  NUM_1 \d+
 * 同时，如果由已经定义的规则再组合规则，则需要用{}引用。
 * 比如
 * FLOAT {NUM}\.{NUM}
 * 但是如果是 FLOAT NUM\.NUM则是把NUM当作直接的字符串。
 */
var Lexer;
module.exports = Lexer = {
    __separate__: "______",
    src: null,
    idx: 0,
    cur_t: null,
    define: {},
    define_used: {},
    include_dir: '',
    rule: {

    },
    routine: {
        'construct': '',
        'start': '',
        'finish': '',
        'error': '',
        'init': '',
        'header': '',
        'footer': ''
    },
    txt_part: {
        'define': '',
        'rule': {
            'MAIN': ''
        },
        'routine': ''
    },
    cur_module: ''
};

var $ = require('../utility/utility.js');
var _ = require('underscore');
var Dfa2Src = require('../dfa/dfa2src.js');
var Nfa2Dfa = require('../nfa/nfa2dfa.js');
var Dfa2Table = require('../table/dfa2table.js');
var N = require('../nfa/nfa.js');
var DfaMinmize = require('../dfa/dfa-minmize.js');
var Str2Nfa = require('../nfa/str2nfa.js');
var C = require('./core.js');



Lexer.rule['MAIN' + Lexer.__separate__ + 'DEFAULT'] = [];
_.extend(Lexer, {
    _parse_options: function () {
        this.read_word();
        var in_option = true;
        var option_idx = 0;
        while (in_option) {
            var option = this.cur_t.toLowerCase();
            switch (option) {
                case '$case_ignore':
                    this.read_word();
                    /**
                     * 如果忽略大小写，则统一转成小写
                     * @type {Boolean}
                     */
                    Dfa2Src.case_ignore = this.cur_t.toLowerCase() === "true" ? true : false;
                    if (this.cur_t === 'true') {
                        $.log("use option - case ignore: true");
                    }
                    option_idx = this.idx;
                    this.read_word();
                    break;
                case '$lexer_name':
                    this.read_word();
                    Dfa2Src.lex_name = this.cur_t;
                    $.log("use option - lexer name: " + this.cur_t);
                    option_idx = this.idx;
                    this.read_word();
                    break;
                //case '$template':
                //    this.read_word();
                //    Dfa2Src.template = this.cur_t;
                //    $.log("use option - template name: " + this.cur_t);
                //    option_idx = this.idx;
                //    this.read_word();
                //    break;
                case '$argument' :
                    var ak = this.read_word();
                    var av = this.read_word();
                    Dfa2Src.lex_arguments[ak] = av;
                    $.log("use option - argument:{" + ak + "->" + av + "}");
                    option_idx = this.idx;
                    this.read_word();
                    break;
                case '$include_file':
                    //todo
                    throw 'unsupport option $include_file. we are still developing it.';
                    break;
                case '$include_dir':
                    var dir = $.getPathBasePath(this.read_word());
                    $.log("use option - include directory: " + dir);
                    if ($.isFSExists(dir) === false) {
                        throw 'include dir not exists. please check.';
                    }
                    this.include_dir = dir;
                    option_idx = this.idx;
                    this.read_word();
                    break;
                default:
                    in_option = false;
                    break;
            }
        }
        var d_i = option_idx, p_i = d_i;
//        $.log(this.cur_t, this.idx, this.src.substring(this.idx, this.idx+10));

        while (this.cur_t !== '$$' && this.cur_t !== null) {
            p_i = this.idx;
            this.read_word();
        }
        this.txt_part.define = this.src.substring(d_i, this.cur_t === null ? this.idx - 1 : p_i);
//        $.log(this.txt_part.define);

        d_i = this.idx;
        this.read_word();
        p_i = d_i;
        while (this.cur_t !== '$$' && this.cur_t !== null) {
            p_i = this.idx;
            this.read_word();
        }
        var r_def = this.src.substring(d_i, this.cur_t === null ? this.idx - 1 : p_i);
        r_def = this._replace_rule(r_def, 'MAIN');

        this.txt_part.rule.MAIN = r_def;

        this.txt_part.routine = this.src.substring(this.idx);
    },
    _d_line: function () {
        var lbl = this.cur_t;
        var exp = this.read_word();

        var r = Str2Nfa.parse(exp);
        r.finish.isAccept = false;

        this.define[lbl] = r;
    },
    _parse_define: function () {
        this.src = this.txt_part.define;
        this.idx = 0;
        this.len = this.src.length;

        this.read_word();
        while (this.cur_t !== null) {
            this._d_line();
            this.read_word();
        }
    },
    _parse_rule: function () {
//            $.log(this.txt_part.rule);

        for (var m_name in this.txt_part.rule) {
            //$.debug('parse module: ' + m_name);
            this.idx = 0;
            this.src = this.txt_part.rule[m_name];
            this.len = this.src.length;
            this.cur_module = m_name;
            this._rule();
        }
    },
    _rule: function () {
        this.read_word("{", "<");
//			$.log(this.cur_t);
//            $.log(this.src);
        while (this.cur_t != null) {

            this._r_line();
            this.read_word("{", "<");

        }

    },
    _r_line: function () {
        var lbl = this.cur_t, states = [];
        while (lbl === "<") {
            var s = this.read_word(">");
            if (s.indexOf("::")>=0) {
                states.push(s.replace("::", this.__separate__));
            } else {
                states.push(this.cur_module + this.__separate__ + s);
            }
            if (this.read_word(null, ">") !== ">") {
                throw "state name must be closed by '>'";
            }

            lbl = this.read_word("{", "<");
        }
        if (states.length === 0) {
            states.push(this.cur_module + this.__separate__ + 'DEFAULT');
        }
//			$.log(lbl)
        //$.log(states)

        var func_str = "";
        var c = this.read_ch();
        var until = '\n';
        while (c !== null && this.isSpace(c) && c !== until) {
            c = this.read_ch();
        }

        var deep = 0;
        var in_string = false, pre_str_dot = null;
        if (c === '{') {
            until = '}';
            c = this.read_ch();
        }
        if (c === '"' || c === "'") {
            in_string = true;
            pre_str_dot = c;
        }
        while (c !== null && !(c === until && deep === 0)) {
            if (in_string) {
                if (c === pre_str_dot) {
                    in_string = false;
                }
            } else if (c === '"' || c === "'") {
                in_string = true;
                pre_str_dot = c;
            }

            if (c === '{' && !in_string) {
                deep++;
            } else if (c === '}' && !in_string) {

                if (until === '}' && deep === 0) {
                    break;
                }
                deep--;
            }
            func_str += c;

            c = this.read_ch();

        }


        //this.read_ch();
//            $.log(states);
        for (var i = 0; i < states.length; i++) {
            var expNfa = this.define[lbl];
            //$.log(lbl);
            if (expNfa == null) {
                $.err("没有定义的标识@_r_line 0:" + lbl);
            }
            if (this.define_used[lbl] === true) {
                /**
                 * 如果在define块定义的标识已经被某个状态集使用过，则必须使用它的拷贝来生成一个rule
                 */
                expNfa = expNfa.copy();
            } else {
                this.define_used[lbl] = true;
            }
            expNfa.finish.isAccept = true;
            expNfa.finish.action = new C.Action(func_str);
            if (this.rule[states[i]] == null) {
                this.rule[states[i]] = [];
            }
            this.rule[states[i]].push(expNfa);
        }

    },
    _parse_routine: function () {
        this.idx = 0;
        this.src = this.txt_part.routine;
        this.len = this.src.length;

        this.read_word();
        while (this.cur_t !== null) {
            this._routine_line(this.cur_t);
            this.read_word();
        }

    },
    _routine_line: function (name) {

        name = name.toLowerCase();
        var func_str = "";
        var c = this.read_ch();
        var until = '\n';
        while (c !== null && this.isSpace(c) && c !== until)
            c = this.read_ch();
        //$.log(c)

        var deep = 0;
        var in_string = false, pre_str_dot = null;
        if (c === '{') {
            until = '}';
            c = this.read_ch();
        }
        if (c === '"' || c === "'") {
            in_string = true;
            pre_str_dot = c;
        }
        while (c !== null && !(c === until && deep === 0)) {
            if (in_string) {
                if (c === pre_str_dot) {
                    in_string = false;
                }
            } else if (c === '"' || c === "'") {
                in_string = true;
                pre_str_dot = c;
            }

            if (c === '{' && !in_string) {
                deep++;
            } else if (c === '}' && !in_string) {
                if (until === '}' && deep === 0) {
                    break;
                }
                deep--;
            }
            func_str += c;
            c = this.read_ch();
        }
//        if (['$init', '$construct', '$start', '$finish', '$error', '$header', '$footer'].indexOf(name) < 0) {
//            console.log("warning: unknow global function " + name + ", ignored.");
//            return;
//        } else {
////				$.log(name);
////				$.log(func_str);
//        }
        this.routine[name.substring(1, name.length)] = func_str;
    },
    read_ch: function () {
        if (this.idx === this.len) {
            return null;
        } else {
            return this.src[this.idx++];
        }
    },
    back_ch: function () {
        if (this.idx > 0)
            this.idx--;
    },
    /**
     * 读取一个word, e_until是直到这个字符但不包含这个字符的集合，c_until是直到这个字符同时包含这个字符的集合
     */
    read_word: function (e_until, c_until) {
        var c = this.read_ch(), e_until = e_until == null ? '' : e_until, c_until = c_until == null ? '' : c_until;
        while (c !== null && this.isSpace(c))
            c = this.read_ch();

        var w = "";
        var quote = null;
        if (c === '[')
            quote = ']';
        while (c !== null) {
            if (quote === null) {
                if (this.isSpace(c))
                    break;
                if (e_until.indexOf(c) >= 0) {
                    //由于不包含这个字符，要回退
                    this.idx--;
                    break;
                }
                if (c_until.indexOf(c) >= 0) {
                    w += c;
                    break;
                }
            }
            w += c;
            if (c === "\\") {
                c = this.read_ch();
                if (c !== null)
                    w += c
            } else if (c === '\"' || c === '\'') {
                if (quote === c)
                    quote = null;
                else if (quote === null)
                    quote = c;
            } else if (c === '[' && quote === null) {
                quote = ']';
            } else if (c === ']' && quote !== null) {
                quote = null;
            }
            c = this.read_ch();
        }
        if (w.length === 0)
            this.cur_t = null;
        else
            this.cur_t = w;
        return this.cur_t;
    },
    parse: function (source) {
        //init
        this.src = source;
        this.idx = 0;
        this.len = source.length;


        this._parse_options();

        if (this.include_dir !== '') {
            this._parse_include_dir();
        }

//            $.log(this.txt_part.define);
//            $.log(this.txt_part.rule.GLOBAL);


//            process.exit(0);


        this._parse_define();


        this._parse_rule();


//            $.log(this.rule);
//            process.exit(0);
        this._parse_routine();

        var dfa_arr = [], default_dfa = null, states = {};
        //$.dprint(lexNFA);
        for (var s in this.rule) {
            var rs = this.rule[s];
            var lexNFA = new N.NFA();
            var lexStart = new N.NFAState();
            lexNFA.start = lexStart;
            lexNFA.addState(lexStart);
            for (var i = 0; i < rs.length; i++) {
                var nfaExp = rs[i];
                lexStart.addMove(C.Input.e, nfaExp.start);
                lexNFA.addState(nfaExp.states);
            }
            //$.dprint(lexNFA);
            var dfa = Nfa2Dfa.parse(lexNFA);
            //$.dprint(dfa);
            var m_dfa = DfaMinmize.parse(dfa);
            //$.dprint(m_dfa);
            m_dfa.state_name = s;
            dfa_arr.push(m_dfa);
            if (s === "MAIN" + this.__separate__ + "DEFAULT") {
                default_dfa = m_dfa;
            }

        }
        //$.dprint(dfa_arr);

        var dfa_obj = {
            dfa_array: dfa_arr,
            default_dfa: default_dfa
        };

        Dfa2Table.parse(dfa_obj);
        /*$.aprint(m_dfa.table_base);
         $.dprint(Alice.Help.array_to_str(m_dfa.table_base));
         $.aprint(m_dfa.table_default);
         $.dprint(Alice.Help.array_to_str(m_dfa.table_default));
         $.aprint(m_dfa.table_check);
         $.dprint(Alice.Help.array_to_str(m_dfa.table_check));
         $.aprint(m_dfa.table_next);
         $.dprint(Alice.Help.array_to_str(m_dfa.table_next));
         $.aprint(m_dfa.table_action);
         $.dprint(Alice.Help.array_to_str(m_dfa.table_action));
         $.dprint(Alice.Help.array_to_str(Alice.CharTable.char_table));
         */
        return {
            dfa_obj: dfa_obj,
            routine: this.routine
        }

    },
    isSpace: function (chr) {
        return chr === ' ' || chr === '\n' || chr === '\t' || chr === '\r';
    },
    _parse_include_dir: function () {
        var i_dir = this.include_dir;
        var f_list = $.readDirectory(i_dir);
        for (var i = 0; i < f_list.length; i++) {
            this._parse_include_file(i_dir + '/' + f_list[i]);
        }
    },
    _parse_include_file: function (file) {
        $.log("include file: " + file);
        var cnt = $.readFile(file);
        this.idx = 0;
        this.src = cnt;
        this.len = cnt.length;

        this.read_word();
        if (this.cur_t === null) {
            $.log("warning: empty include file.");
            return;
        }
        if (this.cur_t.toLowerCase() !== '$module_name') {
            $.log("error: include file must contains $module_name option at top of file. ignored file.");
            return;
        }

        var m_name = this.read_word();

        if (m_name.toUpperCase() === 'MAIN') {
            $.log("error: include file $module_name cannot be MAIN as it is keyword. ignored file.");
            return;
        }
        if (/^[a-zA-Z]+$/.test(m_name) === false) {
            $.log("error: include file $module_name can only contains alpha letter. ignored file.");
            return;
        }

        var d_i = this.idx, p_i = d_i;
//        $.log(this.cur_t, this.idx, this.src.substring(this.idx, this.idx+10));

        while (this.cur_t !== '$$' && this.cur_t !== null) {
            p_i = this.idx;
            this.read_word();
        }
        this.txt_part.define += '\n\n' + this.src.substring(d_i, this.cur_t === null ? this.idx - 1 : p_i);
//        $.log(this.txt_part.define);

        d_i = this.idx;
        this.read_word();
        p_i = d_i;
        while (this.cur_t !== '$$' && this.cur_t !== null) {
            p_i = this.idx;
            this.read_word();
        }

        if(this.cur_t === '$$') {
            this.idx -= 2;
        }
        var r_def = this.src.substring(d_i, this.cur_t === null ? this.idx - 1 : p_i);
        r_def = this._replace_rule(r_def, m_name);
        this.txt_part.rule[m_name] = r_def;

    },
    _replace_rule: function (r_def, m_name) {
        var separate = this.__separate__;
        return r_def.replace(/this\.yygoto\(\s*(([a-zA-Z_]+)::)?([a-zA-Z_]+)\s*\)/g, function (word, arg2, module_name, name) {
            var _goto = "DEFAULT";
            if (module_name != null) {
                _goto = module_name + separate + name;
            } else {
                _goto = m_name + separate + name;
            }
            return "this.yygoto(" + _goto + ")";
        });
    }


});


