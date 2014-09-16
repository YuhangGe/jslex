$module_name CD

CD_BEGIN  Content-Disposition:\ form-data

NAME_BEGIN  ;\ name=\"

VAR [\a\d\.-_]

VAR_END   \"

FILE_BEGIN  ;\ filename=\"


$$

<MAIN::PART> CD_BEGIN {
    if(this._info.cd !== null) {
        //已经出现过content-disposition了。
        this._error();
        return;
    }
    this.yygoto(DEFAULT);
}

NAME_BEGIN {
    this.yygoto(NAME);
}

<NAME> VAR {

}

<NAME> VAR_END {
    this.yygoto(DEFAULT);
}


FILE_BEGIN {
    this.yygoto(FILE);
}

<FILE> VAR {

}

<FILE> VAR_END {
    this.yygoto(DEFAULT);
}

CRLF {
    this.yygoto(MAIN::PART);
}


$$

