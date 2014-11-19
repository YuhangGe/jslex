#!/usr/bin/env node
var fs = require('fs');
var ACT_TYPE = {
    NO_ACTION: -1,
    UNKNOW_CHAR: -2,
    UNMATCH_CHAR: -3
};
var TABLE = {
    _base: new Int32Array(18),
    _default: new Int32Array(18),
    _check: new Int32Array(29),
    _next: new Int32Array(29),
    _action: new Int32Array(18),
    _eqc: new Int32Array(256)
};
var str_to_arr = function(strs, arrs) {
    for(var j = 0; j < strs.length; j++) {
        var str = strs[j], arr = arrs[j], t = str.charCodeAt(0), len = str.length, c = 0;
        for(var i = 1; i < len; i++) {
            if(t === 0)
                arr[i - 1] = str.charCodeAt(i) - 1;
            else {
                var n = str.charCodeAt(i) - 1, v = str.charCodeAt(i + 1) - 1;
                for(var k = 0; k < n; k++) {
                    arr[c] = v;
                    c++;
                }
                i++;
            }
        }
    }
};
str_to_arr(["\1\14\1\6\6\2\16\2\26", "\1\23\0", "\1\4\0\2\7\2\10\2\11\2\12\2\13\2\14\2\15\2\16\2\17\2\20\11\21\11\22","\0\0\0\0\13\11\12\1\10\20\16\17\4\15\3\2\7\3\3\3\3\3\6\5\14\6\6\6\6\6", "\0\5\1\6\2\3\4\6\0\0\0\0\4\0\0\0\0\0\0", "\1\43\1\2\2\75\1\2\10\6\1\2\6\5\1\2\3\2\1\2\5\7\1\2\4\5\1\2\7\x88\1"], [TABLE._base, TABLE._default, TABLE._check, TABLE._next, TABLE._action, TABLE._eqc]);

var MAIN______DEFAULT = 16, MAIN______QUOTE_STATE = 17;

var MyLexer = function () {
    this.__ignore_case__ = true;
    this.src = null;
    this.end = 0;
    this.idx = 0;
    this.chr = -1;
    this.yylen = 0;
    this.yytxt = '';
    this.yyidx = 0;
    //init state
    this.i_s = 16;

    
    this.q_number = 0;
    this.total_number = 0;


};
MyLexer.prototype = {
    read_ch: function () {
        if (this.idx >= this.end)
            return this.chr = -1;
        else {
            this.chr = this.src[this.idx++].charCodeAt(0);
            if (this.__ignore_case__ && this.chr >= 65 && this.chr <= 90) {
                this.chr += 32;
            }
            return this.chr;
        }
    },
    do_lex: function () {
        var go_on = true;
        this.idx = 0;
        while (go_on) {
            var _yylen = 0;
            var state = this.i_s, action = ACT_TYPE.NO_ACTION;
            var pre_idx = this.idx, pre_action = ACT_TYPE.NO_ACTION, pre_act_len = 0;

            while (true) {
                if (this.read_ch() < 0) {
                    if (pre_action >= 0) {
                        action = pre_action;
                        _yylen = pre_act_len;
                        this.idx = pre_idx + pre_act_len;
                    } else if (pre_idx < this.end) {
                        action = ACT_TYPE.UNMATCH_CHAR;
                        this.idx = pre_idx + 1;
                    }
                    if (pre_idx >= this.end) {
                        go_on = false;
                    }
                    break;
                } else {
                    _yylen++;
                }
                var eqc = TABLE._eqc[this.chr];
                if (eqc === undefined) {
                    if (pre_action >= 0) {
                        action = pre_action;
                        _yylen = pre_act_len;
                        this.idx = pre_idx + pre_act_len;
                    } else
                        action = ACT_TYPE.UNKNOW_CHAR;
                    break;
                }
                var offset, next = -1, s = state;

                while (s >= 0) {
                    offset = TABLE._base[s] + eqc;
                    if (TABLE._check[offset] === s) {
                        next = TABLE._next[offset];
                        break;
                    } else {
                        s = TABLE._default[s];
                    }
                }

                if (next < 0) {
                    if (pre_action >= 0) {
                        action = pre_action;
                        _yylen = pre_act_len;
                        this.idx = pre_idx + pre_act_len;
                    } else {
                        action = ACT_TYPE.UNMATCH_CHAR;
                        this.idx = pre_idx + 1;
                    }
                    //跳出内层while，执行对应的action动作
                    break;
                } else {
                    state = next;
                    action = TABLE._action[next];
                    if (action >= 0) {
                        /**
                         * 如果action>=0，说明该状态为accept状态。
                         */
                        pre_action = action;
                        pre_act_len = _yylen;
                    }
                }
            }
            this.yytxt = this.src.substr(pre_idx, _yylen);
            this.yyidx = pre_idx;
            this.yylen = _yylen;
            this.__action(action);
        }
    },
    yygoto: function (state) {
        this.i_s = state;
    },
    lex: function (source) {
        this.src = source;
        this.end = this.src.length;
        this.idx = 0;
        this.chr = -1;

        
    console.log("Finding word 'js_lex' with ignore case option.\n");


        this.do_lex();

        
    console.log("\nDone. Found word 'js_lex' " + this.q_number + " times in quotes and " + this.total_number + " total times!")


    }
};

MyLexer.prototype.__action = function (action) {
    switch (action) {
        case ACT_TYPE.UNKNOW_CHAR:
            
    console.warn("unknow char:", String.fromCharCode(this.chr));

            break;
        case ACT_TYPE.UNMATCH_CHAR:
            
    console.warn("unmath char:", String.fromCharCode(this.chr));

            break;

        case 4:

    console.log("Found '" + this.yytxt + "' at " + this.yyidx);
    this.total_number++;

break;
case 0:

    this.yygoto(MAIN______QUOTE_STATE);

break;
case 5:

break;
case 1:

    console.log("Found '" + this.yytxt + "' in quotes at " + this.yyidx);
    this.q_number++;
    this.total_number++;

break;
case 2:

    this.yygoto(MAIN______DEFAULT);

break;
case 3:

    // do nothing

break;


    }
};

if(process.argv.length < 3) {
    console.log('Javascript Lexical Analyzer generated by JSLex.\nSee more: https://github.com/YuhangGe/jslex');
    return;
}

if(!fs.existsSync(process.argv[2]) || !fs.statSync(process.argv[2]).isFile()) {
    console.log('Error: input lex file `'+ process.argv[2]+'` not found!');
    return;
}

new MyLexer().lex(fs.readFileSync(process.argv[2]).toString());
