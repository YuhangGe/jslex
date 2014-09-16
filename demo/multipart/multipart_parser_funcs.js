
var CT_REG = /^Content-Type:\s*([a-zA-Z0-9\/\-]+)$/;

module.exports = {
    _bd_begin : function() {
        this.__bound_i__ = 0;
    },
    _bd_file_begin : function() {
        this.__bound_i__ = 0;
        //todo 一但boundary不是正确的boundary，
        // 说明碰巧在文件内容里出现了\r\n--字符，
        // 需要把这些东西也要写入文件。
    },
    _bd_file_ : function() {
        if(this.__file__ === null) {
            return 2;
        }

        //todo 一但boundary不是正确的boundary，
        // 说明碰巧在文件内容里出现了\r\n--字符，
        // 需要把这些东西也要写入文件。
        return 1;
    },
    _bd_check : function() {
        if(this.__bound_i__ >= this.__boundary__.length) {
            return this._bd_file_();
        }
        var ix = this.yystart_idx;

        var chk = this.chunk_queue[ix[0]];
        if(chk[ix[1]] !== this.__boundary__[this.__bound_i__]) {
            return this._bd_file_();
        }
        this.__bound_i__++;
        return 0;
    },
    _bd_finish : function() {
        if(this.__bound_i__ === 0) {
            return false;
        }
        if(this.__file__ !== null) {
            //todo 结束当前文件的解析。
            throw '';
        }
        this.__bd__ = true;
        this.__cd__ = false;
        this.__ct__ = false;
        return true;
    },
    _cd_begin : function() {
        this.__name__ = null;
        this.__filename__ = null;
        return this.__cd__ === false;
    },

    _name_begin : function() {
        this.__nm_bf__.length = 0;
    },
    _name : function() {
        if(this.__nm_bf__.length > 1024) {
            return false;
        } else {
            var _0 = this.yystart_idx[0],
                _1 = this.yystart_idx[1];
            this.__nm_bf__.push(this.chunk_queue[_0][_1]);
            return true;
        }
    },
    _name_finish : function() {
        var bf = new Buffer(this.__nm_bf__);
        this.__name__ = bf.toString('utf8');
    },
    _fn_begin : function() {
        this.__fn_bf__.length = 0;
    },
    _fn : function() {
        if(this.__fn_bf__.length > 1024) {
            return false;
        } else {
            var _0 = this.yystart_idx[0],
                _1 = this.yystart_idx[1];
            this.__fn_bf__.push(this.chunk_queue[_0][_1]);
            return true;
        }
    },
    _fn_finish : function() {
        var bf = new Buffer(this.__fn_bf__);
        this.__filename__ = bf.toString('utf8');
    },
    _cd_finish : function() {
        return !(this.__name__ === null || this.__filename__ === null);
    },
    _ct_begin : function () {
        this.__content_type__ = null;
        this.__ct_bf__.length = 0;
        return this.__ct__ === false;
    },
    _ct : function() {
        if(this.__ct_bf__.length > 100) {
            return false;
        } else {
            var _0 = this.yystart_idx[0],
                _1 = this.yystart_idx[1];
            this.__ct_bf__.push(this.chunk_queue[_0][_1]);
            return true;
        }
    },
    _ct_finish : function() {
        var bf = new Buffer(this.__ct_bf__);
        var m = bf.toString().match(CT_REG);
        if(m===null) {
            return false;
        } else {
            this.__content_type__ = m[1];
            return true;
        }
    },
    _file_begin : function() {
        if(!this.__bd__ || !this.__cd__|| !this.__ct__) {
            //没有出现过boundary和content-disposition以及content-type
            //我们要求在multipart中必须指定这两个字段。
            return false;
        }
        //todo begin file.

        return true;
    },
    _file : function() {

    },
    _file_finish : function() {

    }


};