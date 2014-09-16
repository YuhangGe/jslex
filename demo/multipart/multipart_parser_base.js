module.exports = MultipartParserBase;

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Funcs = require('./multipart_parser_funcs.js');
var _ = require('underscore');

var ACT_TYPE = {
    NO_ACTION: -1,
    UNKNOW_CHAR: -2,
    UNMATCH_CHAR: -3
};

var TABLE = {
    _base: null, // new Int32Array($$_BASE_LEN_$$),
    _default: null, // new Int32Array($$_DEFAULT_LEN_$$),
    _check: null, //new Int32Array($$_CHECK_LEN_$$),
    _next: null, //new Int32Array($$_NEXT_LEN_$$),
    _action: null, // new Int32Array($$_ACTION_LEN_$$),
    _eqc: null, //new Int32Array($$_EQC_LEN_$$),
    _str_to_arr : function (strs, arrs) {
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
    }
};

function MultipartParserBase(boundary) {
    EventEmitter.call(this);

    this.chunk_queue = [];
    this.chunk_queue_size = 0;

    this.end = 0;
    this.idx = new Uint32Array(2);
    this.c_idx = new Uint32Array(2);
    this.chr = -1;

    this.__cd__ = false;
    this.__ct__ = false;
    this.__ct_bf__ = [];
    this.__content_type__ = null;
    this.__bd__ = false;
    this.__name__ = null;
    this.__nm_bf__ = [];
    this.__fn_bf__ = [];
    this.__filename__ = null;
    this.__file__ = null;

    this.__bound_i__ = 0;
    this.__boundary__ = new Buffer(boundary, "ascii");

    /*
     * runtime variables
     */
    this.yystate = 0;
    this.yyaction = 0;
    this.yystart_idx = new Uint32Array(2);
    this.yyend_idx = new Uint32Array(2);

    this.yypre_action = 0;
    this.yypaused = false;

    this.yycomplete = false;

}
util.inherits(MultipartParserBase, EventEmitter);

MultipartParserBase.TABLE = TABLE;

MultipartParserBase.prototype = {
    read_ch: function () {
        var i0 = this.idx[0],
            i1 = this.idx[1],
            chunk = this.chunk_queue[i0],
            len = this.chunk_queue.length -1;
        if(i1 >= chunk.length && i0 >= len) {
            return -1;
        }

        this.chr = chunk[i1];
        this.c_idx[0] = i0;
        this.c_idx[1] = i1;

        i1++;
        this.idx[1] = i1;
        if(i1 >= chunk.length) {
            if(i0 < len) {
                this.idx[0]++;
                this.idx[1] = 0;
            }
        }

        return this.chr;
    },
    do_lex: function () {
        var go_on = true;
        var DEBUG_COUNT = 0;
        while (go_on && DEBUG_COUNT++ < 1000000) {

            if(!this.yypaused) {
                this.yystate = this.i_s;
                this.yyaction = ACT_TYPE.NO_ACTION;
                this.yystart_idx[0] = this.idx[0];
                this.yystart_idx[1] = this.idx[1];
                this.yypre_action = ACT_TYPE.NO_ACTION;
            } else {
                this.yypaused = false;
            }


            while (true && DEBUG_COUNT++ < 1000000) {
                if (this.read_ch() < 0) {
                    /*
                     * 如果当前chunk已经读完了
                     */
//                    if (pre_action >= 0) {
//                        action = pre_action;
//                        yylen = pre_act_len;
//                        this.idx = pre_idx + pre_act_len;
//                    } else if (pre_idx < this.end) {
//                        this.idx = pre_idx + 1;
//                    }
//                    if (pre_idx >= this.end) {
//                        go_on = false;
//                    }
                    if(this.yycomplete) {
                        if(this.yypre_action >= 0) {
                            this.yyaction = this.yypre_action;
                        } else {
                            this.yyaction = ACT_TYPE.UNMATCH_CHAR;
                        }
                    } else {
                        this.yypaused = true;
                    }
                    go_on = false;
                    //直接退出函数.
                    break;
                }

                var eqc = TABLE._eqc[this.chr];
                if (eqc === undefined) {
//                    if (pre_action >= 0) {
//                        action = pre_action;
//                        yylen = pre_act_len;
//                        this.idx = pre_idx + pre_act_len;
//                    } else {
//                        action = ACT_TYPE.UNKNOW_CHAR;
//                    }
                    /**
                     * 流保证了不会出现未知等价类。如果出现了，
                     * 可能是bug。为了防止意外，出现时统一当作流格式错误。
                     */
                    util.error('strange thing happens at eqc.');
                    this.yyaction = ACT_TYPE.UNKNOW_CHAR;
                    break;
                }
                var offset, next = -1, s = this.yystate;

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
                    if (this.yypre_action >= 0) {
                        this.yyaction = this.yypre_action;
                        var _0 = this.yyend_idx[0];
                        var _1 = this.yyend_idx[1] + 1;
                        if(_1 >= this.chunk_queue[_0].length) {
                            _0++;
                            _1 = 0;
                        }
                        this.idx[0] = _0;
                        this.idx[1] = _1;
                    } else {
                        this.yyaction = ACT_TYPE.UNMATCH_CHAR;
                        /*
                         * 由于出现unmatch将会结束整个parser，所以不需要处理恢复this.idx到this.yystart_next了。
                         */
//                        this.idx[0] = this.yystart_next[0];
//                        this.idx[1] = this.yystart_next[1];
                    }
                    //跳出内层while，执行对应的action动作
                    break;
                } else {
                    this.yystate = next;
                    this.yyaction = TABLE._action[next];
                    if (this.yyaction >= 0) {
                        /**
                         * 如果action>=0，说明该状态为accept状态。
                         */
                        this.yypre_action = this.yyaction;
                        this.yyend_idx[0] = this.c_idx[0];
                        this.yyend_idx[1] = this.c_idx[1];
                    }
                }
            }

            if(!this.yypaused) {
                this.__action(this.yyaction);
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

_.extend(MultipartParserBase.prototype, Funcs);