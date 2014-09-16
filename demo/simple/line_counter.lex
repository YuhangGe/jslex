$case_ignore true

NEW_LINE \n
OTHER [^\n]+

$$

NEW_LINE line_number++;
OTHER {}

$$

$start { line_number = 1; }

$finish { console.log("文本总行数："+line_number); }
