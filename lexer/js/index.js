
// var sa=new _s("A");
// var sb=new _s("B");
// var sc=new _s("C");
// var sd=new _s("D");
// var se=new _s(true,"E");
//
// sa.addMove("a",sb);
// sa.addMove("b",sc);
// sb.addMove("a",sb);
// sb.addMove("b",sd);
// sc.addMove("a",sb);
// sc.addMove("b",sc);
// sd.addMove("a",sb);
// sd.addMove("b",se);
// se.addMove("b",sc);
// se.addMove("a",sb);
//
// var nfa=new Alice.NFA(sa,se);
// nfa.addState(sa,sb,sc,sd,se);

function quickAddMove(table){
	for(var i=0;i<table.length;i++){
		var l=table[i];
		s[l[0]].addMove(l[1],s[l[2]]);
	}
}

r=null;
function doCheck(){
	var reg_str=$.trim($("#regexp").val());
	var txt = $("#text").val();
	if(r===null || r.toString()!==reg_str){
		$.dprint("new regexp:"+reg_str);
		r=new Alice.RegExp(reg_str);
	}
	if(r.test(txt)===true){
		$("#result").removeClass("failure").html("Success!<br/><i>"+txt+"</i> matches <i>"+reg_str+"</i>");
	}else{
		$("#result").addClass("failure").html("Failure!<br/><i>"+txt+"</i> does't match <i>"+reg_str+"</i>");
	}
}
