$module_name STREAM


FILE_BOUNDARY_BEGIN {CRLF}{BOUNDARY_BEGIN}

FILE_VAR [^\r]+

$$


FILE_BOUNDARY_BEGIN {
    this._bd_begin();
    this.yygoto(BOUND::DEFAULT);
}

FILE_VAR {
    this._file();
}

OTHER {
    this._file();
}


$$

