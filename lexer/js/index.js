
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

$(function() {
	s = [];
	for(var i = 0; i < 11; i++) {
		s[i] = new Alice.NFAState();
	}
	s[10].isAccept = true;

	quickAddMove(
	[
		[0,Alice.e,1],[0,Alice.e,7],[1,Alice.e,2],[1,Alice.e,4],
		[2,'a',3],[3,Alice.e,6],[4,'b',5],[5,Alice.e,6],
		[6,Alice.e,1],[6,Alice.e,7],[7,'a',8],[8,'b',9],[9,'b',10]	
	]
	);
	
	nfa=new Alice.NFA(s[0],s[10]);
	nfa.addState(s);
	
	//console.log(nfa);
	//var dfa=nfa2dfa(nfa);
	//console.log(dfa);
	
	//am=new Alice.AutoMata(dfa);
	
	//console.log(am.check("aa"));
	
	//$.dprint(dfa);
	var str="(ab)*";
	var r=new Alice.Reg(str);
	r.compile();
	
	$.dprint(r.test("abab"));
});
