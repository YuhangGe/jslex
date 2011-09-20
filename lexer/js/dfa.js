if(typeof Alice ==='undefined')
	Alice={};

Alice.DFAState=function(isAccept,name){
	this.base(isAccept,name);
	this.nfaset=[];
	this.tag=false;
}

$.inherit(Alice.DFAState,Alice.NFAState);

Alice.DFA=function(start,finish){
	this.base(start,finish)
}

/**
 * 重写基类的函数，将状态增加到状态集中，不需要同时生成输入符集。
 */
Alice.DFA.prototype._add_state=function(s){
	this.states.push(s);
}

$.inherit(Alice.DFA,Alice.NFA);

