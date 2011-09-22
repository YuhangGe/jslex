if(typeof Alice ==='undefined')
	Alice={};
	
Alice.Reg=function(str){
	this.str=str;
	this.dfa=null;
	this.am=new Alice.AutoMata(this.dfa);
}
Alice.Reg.Str2Nfa=new Alice.Str2Nfa();
Alice.Reg.prototype.compile=function(){
	var nfa=Alice.Reg.Str2Nfa.run(this.str);
	$.dprint('-------------');
	$.dprint(nfa);
	$.dprint('--------------');
	this.dfa=Alice.Nfa2Dfa.parse(nfa);
	$.dprint(this.dfa);
}
Alice.Reg.prototype.test=function(value){
	if(this.dfa===null)
		this.compile();
	this.am.dfa=this.dfa;
	return this.am.check(value);
}
