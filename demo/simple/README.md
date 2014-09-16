Simple Examples
===========

This directory contains simple lexer. Try it follow steps bellow:

1. run `npm install -g jslex`.
2. run `jslex -f ./demo/simple/line_counter.lex -t ./template/node.tpl.txt -o ./demo/simple/line_counter.js`
3. run `node ./demo/simple/line_counter.js test_line_counter.txt`

You can replace `line_counter.lex` in step 2 by other example lex file:

* find_daisy.lex : find the word `daisy` in given text.
* line_counter.lex : count total line number of given text.
* state.lex : user state in lex