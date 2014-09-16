$module_name CT

CT_VAR [\a\d\/\-]

$$

CT_VAR {
    if(!this._ct()) {
        this._error();
        return;
    }
}

CRLF {
    this._ct_finish();
    this.yygoto(MAIN::DEFAULT);
}

$$