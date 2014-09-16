$module_name BOUND

BOUNDARY_ID [\a\d-]

END {BOUNDARY_BEGIN}{CRLF}

$$

BOUNDARY_ID {

    switch(this._bd_check()) {
        case 1:
            this.yygoto(STREAM::DEFAULT);
            break;
        case 2:
            this._error();
            break;
        default:
            break;
    }

}

CRLF {
    if(!this._bd_finish()) {
        this._error();
        return;
    } else {
        this.yygoto(MAIN::DEFAULT);
    }
}

END {
    if(!this._bd_finish()) {
        this._error();
        return;
    } else {
        this._end_parse();
        return;
    }
}

$$

