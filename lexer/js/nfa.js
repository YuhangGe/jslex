/**
 * @author	YuhangGe
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://yuhanghome.net
 */

/**
 * nfa.js
 * nfa的数据结构，以及构造nfa时进行的几个运算。参考龙书《编译原理》第二版
 */
if( typeof Alice === 'undefined')
	Alice = {};

//状态转移基类
Alice.StateMove = function() {}

jQuery.extend(Alice.StateMove,{
	DIGIT:0,
	NOT_DIGIT:1,
	SPACE:2,
	NOT_SPACE:3,
	WORD:4,
	NOT_WORD:5,
	LETTER:6,
	NOT_LETTER:7
});

Alice.StateMove.prototype.add=function(cond, next){ throw "virtual function. (statemove add)"; }
Alice.StateMove.prototype.get=function(input){ throw "virtual function. (statemove get)"; }
	
/**
 * 状态基类
 */
Alice.State= function(isAccept, name){
	if( typeof isAccept === 'boolean') {
		this.isAccept = isAccept;
		this.name = name;
	} else if( typeof isAccept === 'string') {
		this.isAccept = false;
		this.name = isAccept;
	}
	this.moves=null;//在子类中初始化
}
Alice.State.prototype.toString = function() {
	if(this.name)
		return this.name + '(' + this.id + ')' + (this.isAccept === true ? "[accept]" : "");
	else
		return this.id + (this.isAccept === true ? "[accept]" : "");
}
Alice.State.prototype.equals = function(state) {
	return this.id === state.id;
}
Alice.State.prototype.addMove = function(cond, next) {
	if( typeof next !== 'undefined')
		this.moves.add(cond, next);
	else
		this.moves.add(cond);
}
Alice.State.prototype.getMove = function(input) {
	return this.moves.get(input);
}

/**
 * NFA 状态转移类
 */
Alice.NFAStateMove=function(){
	this.moves=[];
}
Alice.NFAStateMove.prototype.add=function(cond, next){
	//$.dprint("cond:"+cond);
	this.moves.push([cond,next]);
}
Alice.NFAStateMove.prototype.get=function(input){
	var rtn =  [];
	for(var i = 0; i < this.moves.length; i++) {
		if(this.moves[i][0] === input)
			rtn.push(this.moves[i][1]);
	}
	return rtn;
}

jQuery.inherit(Alice.NFAStateMove, Alice.StateMove);

/**
 * nfa状态类
 */
Alice.NFAState = function(isAccept, name) {
	this.base(isAccept,name);
	this.id = Alice.NFAState.__auto_id__++;
	this.moves = new Alice.NFAStateMove();
}
Alice.NFAState.__auto_id__ = 0;

jQuery.inherit(Alice.NFAState,Alice.State);

/**
 * nfa类
 */
Alice.NFA = function(start, finish) {

	this.states = [];
	this.inputs = [];
	this.start = start;
	this.finish = finish;
}
Alice.NFA.prototype.copy = function() {
	var targets = [];
	var src;
	for(var i = 0; i < this.states.length; i++) {
		src = this.states[i];
		var tar = new Alice.NFAState(src.isAccept);
		src.target = tar;
		targets.push(tar);
	}
	var rtn = new Alice.NFA(this.start.target, this.finish.target);
	for(var i = 0; i < this.states.length; i++) {
		src = this.states[i];
		for(var j = 0; j < src.moves.length; j++) {
			var m = src.moves[j];
			targets[i].addMove(m.input, m.next.target);
		}
		rtn.states.push(targets[i]);
	}
	for(var i = 0; i < this.inputs.length; i++)
	rtn.inputs.push(this.inputs[i]);

	//销毁临时附在state上的指向复制后的对象的指针target
	for(var i = 0; i < this.states.length; i++)
	delete this.states[i].target;

	return rtn;
}
Alice.NFA.prototype.addState = function(state) {
	if( state instanceof Array)
		for(var i = 0; i < state.length; i++)
		this._add_state(state[i]);
	else
		for(var i = 0; i < arguments.length; i++)
		this._add_state(arguments[i]);
}
/**
 * 将状态增加到状态集中，同时，将该状态的输入符存到nfa的输入符号集中，
 * 这样做是为了在nfa转换dfa时需要使用nfa的输入符号集
 */
Alice.NFA.prototype._add_state = function(s) {
	this.states.push(s);
	
	//$.dprint(s);
	var m= s.moves.moves;
	//$.dprint("add state "+m.length);
	for(var i = 0; i < m.length; i++) {
		var mi = m[i][0];
		//$.dprint(mi);
		if(mi !== Alice.e && !Alice.Help.inArray(this.inputs, mi)) {
			this.inputs.push(mi);
		}
	}
}
/***********************/
/*
 * 以下几个函数是对nfa进行运算，用在构造nfa的算法中。参看龙书3.7.4节算法3.23(101页)
 */
/*
 * 将两个nfa进行并运算，返回一个新的nfa。
 * r=s|t
 */
Alice.NFA.createOrNFA = function(nfa1, nfa2) {

		var s = new Alice.NFAState();
		var f = new Alice.NFAState(true);
		s.addMove(Alice.e, nfa1.start);
		s.addMove(Alice.e, nfa2.start);
		nfa1.finish.isAccept = false;
		nfa1.finish.addMove(Alice.e, f);
		nfa2.finish.isAccept = false;
		nfa2.finish.addMove(Alice.e, f);
		var rtn = new Alice.NFA(s, f);
		rtn.addState(nfa1.states);
		rtn.addState(nfa2.states);
		rtn.addState(s, f);
		return rtn;

}
/*
 * 将两个nfa进行连接运算，返回一个新的nfa。
 * r=st
 */
Alice.NFA.createJoinNFA = function(nfa1, nfa2) {
	// $.dprint('*********');
	// $.dprint(nfa1);
	// $.dprint(nfa2);
	var rtn = new Alice.NFA(nfa1.start, nfa2.finish);
	nfa1.finish.isAccept = false;
	//合并nfa1的接受状态和nfa2的开始状态为同一个状态
	var m2 = nfa2.start.moves;
	for(var i = 0; i < m2.length; i++) {
		nfa1.finish.addMove(m2[i]);
	}
	//将nfa1的状态和nfa2状态增加到新的nfa中，因为nfa1的开始态和nfa2开始态已经合并，
	//不需要将nfa2的开始态添加。
	rtn.addState(nfa1.states);
	for(var i = 0; i < nfa2.states.length; i++) {
		if(nfa2.states[i].equals(nfa2.start) === false)
			rtn.addState(nfa2.states[i]);
	}
	// $.dprint(rtn);
	// $.dprint('**********');
	return rtn;
}
/*
 * 根据nfa生成一个重复识别的nfa
 * 即r=s*
 */
Alice.NFA.createStarNFA = function(nfa) {
	var s = new Alice.NFAState();
	var f = new Alice.NFAState(true);
	s.addMove(Alice.e, nfa.start);
	s.addMove(Alice.e, nfa.finish);
	nfa.finish.isAccept = false;
	nfa.finish.addMove(Alice.e, nfa.start);
	nfa.finish.addMove(Alice.e, f);
	var snfa = new Alice.NFA(s, f);
	snfa.addState(s, f);
	snfa.addState(nfa.states);

	return snfa;
}
/**
 * 生成一个基本的nfa，只有开始态和接收态两个状态
 */
Alice.NFA.createSingleNFA = function(input) {
	var s = new Alice.NFAState();
	var f = new Alice.NFAState(true);
	s.addMove(input, f);
	var snfa = new Alice.NFA(s, f);
	snfa.addState(s, f);
	return snfa;
}
/*
 * 处理[]正则符号，生成arr数组中字符的or运算nfa
 */
Alice.NFA.createMultiNFA=function(arr){
	if(! arr instanceof Array || arr.length===0){
		return Alice.NFA.createSingleNFA(Alice.e);
	}
	var s = new Alice.NFAState();
	var f = new Alice.NFAState(true);
	for(var i=0;i<arr.length;i++){
		s.addMove(arr[i],f);
	}
	var nfa = new Alice.NFA(s, f);
	nfa.addState(s,f);
	return nfa;
}
/**
 * 处理连续字符串，通常是由引号包含的部分
 */
Alice.NFA.createStrNFA = function(str){
	var s = new Alice.NFAState();
	var pre=s,next=null;
	var nfa=new Alice.NFA();
	//var f = new Alice.NFAState(true);
	for(var i=0;i<str.length;i++){
		next = new Alice.NFAState();
		pre.addMove(str[i],next);
		nfa.addState(pre);
		pre=next;
	}
	next.isAccept=true;
	nfa.addState(next);
	nfa.start=s;
	nfa.finish=next;
	return nfa;
}
/**
 * 以下用于从正则到nfa构造时的扩展方法，包括+,?,{}等
 */
Alice.NFA.createNumberNFA = function(nfa, num) {
	if(!num || num <= 0)
		return Alice.NFA.createSingleNFA(Alice.e);
	nfa = nfa.copy();
	var rtn = nfa, cur = nfa;
	for(var i = 1; i < num; i++) {
		cur = cur.copy();
		rtn = Alice.NFA.createJoinNFA(rtn, cur);
	}
	return rtn;
}
Alice.NFA.createBoundNFA = function(nfa, low, high) {
	nfa = nfa.copy()
	if(!low && !high)
		return nfa;
	if(!high) {
		if(low <= 0)
			return Alice.NFA.createStarNFA(nfa);
		var l = Alice.NFA.createNumberNFA(nfa, low);
		var rtn = Alice.NFA.createStarNFA(nfa);
		rtn = Alice.NFA.createJoinNFA(l, rtn);
		return rtn;
	}
	if(!low || low < 0)
		low = 0;
	if(high <= low)
		return Alice.NFA.createNumberNFA(nfa, low);

	var rtn = Alice.NFA.createNumberNFA(nfa, low);
	for(var i = low + 1; i <= high; i++) {
		rtn = Alice.NFA.createOrNFA(rtn, Alice.NFA.createNumberNFA(nfa, i));
	}
	return rtn;
}
Alice.NFA.createPlusNFA = function(nfa) {
	var c_n = nfa.copy();
	return Alice.NFA.createJoinNFA(c_n, Alice.NFA.createStarNFA(nfa));
}
Alice.NFA.createQuesNFA = function(nfa) {
	var e_n = Alice.NFA.createSingleNFA(Alice.e);
	return Alice.NFA.createOrNFA(e_n, nfa);
}