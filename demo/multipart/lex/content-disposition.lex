$module_name CD


NAME_BEGIN  ;\ name=\"

VAR [\a\d\.-_]

VAR_END   \"

FN_BEGIN  ;\ filename=\"


$$


NAME_BEGIN {
    this._name_begin();
    this.yygoto(NAME);
}

<NAME> VAR {
    if(!this._name()) {
        this._error();
        return;
    }
}

<NAME> VAR_END {
    this._name_end();
    this.yygoto(DEFAULT);
}


FN_BEGIN {
    this.yygoto(FN);
}

<FN> VAR {
    if(!this._fn()) {
        this._error();
        return;
    }
}

<FN> VAR_END {
    this._fn_end();
    this.yygoto(DEFAULT);
}

CRLF {
    if(!this._cd_finish()) {
        this._error();
        return;
    } else {
        this.yygoto(MAIN::DEFAULT);
    }
}


$$

