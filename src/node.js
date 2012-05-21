function echo_help(){
	console.log("AliceLex-JavaScript词法分析器生成工具");
	console.log("使用方法：node alicelex-node.js lex_file js_file");
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
		
	var lex_file = argv[2], js_file = argv[3], fs = require("fs");
	
	var lex_cnt = fs.readFileSync(lex_file,"utf8");
	fs.writeFileSync(js_file, Alice.parse(lex_cnt),"utf8");
	console.log("convert finish.");
})();
