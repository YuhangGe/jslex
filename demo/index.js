
function quickAddMove(table){
	for(var i=0;i<table.length;i++){
		var l=table[i];
		s[l[0]].addMove(l[1],s[l[2]]);
	}
}

r=null;
function doCheck(){
	var reg_str=$("#regexp").val();
	var txt = $("#text").val();
	if(r===null || r.toString()!==reg_str){
		$.dprint("new regexp:"+reg_str);
		r=new Alice.RegExp(reg_str);
	}
	if(r.test(txt)){
		$("#result").removeClass("failure").html("Success!<br/><i>"+txt+"</i> matches <i>"+reg_str+"</i>");
	}else{
		$("#result").addClass("failure").html("Failure!<br/><i>"+txt+"</i> does't match <i>"+reg_str+"</i>");
	} 
	// r=Alice.Regular.Str2Nfa.parse(reg_str);
	// $.dprint(r);
	// $.dprint(Alice.CharTable.toString());
	// r2 = Alice.Nfa2Dfa.parse(r);
	// $.dprint(r2);
}

r2=null;
lex = null;

function doLex(){
	var lex_src=$('#lexSrc').val();
	$('#lexOutput').val(Alice.parse(lex_src));
	eval($('#lexOutput').val());
	
	lexer = new JSLexer();
}

function doLighterLex() {
    Alice.setTemplate("dLighter");
    $('#lexOutput').val(Alice.parse($("#lexSrc").val()));
}
function runLex(){
	 //var TOTAL = 1;
	 //var time = 0;
	 //for(var i=0;i<TOTAL;i++){
		// var b = new Date().getTime();
		 lexer.lex($('#runInput').val());
		 //var e = new Date().getTime();
		// time += e-b;
	//}
	//var a = time / TOTAL;
	//$.log("%d tests, time %d, average time %s",TOTAL,time,a.toString());
	//JSLexer.lex($('#runInput').val());
	
}


$(function(){
	
	//lex = Alice.Lex.Parser.parse("M1 a\nM2 abb\nM3 a*b+\n$$\nM1 {$.dprint(\"M1 a: %s\",yytxt)}\nM2 {$.dprint(\"M2 abb:%s\",yytxt)}\nM3 {$.dprint(\"M3 a*b+: %s\",yytxt)}\n$$");
	//$.dprint(lex);
	
	//JSLexer.lex("aabc");
	//o = Alice.Lex.Dfa2Str_2.parse(lex.dfa);
	//$.dprint(o);
});
