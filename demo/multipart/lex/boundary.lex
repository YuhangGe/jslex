$module_name BOUND

BOUNDARY_ID [\a\d-]

END {BOUNDARY_BEGIN}{CRLF}

$$

BOUNDARY_ID {
    if(this._bound_i > this._bound_e) {
        if(this._err_b()) {
            this._error();
        } else {
            this.yygoto(CNT::DEFAULT);
        }
        return;
    }
    if(this._bound_c[this._bound_i] !== this._bound_b[this._bound_i]) {
        if(this._err_b()) {
            this._error();
        } else {
            this.yygoto(CNT::DEFAULT);
        }
        return;
    }
    this._bound_i++;
}

CRLF {
    //开始一个新的multipart，初始化相关变量。

    this.yygoto(MAIN::DEFAULT);
}

END {
    this._end_parse();
}

$$

