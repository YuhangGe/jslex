$module_name CT


CT_VAR [\a\d\/\-]

$$

CT_VAR {

}

CRLF {
    //保存和检测content-type
    this.yygoto(MAIN::DEFAULT);
}

$$