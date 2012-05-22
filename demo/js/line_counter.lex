$caseignore true

NEW_LINE \n
OTHER .

$$

NEW_LINE line_number++;
OTHER {}

$$

$start { line_number = 1; }

$finish { log("文本总行数："+line_number); }
