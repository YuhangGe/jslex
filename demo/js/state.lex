$caseignore true

KEY "daisy"

STR_QUOTE \"

STR [^"]

OTHER [.\n]

$$

KEY {log("found \""+yytxt+"\" in DEFAULT state");}

STR_QUOTE { tmp_str = ""; this.yygoto(STRING); }

<STRING> STR { tmp_str += yytxt;}

<STRING> KEY { tmp_str += yytxt; log("found \""+yytxt+"\" in STRING state");}

<STRING> STR_QUOTE { log("found string! whole string is \""+ tmp_str +"\""); this.yygoto(DEFAULT); }

OTHER {}

$$

$start { tmp_str = "";}

