if(typeof Alice ==='undefined')
	Alice={};
	
Alice.RegExp=function(str){
	this.str=str;
	this.dfa=null;
	this.am=new Alice.AutoMata(this.dfa);
}

Alice.RegExp.prototype.compile=function(){
	var nfa=Alice.Regular.Str2Nfa.parse(this.str);
	$.dprint('-------------');
	$.dprint(nfa);
	$.dprint('--------------');
	this.dfa=Alice.Nfa2Dfa.parse(nfa);
	$.dprint(this.dfa);
}
Alice.RegExp.prototype.test=function(value){
	if(this.dfa===null)
		this.compile();
	this.am.dfa=this.dfa;
	return this.am.check(value);
}
Alice.RegExp.prototype.toString=function(){
	return this.str;
}
