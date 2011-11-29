/**
 * @author	YuhangGe
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://yuhanghome.net
 */

/**
 * dfa.js
 * dfa的数据结构。继承自nfa的相关类，因为具体近乎一样的性质。参考龙书《编译原理》第二版
 */
if( typeof Alice === 'undefined')
	Alice = {};

Alice.DFAStateMove = function() {
	//预定义的字符，包括： \d \D \s \S \w \W \a \A \l \L \u \U .
	this.defined = [];
	this.definedNext = [];
	//[^]排除语法
	this.excepted = [];
	this.exceptedNext = [];
	//直接单字符
	this.directed = {};
}

Alice.DFAStateMove.prototype.add = function(cond, next) {
	if( cond instanceof Array) {
		if(this.excepted.indexOf(cond) === -1) {
			this.excepted.push(cond);
			this.exceptedNext.push(next);
		} else
			throw "DFA 状态转移一个输入只能有一个输出！(excepted)";
	} else if( typeof cond === 'string') {
		if(this.directed[cond] == null) {
			this.directed[cond] = next;
		} else
			throw "DFA 状态转移一个输入只能有一个输出！(string)";
	} else {
		if(this.defined.indexOf(cond) === -1) {
			this.defined.push(cond);
			this.definedNext.push(next);
		} else
			throw "DFA 状态转移一个输入只能有一个输出！(defined)";
	}
}
/**
 * 输入input，输出该input对应的转移状态。
 * 在这个实现中，认为DFA的一个输入对就一个输出。首先判断是否满足排除语法，即[^a-z\d\W]这样的条件，
 * 然后判断是否满足预定义的条件跳转，最后判断是否满足单字符直接跳转。
 * 假设当前状态S的转移是  [^abc]->S1，\d->S2，7->S3
 * 如果输入input是7，虽然同时满足三个跳转条件，但按判定先后，最后输出的是S1
 */
Alice.DFAStateMove.prototype.get = function(input) {
	/**
	 * 最后返回直接字符跳转。这里没有判断this.directed中是否有input对应的跳转，
	 * 因为如果没有，会自动返回undefined。
	 */
	//$.dprint('check directed');
	if(this.directed[input])
		return this.directed[input];
	
	/*
	 * 首先看当前状态转移是否有排除语法，即[^xxx]，如果有（即this.excepted.length>0），
	 * 那么对每一个排除转移进行检查，看input是否满足该排除数组的条件。
	 * 每个排除转移的转移条件也是一个数组，如[^a-z\d\W]对应地数组是：a-z的单字符、\d和\w对应的
	 * 在Alice.StateMove.Tag中的数值。对数组中每个数据，如果在Alice.StateMove.Func中存在对应
	 * 判断函数（func!=null），说明该数据是预定义的转移条件（如\d）.如果不存在对应判断函数，说明该数据是
	 * 一个直接的单字符，那么直接看单字符与input是否相等。
	 *
	 */
	var T = Alice.StateMove.Tag;
	var F = Alice.StateMove.Func;

	for(var i = 0; i < this.excepted.length; i++) {
		//$.dprint("check excepted.");
		var e = this.excepted[i];
		var _in = false;
		for(var j = 0; j < e.length; j++) {
			var func = F[e[j]];
			if((func != null && func(input) === true) || e[j] === input) {
				_in = true;
				break;
			}
		}
		/*
		 * 如果某个排除转移条件成立，即input不在排除数组中，即input满足[^a-z\d]类似的条件，
		 * 则返回转移后的状态
		 */
		if(_in === false)
			return this.exceptedNext[i];
	}

	/**
	 * 如果input没有满足任何排除转移，再检查是否满足预定义的条件，如\d \D \w等。
	 */
	for(var i = 0; i < this.defined.length; i++) {
		//$.dprint("check defined");
		if(F[this.defined[i]](input) === true) {
			return this.definedNext[i];
		}
	}
	

}
Alice.DFAStateMove.prototype.toString = function() {
	var str = "【";

	for(var i = 0; i < this.excepted.length; i++) {
		var e = this.excepted[i];
		str += "[^"
		for(var j = 0; j < e.length; j++)
			str += Alice.Help._d.get(e[j]);
		str += "]->" + this.exceptedNext[i].id + ',';
	}
	for(var i = 0; i < this.defined.length; i++)
		str += Alice.Help._d.get(this.defined[i]) + "->" + this.definedNext[i].id + ",";

	for(var i in this.directed) {
		str += i + "->" + this.directed[i].id + ","
	}
	str += '】';
	return str;
}
jQuery.inherit(Alice.DFAStateMove, Alice.StateMove);

Alice.DFAState = function(isAccept, name) {
	this.base(isAccept, name);
	this.id = Alice.DFAState.__auto_id__++;
	this.nfaset = [];
	this.tag = false;
	this.moves = new Alice.DFAStateMove();
}
Alice.DFAState.__auto_id__ = 0;

Alice.DFAState.prototype.toString = function() {
	return this.callBase('toString');
}

$.inherit(Alice.DFAState, Alice.State);

Alice.DFA = function(start, finish) {
	this.states = [];
	this.start = start;
}

Alice.DFA.prototype.addState = function(state) {
	if( state instanceof Array)
		for(var i = 0; i < state.length; i++)
		this.states.push(state[i]);
	else
		for(var i = 0; i < arguments.length; i++)
		this.states.push(arguments[i]);
}
Alice.DFA.prototype.toString = function(state) {
	var rtn = "";
	for(var i = 0; i < this.states.length; i++)
	rtn += this.states[i].toString() + " ; ";
	return rtn;
}