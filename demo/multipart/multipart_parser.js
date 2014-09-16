var MultipartParserBase = require('./multipart_parser_base.js');
var TABLE = MultipartParserBase.TABLE;

TABLE._base = new Int32Array($$_BASE_LEN_$$);
TABLE._default = new Int32Array($$_DEFAULT_LEN_$$);
TABLE._check = new Int32Array($$_CHECK_LEN_$$);
TABLE._next = new Int32Array($$_NEXT_LEN_$$);
TABLE._action = new Int32Array($$_ACTION_LEN_$$);
TABLE._eqc = new Int32Array($$_EQC_LEN_$$);

TABLE._str_to_arr(["$$_BASE_STR_$$", "$$_DEFAULT_STR_$$", "$$_CHECK_STR_$$", "$$_NEXT_STR_$$", "$$_ACTION_STR_$$", "$$_EQC_STR_$$"], [TABLE._base, TABLE._default, TABLE._check, TABLE._next, TABLE._action, TABLE._eqc]);

var $$_LEX_STATES_$$;

function MultipartParser() {
    MultipartParserBase.call(this);

    //初始状态，init_state，恒为状态表中的第一个起始状态。
    this.i_s = $$_INIT_STATE_$$;

}
util.inherits(MultipartParser, MultipartParserBase);

MultipartParser.prototype = {
    __action : function(action) {
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
};

