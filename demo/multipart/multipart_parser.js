var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = new JSLexer();

var ACT_TYPE = {
    NO_ACTION: -1,
    UNKNOW_CHAR: -2,
    UNMATCH_CHAR: -3
};

var $$_LEX_STATES_$$;

var CD_REG = /^\r\nContent-Disposition:\s*form-data;\s*name=\"([^\"]+)\";\s*filename=\"([^\"]+)\"$/;
var CT_REG = /^\r\nContent-Type:\s*([\a\/\-]+)$/;


var _str_to_arr = function (strs, arrs) {
    for (var j = 0; j < strs.length; j++) {
        var str = strs[j], arr = arrs[j], t = str.charCodeAt(0), len = str.length, c = 0;
        for (var i = 1; i < len; i++) {
            if (t === 0)
                arr[i - 1] = str.charCodeAt(i) - 1;
            else {
                var n = str.charCodeAt(i) - 1, v = str.charCodeAt(i + 1) - 1;
                for (var k = 0; k < n; k++) {
                    arr[c] = v;
                    c++;
                }
                i++;
            }
        }
    }
};

var TABLE = {
    _base: new Int32Array($$_BASE_LEN_$$),
    _default: new Int32Array($$_DEFAULT_LEN_$$),
    _check: new Int32Array($$_CHECK_LEN_$$),
    _next: new Int32Array($$_NEXT_LEN_$$),
    _action: new Int32Array($$_ACTION_LEN_$$),
    _eqc: new Int32Array($$_EQC_LEN_$$)
};

_str_to_arr(["$$_BASE_STR_$$", "$$_DEFAULT_STR_$$", "$$_CHECK_STR_$$", "$$_NEXT_STR_$$", "$$_ACTION_STR_$$", "$$_EQC_STR_$$"], [TABLE._base, TABLE._default, TABLE._check, TABLE._next, TABLE._action, TABLE._eqc]);

function JSLexer() {
    EventEmitter.call(this);

    this.chunk_queue = [];
    this.chunk = null;
    this.chunk_queue_idx = 0;
    this.chunk_queue_size = 0;

    this.end = 0;
    this.idx = 0;
    this.chr = -1;
    //初始状态，init_state，恒为状态表中的第一个起始状态。
    this.i_s = $$_INIT_STATE_$$;

    this.yyidx = 0;

}
util.inherits(JSLexer, EventEmitter);

JSLexer.prototype = {
    read_ch: function () {
        if(this.idx >= this.chunk.length) {
            if(this.chunk_queue_idx >= this.chunk_queue.length - 1) {
                return -1;
            } else {
                this.chunk_queue_idx++;
                this.chunk = this.chunk_queue[this.chunk_queue_idx];
                this.idx = 0;
            }
        }
        return this.chr = this.chunk[this.idx++];
    },
    do_lex: function () {
        var go_on = true;
        while (go_on) {
            var yylen = 0,
                state = this.i_s,
                action = ACT_TYPE.NO_ACTION;

            this.yyidx = this.idx;

            var pre_idx = this.idx;
            var pre_action = ACT_TYPE.NO_ACTION,
                pre_act_len = 0;

            while (true) {
                if (this.read_ch() < 0) {
                    /*
                     * 如果当前chunk已经读完了
                     */
                    if(pre_action >= 0) {
                        /**
                         * multipart的流，不会出现规则的重叠。理论上代码不可能运行到这里，
                         * 如果运行到这里，说明有诡异的事情出现。
                         */
                        util.error("something strange happens at multipart_parser, 001");
                        this._error();
                    }
                    go_on = false;
                    break;
//                    if (pre_action >= 0) {
//                        action = pre_action;
//                        yylen = pre_act_len;
//                        this.idx = pre_idx + pre_act_len;
//                    } else if (pre_idx < this.end) {
//                        action = ACT_TYPE.UNMATCH_CHAR;
//                        this.idx = pre_idx + 1;
//                    }
//                    if (pre_idx >= this.end) {
//                        go_on = false;
//                    }
//                    break;
                } else {
                    yylen++;
                }
                var eqc = TABLE._eqc[this.chr];
                if (eqc === undefined) {
                    if (pre_action >= 0) {
                        action = pre_action;
                        yylen = pre_act_len;
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
                        yylen = pre_act_len;
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
                        pre_act_len = yylen;
                    }
                }
            }

            //yytxt = this.src.substr(pre_idx, yylen);
            switch (action) {
                case ACT_TYPE.UNKNOW_CHAR:
                case ACT_TYPE.UNMATCH_CHAR:
                    this._error();
                    break;

                    $$_ACTION_TABLE_$$

                default :
                    break;
            }
        }
    },
    yygoto: function (state) {
        this.i_s = state;
    },
    _error : function() {
        this.chunk_list.length = 0;
        this.emit('error');
    },
    _cd : function() {

    },
    _ct : function() {

    },
    _cnt : function() {

    },
    write: function (chunk) {
        if(chunk.length === 0) {
            return;
        }
        this.chunk_queue.push(chunk);
        this.chunk_queue_size += chunk.length;

        if(this.chunk_queue_size > 64 * 3 * 1024) {
            /**
             * 由于libuv每次尽可能读取64kb，如果当前同时存在于队列中的chunk超过过64*3kb,
             * 说明很有可能是出错了。为了防止可能的攻击，遇到这种情况，宁可让程序结束。
             */
            util.error('strange happens, chunk queue size overflow.');
            this._error();
            return;
        }

        this.do_lex();
    }
};

