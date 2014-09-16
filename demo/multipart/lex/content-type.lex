$module_name CT

CT_BEGIN  Content-Type:\

CT_VAR [\a\d\/\-]

$$

<MAIN::PART> CT_BEGIN {
    if(this._info.ct !== null) {
        //已经出现过content-type了。
        this._error();
        return;
    }
    this.yygoto(DEFAULT);
}

CT_VAR {

}

CRLF {
    //保存和检测content-type
    this.yygoto(MAIN::PART);
}

$$