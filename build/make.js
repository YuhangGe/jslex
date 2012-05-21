(function(){
	var first_file = "../src/alice.js",
		file_list = ['../src/utility/utility.js','../src/core/core.js',
			'../src/core/lexer.js','../src/nfa/nfa.js',
			'../src/nfa/nfa2dfa.js','../src/nfa/str2nfa.js',
			'../src/dfa/dfa.js', '../src/dfa/dfa2src.js',
			'../src/dfa/dfa-minmize.js', '../src/table/dfa2table.js',
			'../src/table/input-manager.js'],
		node_file = "../src/node.js";
	var fs = require("fs");
	var cnt = fs.readFileSync(first_file,"utf8"), out_js = cnt.replace("$$_RUNTIME_$$",'js'),
		out_node = cnt.replace("$$_RUNTIME_$$","node");
	out_node += "\nvar $ = {log:function(msg){\nreturn;\n}\n};\n";
	
	file_list.forEach(function(val,idx,arr){
		cnt = fs.readFileSync(val,"utf8");
		out_js+=cnt;
		out_node+=cnt;
	});
	
	out_node+= fs.readFileSync(node_file,"utf8");
	
	fs.writeFileSync("../demo/alicelex.js", out_js, 'utf8');
	fs.writeFileSync("../demo/alicelex-node.js", out_node, 'utf8');
	
	console.log("build finish!");
})();
