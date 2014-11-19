$case_ignore true

NEW_LINE \n
OTHER [^\n]+

$$

NEW_LINE line_number++;
OTHER {}

$$

$start { line_number = 1; }

$finish { console.log("Total Line Count："+line_number); }
