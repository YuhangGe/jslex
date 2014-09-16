$module_name CD


NAME_BEGIN  ;\ name=\"

VAR [\a\d\.-_]

VAR_END   \"

FILE_BEGIN  ;\ filename=\"


$$



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

