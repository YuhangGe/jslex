
require("./alice.js");
['./utility/utility.js','./core/core.js',
    './core/lexer.js','./nfa/nfa.js',
    './nfa/nfa2dfa.js','./nfa/str2nfa.js',
    './dfa/dfa.js', './dfa/dfa2src.js',
    './dfa/dfa-minmize.js', './table/dfa2table.js',
    './table/input-manager.js'].forEach(function(val) {
       require(val);
    });

function echo_help(){
	console.log("AliceLex-JavaScript词法分析器生成工具");
	console.log("使用方法：node alicelex-node.js template_file lex_file js_file");
}

(function(){
    var argv = process.argv;
    if(argv.length<4){
        echo_help();
        return;
    }else if(argv[2]!=null && (argv[2]==="-h" || argv[2]==='--help')){
        echo_help();
        return;
    }


    var temp_file = argv[2], lex_file = argv[3], js_file = argv[4];
    var $ = Alice.Utility;

    Alice.__RUNTIME__ = "node";
    Alice.__BASE_PATH__ = $.getFileBasePath(lex_file);

	Alice.Dfa.Dfa2Src.template = $.parseFileName(temp_file);
	var lex_cnt = $.readFile($.parseFileName(lex_file));

	$.writeFile($.parseFileName(js_file), Alice.parse(lex_cnt));
	console.log("convert finish.");
})();
