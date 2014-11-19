JSLex
=====
Javascript Lexical Analyzers("scanners" or "lexers") Generator

See chinese version README [here](https://github.com/YuhangGe/jslex/blob/master/README_ch.md)([查看中文版本README](https://github.com/YuhangGe/jslex/blob/master/README_ch.md))

Install
====
npm install -g jslex

Usage
====

`jslex lex_file [-t template_file] [-o output_file]`

* lex_file          lex file to convert.
* template_file     template file to use. default use nodejs template file, see `template/node.tpl.txt`
* output_file       generated file to save. default use same filename as lex file.

Example
====

1.define your lex rules and actions. see `demo/find_jslex.lex`

```
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

```

2.Use command `jslex find_jslex.lex`, file `find_jslex.js` will be created.
3.Use command `./find_jslex.js test_find_jslex.txt`. content of `test_find_jslex.txt` is bellow:

```
Hello everyone, I'm js_Lex.

"You are js_lex?!"

葛

Yes, I'm js_lex, no one else can be JS_LEX.
```

4.Final, you can see the output is:

```
Finding word 'js_lex' with ignore case option.

Found 'js_Lex' at 20
Found 'js_lex' in quotes at 38
unknow char: 葛
Found 'js_lex' at 61
Found 'JS_LEX' at 88

Done. Found word 'js_lex' 1 times in quotes and 4 total times!
```

Lex Rule
=====
Same as classic [Lex](http://en.wikipedia.org/wiki/Lex_(software)).
JSLex support some pre-defines like regex:

* \\d	digit, 0-9
* \\D 	not digit
* \\s	empty char, include space and \f\n\r\t\v
* \\S   not empty char
* \\w 	word, a-zA-Z_
* \\W   not word
* \\a   alpha letter, a-zA-Z
* \\A   not alpha letter
* \\u   upper letter, A-Z
* \\U   not upper letter
* \\l   lower case letter, a-z
* \\L   not lower case letter
* . 	any char except \n

JSLex also support combine defined rules. surround it by \{ and \}. For example:

```
DIGIT   \d
INT     {DIGIT}+
FLOAT   {INT}(\.{INT})?
```

JSLex support state, so it can generate more than just a lexer. See example above.

Argument
====
you can specify argument at the begining of lex file. jslex support follow arguments:

* $case_ignore  ignore letter lower or upper case, default is false.
* $lexer_name   lexer_name, default is JSLexer
* $argument     usage `$argument key value`, store key-value pair for later use.
* $include_dir  jslex support multiple files. we will discuss it later.

Multiple Files
====
JSLex support deal with multiple files. So you can make your project modularization.

//todo: complete doc

Bug & Todo
===

* combine with
