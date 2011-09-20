if(typeof Alice ==='undefined')
	Alice={};
Alice._inArray=function(arr,elem){
	var a_t=(elem instanceof Alice.NFAState || elem instanceof Alice.DFAState);
	for(var i=0;i<arr.length;i++)
		if(a_t===true){
			if(arr[i].equals(elem))
				return true;
		}else{
			if(arr[i]==elem)
				return true;
		}
	return false;
}
/**
 * 比较两个集合是否一样
 */
Alice._setEqual=function(set1,set2){
	if(set1.length!==set2.length)
		return false;
	for(var i=0;i<set1.length;i++){
		if(!Alice._inArray(set2,set1[i]))
			return false;
	}
	return true;
}
Alice.e={
	toString:function(){
		return "ε";
	}
}
Alice.Move=function(input,next){
	this.input=input;
	this.next=next;
}
Alice.NFAState=function(isAccept,name){
	this.id=Alice.NFAState.__auto_id__++;
	if(typeof isAccept==='boolean'){
		this.isAccept=isAccept;
		this.name=name;
	}
	else if(typeof isAccept==='string'){
		this.isAccept=false;
		this.name=isAccept;
	}

	this.moves=[];
}
Alice.NFAState.__auto_id__=0;
Alice.NFAState.prototype.addMove=function(input,next){
	if(typeof next !=='undefined')
		this.moves.push(new Alice.Move(input,next));
	else
		this.moves.push(input);
}
Alice.NFAState.prototype.getMove=function(input){
	var rtn=[];
	for(var i=0;i<this.moves.length;i++){
		if(this.moves[i].input===input)
			rtn.push(this.moves[i].next);
	}
	return rtn;
}
Alice.NFAState.prototype.equals=function(state){
	return this.id===state.id;
}
Alice.NFAState.prototype.toString=function(){
	if(this.name)
		return this.name+'('+this.id+')'+(this.isAccept===true?"[accept]":"");
	else
		return this.id+(this.isAccept===true?"[accept]":"");
}
Alice.NFA=function(start,finish){
	
	this.states=[];
	this.inputs=[];
	this.start=start;
	this.finish=finish;
}
Alice.NFA.prototype.addState=function(state){
	if(state instanceof Array)
		for(var i=0;i<state.length;i++)
			this._add_state(state[i]);
	else
		for(var i=0;i<arguments.length;i++)
			this._add_state(arguments[i]);
}
/**
 * 将状态增加到状态集中，同时，将该状态的输入符存到nfa的输入符号集中，
 * 这样做是为了在nfa转换dfa时需要使用nfa的输入符号集
 */
Alice.NFA.prototype._add_state=function(s){
	this.states.push(s);
	for(var i=0;i<s.moves.length;i++){
		var mi=s.moves[i].input;
		if(mi!==Alice.e && ! Alice._inArray(this.inputs,mi)){
			this.inputs.push(mi);
		}
	}
}

/*
 * 将两个nfa进行并运算，返回一个新的nfa。
 * r=s|t
 */
Alice.NFA.createOrNFA=function(nfa1,nfa2){
	var s=new Alice.NFAState();
	var f=new Alice.NFAState(true);
	s.addMove(Alice.e,nfa1.start);
	s.addMove(Alice.e,nfa2.start);
	nfa1.finish.isAccept=false;
	nfa1.finish.addMove(Alice.e,f);
	nfa2.finish.isAccept=false;
	nfa2.finish.addMove(Alice.e,f);
	var rtn=new Alice.NFA(s,f);
	rtn.addState(nfa1.states);
	rtn.addState(nfa2.states);
	rtn.addState(s,f);
	return rtn;
}
/*
 * 将两个nfa进行连接运算，返回一个新的nfa。
 * r=st
 */
Alice.NFA.createJoinNFA=function(nfa1,nfa2){
	
	var rtn=new Alice.NFA(nfa1.start,nfa2.finish);
	nfa1.finish.isAccept=false;
	//合并nfa1的接受状态和nfa2的开始状态为同一个状态
	var m2=nfa2.start.moves;
	for(var i=0;i<m2.length;i++){
		nfa1.finish.addMove(m2[i]);
	}
	//将nfa1的状态和nfa2状态增加到新的nfa中，因为nfa1的开始态和nfa2开始态已经合并，
	//不需要将nfa2的开始态添加。
	rtn.addState(nfa1.states);
	for(var i=0;i<nfa2.states.length;i++){
		if(nfa2.states[i].equals(nfa2.start)===false)
			rtn.addState(nfa2.states[i]);
	}
	
	return rtn;
}
/*
 * 根据nfa生成一个重复识别的nfa
 * 即r=s*
 */
Alice.NFA.createStarNFA=function(nfa){
	var s=new Alice.NFAState();
	var f=new Alice.NFAState(true);
	s.addMove(Alice.e,nfa.start);
	s.addMove(Alice.e,nfa.finish);
	nfa.finish.isAccept=false;
	nfa.finish.addMove(Alice.e,nfa.start);
	nfa.finish.addMove(Alice.e,f);
	var snfa=new Alice.NFA(s,f);
	snfa.addState(s,f);
	snfa.addState(nfa.states);
	
	return rtn;
}
/**
 * 生成一个基本的nfa，只有开始态和接收态两个状态
 */
Alice.NFA.createSingleNFA=function(input){
	
	var s=new Alice.NFAState();
	var f=new Alice.NFAState(true);
	s.addMove(input,f);
	var snfa=new Alice.NFA(s,f);
	snfa.addState(s,f);
	return snfa;
}


