$case_ignore    true
$lexer_name     MyLexer

QUOTE           \"
JS              js
LE              lex
KEY_TO_FIND     {JS}_{LE}
OTHER           [\d\D]

$$

QUOTE  {
    this.yygoto(QUOTE_STATE);
}

<QUOTE_STATE> KEY_TO_FIND {
    console.log("Found '" + this.yytxt + "' in quotes at " + this.yyidx);
    this.q_number++;
    this.total_number++;
}

<QUOTE_STATE>QUOTE {
    this.yygoto(DEFAULT);
}

<QUOTE_STATE> OTHER   {
    // do nothing
}

KEY_TO_FIND     {
    console.log("Found '" + this.yytxt + "' at " + this.yyidx);
    this.total_number++;
}

OTHER   {}

$$
$start       {
    console.log("Finding word 'js_lex' with ignore case option.\n");
}
$construct   {
    this.q_number = 0;
    this.total_number = 0;
}
$finish     {
    console.log("\nDone. Found word 'js_lex' " + this.q_number + " times in quotes and " + this.total_number + " total times!")
}
$unknow     {
    console.warn("unknow char:", String.fromCharCode(this.chr));
}
$unmatch    {
    console.warn("unmath char:", String.fromCharCode(this.chr));
}
