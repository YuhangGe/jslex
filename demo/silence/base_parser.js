'use strict'

var ACT_TYPE = {
    NO_ACTION : -1,
    UNKNOW_CHAR : -2,
    UNMATCH_CHAR : -3
};


var BaseParser = function(app) {
//    this.app = app;
    /*-----lexer part -----*/
    this.yysrc = null;
    this.end = 0;
    this.idx = 0;
    this.chr = -1;
    this.START_ACTION = 0;
    this.i_s = 0;
    this.yyidx  = 0;
    this.yylen = 0;
    this.TABLE = null;
    /*----grammar part ------*/
    this.grammar_stack = [];


};

BaseParser.prototype = {
    _str_to_arr : function(strs, arrs) {
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
    },
    read_ch : function() {
        if(this.idx >= this.end)
            return this.chr = -1;
        else {
            this.chr = this.yysrc.charCodeAt(this.idx++);
            return this.chr;
        }
    },
    action : function(action) {
        //do nothing, must be overwrite
        throw "must be overwrite";
    },
    do_lex : function() {
        var go_on = true;
        this.idx = this.cur_idx;

        while(go_on) {
            var yylen = 0;
            var state = this.i_s, action = ACT_TYPE.NO_ACTION;
            var yyidx = this.idx, pre_action = ACT_TYPE.NO_ACTION, pre_act_len = 0;

            while(true) {
                if(this.read_ch() < 0) {
                    if(pre_action >= 0) {
                        action = pre_action;
                        yylen = pre_act_len;
                        this.idx = yyidx + pre_act_len;
                    } else if(yyidx < this.end) {
                        action = ACT_TYPE.UNMATCH_CHAR;
                        this.idx = yyidx + 1;
                    }
                    if(yyidx >= this.end) {
                        go_on = false;
                    }
                    break;
                } else {
                    yylen++;
                }
                var eqc = this.TABLE._eqc[this.chr];

                if(eqc === undefined) {
                    continue;
                }
                var offset, next = -1, s = state;

                while(s >= 0) {
                    offset = this.TABLE._base[s] + eqc;
                    if(this.TABLE._check[offset] === s) {
                        next = this.TABLE._next[offset];
                        break;
                    } else {
                        s = this.TABLE._default[s];
                    }
                }

                if(next < 0) {
                    if(pre_action >= 0) {
                        action = pre_action;
                        yylen = pre_act_len;
                        this.idx = yyidx + pre_act_len;
                    } else {
                        action = ACT_TYPE.UNMATCH_CHAR;
                        this.idx = yyidx + 1;
                    }
                    //跳出内层while，执行对应的action动作
                    break;
                } else {
                    state = next;
                    action = this.TABLE._action[next];
                    if(action >= 0) {
                        /**
                         * 如果action>=0，说明该状态为accept状态。
                         */
                        pre_action = action;
                        pre_act_len = yylen;
                    }
                }
            }

            this.yyidx = yyidx;
            this.yylen = yylen;
            this.action(action);
        }

    },
    yygoto : function(state) {
        this.i_s = state;
    },
    yytext : function() {
        return this.yysrc.substr(this.yyidx, this.yylen);
    },
    /**
     *
     * @param src 源文本
     */
    lex : function(src) {
        this.yysrc = src;
        this.end = src.length;
        this.i_s = this.START_ACTION;
        this.cur_idx = 0;
        this.do_lex();
    }

};

module.exports = BaseParser;


