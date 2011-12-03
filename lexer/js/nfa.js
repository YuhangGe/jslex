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

Alice.NFAInput = function(type, value) {
	this.type = type;
	this.value = value;
}

Alice.NFAInput.prototype.toString = function() {
	if(this.type === Alice.NFAInput.SINGLE || this.type === Alice.NFAInput.EMPTY)
		return this.value.toString();
	else if(this.type === Alice.NFAInput.RANGE) {
		return "[" + this.value.join(",") + "]";
	} else {
		return "^[" + this.value.join(",") + "]";
	}
}
Alice.NFAInput.prototype.isFit = function(input) {
	if(this.type === Alice.NFAInput.SINGLE)
		return this.value === input;
		
	var i = 0, fit = false, expt = this.type === Alice.NFAInput.EXCEPT;
	for( i = 0; i < this.value.length; i++) {
		if(this.value[i] < 0 && Alice.DEF_FUNC[this.value[i]](input)) {
			fit = true;
			break;
		} else if(this.value[i] === input) {
			fit = true;
			break;
		}
	}
	/*
	 * return expt^fit等价于：
	 *   if(expt===true) return !fit;
	 *   else return fit;
	 */
	return expt ^ fit;
}
Alice.NFAInput.SINGLE = 0;
Alice.NFAInput.RANGE = 1;
Alice.NFAInput.EXCEPT = 2;
Alice.NFAInput.EMPTY = 4;
Alice.e = new Alice.NFAInput(Alice.NFAInput.EMPTY, 'ε');

/**
 * 状态基类
 */
Alice.State = function(isAccept, name) {
	this.isAccept = false;
	if( typeof isAccept === 'boolean') {
		this.isAccept = isAccept;
		this.name = name;
	} else if( typeof isAccept === 'string') {
		this.name = isAccept;
	}

}
Alice.State.prototype.toString = function() {
	if(this.name)
		return this.name + '(' + this.id + ')' + (this.isAccept === true ? "[acc]" : "")
	else
		return this.id + (this.isAccept === true ? "[acc]" : "");
}
Alice.State.prototype.addMove = function(input, next) {
	throw "must implement (Alice.State.addMove).";
}
Alice.State.prototype.getMove = function(input) {
	throw "must implement (Alice.State.getMove).";
}
/**
 * nfa状态类
 */
Alice.NFAState = function(isAccept, name) {
	this.base(isAccept, name);
	this.id = Alice.NFAState.__auto_id__++;
	this.move = null;
	this.e_moves = [];
}
Alice.NFAState.__auto_id__ = 0;
Alice.NFAState.prototype.toString = function() {
	var str = this.callBase('toString');
	str += "【";
	if(this.move)
		str += this.move[0].toString() + "->" + this.move[1].id + ";";
	for(var i = 0; i < this.e_moves.length; i++)
		str += Alice.e.toString() + "->" + this.e_moves[i].id + ";";
	str += "】";
	return str;
}
Alice.NFAState.prototype.getMove = function(input) {
	if(input === Alice.e)
		return this.e_moves;
	else if(this.move[0].isFit(input))
		return this.move[1];
	else
		return null;
		
}
Alice.NFAState.prototype.addMove = function(input, next) {
	if(input === Alice.e)
		this.e_moves.push(next);
	else{
		if(this.move) throw "aready have move in nfastate!";
		else this.move = [input, next];
	}
}
jQuery.inherit(Alice.NFAState, Alice.State);

/*
 * 模式的动作类Action，id是用来标识该action的优先级，先声明的模式id小，在lex源码中，当出现
 * 冲突的时候，优先选择id小的。
 */
Alice.Action = function(func) {
	this.id = Alice.Action.__auto_id__++;
	this.func = func;
}
Alice.Action.__auto_id__ = 0;

/**
 * nfa类
 */
Alice.NFA = function(start, finish) {

	this.states = [];

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
		if(src.move)
			targets[i].addMove(src.move[0],src.move[1].target);
		for(var j=0;j<src.e_moves.length;j++)
			targets[i].addMove(src.e_moves[0],src.e_moves[i].target);
		rtn.states.push(targets[i]);
	}

	//销毁临时附在state上的指向复制后的对象的指针target
	for(var i = 0; i < this.states.length; i++)
		delete this.states[i].target;

	return rtn;
}
Alice.NFA.prototype.addState = function(state) {
	if( state instanceof Array)
		for(var i = 0; i < state.length; i++)
		this.states.push(state[i]);
	else
		for(var i = 0; i < arguments.length; i++)
		this.states.push(arguments[i]);
}

Alice.NFA.prototype.toString = function() {
	var rtn = "";
	for(var i = 0; i < this.states.length; i++)
	rtn += this.states[i].toString() + " ; ";
	return rtn;
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
	if(nfa2.start.move)
		nfa1.finish.addMove(nfa2.start.move[0],nfa2.start.move[1]);
	for(var i=0;i<nfa2.start.e_moves.length;i++)
		nfa1.finish.addMove(Alice.e,nfa2.start.e_moves[i]);

	//将nfa1的状态和nfa2状态增加到新的nfa中，因为nfa1的开始态和nfa2开始态已经合并，
	//不需要将nfa2的开始态添加。
	rtn.addState(nfa1.states);
	for(var i = 0; i < nfa2.states.length; i++) {
		if(nfa2.states[i] !== nfa2.start)
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
	s.addMove(Alice.e, f);
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
	if(input !== Alice.e) {
		input = new Alice.NFAInput(Alice.NFAInput.SINGLE, input);
		Alice.CharTable.addInput(input);
	}
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
Alice.NFA.createMultiNFA = function(arr, except) {
	$.dprint(arr);
	$.dprint(except);
	var t = except ? Alice.NFAInput.EXCEPT : Alice.NFAInput.RANGE;
	var input = new Alice.NFAInput(t, arr);
	Alice.CharTable.addInput(input);
	var s = new Alice.NFAState();
	var f = new Alice.NFAState(true);
	s.addMove(input, f);
	var nfa = new Alice.NFA(s, f);
	nfa.addState(s, f);
	return nfa;
}
/**
 * 处理连续字符串，通常是由引号包含的部分
 */
Alice.NFA.createStrNFA = function(str) {
	if(str.length === 0)
		return Alice.NFA.createSingleNFA(Alice.e);
	var s = new Alice.NFAState();
	var pre = s, next = null, input = null;
	var nfa = new Alice.NFA();
	//var f = new Alice.NFAState(true);
	for(var i = 0; i < str.length; i++) {
		next = new Alice.NFAState();
		input = new Alice.NFAInput(Alice.NFAInput.SINGLE, str.charCodeAt(i));
		pre.addMove(input, next);
		nfa.addState(pre);
		pre = next;
	}
	next.isAccept = true;
	nfa.addState(next);
	nfa.start = s;
	nfa.finish = next;
	return nfa;
}
/**
 * 以下用于从正则到nfa构造时的扩展方法，包括+,?,{}等
 */
Alice.NFA.createNumberNFA = function(nfa, num, from) {
	var rtn = nfa.copy();
	var link = (from == null ? false : true);
	var link_node = [];
	if(from === 0)
		link_node.push(rtn.start);
	for(var i = 1; i < num; i++) {
		if(link === true && i >= from)
			link_node.push(rtn.finish);
		rtn = Alice.NFA.createJoinNFA(rtn, nfa.copy());
	}
	if(link === true)
		for(var i = 0; i < link_node.length; i++)
		link_node[i].addMove(Alice.e, rtn.finish);
	return rtn;
}
Alice.NFA.createBoundNFA = function(nfa, low, high) {

	if(low === null || low <= 0)
		low = 0;
	nfa = nfa.copy()

	if(high === null) {
		if(low === 0)
			return Alice.NFA.createStarNFA(nfa);
		var l = Alice.NFA.createNumberNFA(nfa, low);
		var rtn = Alice.NFA.createStarNFA(nfa);
		rtn = Alice.NFA.createJoinNFA(l, rtn);
		return rtn;
	}
	var rtn = Alice.NFA.createNumberNFA(nfa, high, low);

	return rtn;
}