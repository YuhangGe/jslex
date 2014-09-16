$module_name CNT


CNT_BOUNDARY_BEGIN {CRLF}{BOUNDARY_BEGIN}

CNT_VAR [^\r]+

$$

<MAIN::PART> CRLF {
    //todo begin file.
    this.yygoto(DEFAULT);
}

CNT_BOUNDARY_BEGIN {

}

CNT_VAR {

}

OTHER {

}


$$

