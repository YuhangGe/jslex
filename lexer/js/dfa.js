if(typeof Alice ==='undefined')
	Alice={};

Alice.DFAState=function(isAccept,name){
	this.base(isAccept,name);
	this.nfaset=[];
	this.tag=false;
}

$.inherit(Alice.DFAState,Alice.NFAState);

Alice.DFA=function(){
	
}


$.inherit(Alice.DFA,Alice.NFA);

