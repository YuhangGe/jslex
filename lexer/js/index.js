
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
	lex = Alice.Lex.Parser.parse(lex_src);
	//$.dprint(lex.dfa);
	var o = Alice.Lex.Dfa2Str.parse(lex.dfa);
	$('#lexOutput').val( o.func + o.table + lex.code);
	eval($('#lexOutput').val());
}

function doCheck2(){
	var txt = $("#text").val();
	r2=new Alice.AutoMata(lexDfa);
	if(r2.check(txt)){
		$("#result").removeClass("failure").html("Success!");
	}else{
		$("#result").addClass("failure").html("Failure!");
	}
}

function runLex(){
	// var TOTAL = 500;
	// var time = 0;
	// for(var i=0;i<TOTAL;i++){
		// var b = new Date().getTime();
		// Daisy.lex($('#runInput').val());
		// var e = new Date().getTime();
		// time += e-b;
	// }
	// var a = time / TOTAL;
	// $.dprint("%d tests, time %d, average time %s",TOTAL,time,a.toString());
	Daisy.lex($('#runInput').val());
	
}


$(function(){
	
	lex = Alice.Lex.Parser.parse("M0 \d+\nM1 a\nM2 b\n$$\nM0 {$.dprint(\"M0\")}\nM1 {$.dprint(\"a\")}\nM2 {$.dprint(\"b\")}\n$$");
	$.dprint(lex);
	o = Alice.Lex.Dfa2Str.parse(lex.dfa);
	$.dprint(o);
	var a=[2,2,2,3,3,5,0xfff0,0x345,9,9,9,9];
	//a= [1,2,3,4,5,6,7,8,9];
	var b=[],s=Alice.Help.array_to_str(a);
	$.dprint(s);
	var s2 = eval("\""+s+"\"");
	Alice.Help.str_to_array(s2,b);
	$.dprint(a);
	$.dprint(b);
});
