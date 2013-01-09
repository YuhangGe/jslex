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
		
	var temp_file = argv[2], lex_file = argv[3], js_file = argv[4], fs = require("fs");
	Alice.Dfa2Src.template = temp_file;
	var lex_cnt = fs.readFileSync(lex_file,"utf8");
	fs.writeFileSync(js_file, Alice.parse(lex_cnt),"utf8");
	console.log("convert finish.");
})();
