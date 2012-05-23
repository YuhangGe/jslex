$.log = function(msg) {
	if( typeof console !== 'undefined') {
		console.log(msg);
	}
}

$(function(){
	var url = location.href,
		m = url.match(/#demo=(\w+)/);
	if(m!=null){
		_showDemo(m[1]);
	}
})

var name_hash = {
	counter : 'line_counter',
	daisy : 'find_daisy',
	state : 'state'
}, demo_hash = {}, cur_name = "", lexer = null;

function log(msg) {
	var out = $('#lex-output');
	out.val(out.val() + msg + "\n");
	out[0].scrollTop = out[0].scrollHeight;
}

function loadDemo(name) {
	return {
		lex : $.ajax("js/" + name_hash[name] + ".lex", {
			async : false
		}).responseText,
		input : $.ajax("js/" + name_hash[name] + ".txt", {
			async : false
		}).responseText
	}
}
function showDemo(name) {
	window.location = "index.html#demo="+name;
	location.reload();
}
function _showDemo(name) {
	if(demo_hash[name] == null) {
		demo_hash[name] = loadDemo(name);
	}
	$("#btn-lex").attr("disabled", false);
	$("#btn-run").attr("disabled", true);
	$("#lex-src").val(demo_hash[name].lex);
	$("#lex-input").val("");
	$("#lex-output").val("");
	cur_name = name;
}

function doLex() {
	$("#btn-lex").attr("disabled", true);
	$("#btn-run").attr("disabled", false);
	var js_src = Alice.parse(demo_hash[cur_name].lex);
	$("#lex-src").val(js_src);
	$("#lex-input").val(demo_hash[cur_name].input);
	
	eval(js_src);
	lexer = new JSLexer();
}
function clearLog(){
	$("#lex-output").val("");
}
function doRun() {
	lexer.lex($("#lex-input").val());
}
