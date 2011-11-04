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
	this.defined = [];
	// \d \D \s \S \w \W .
	this.definedNext = [];
	this.directed = {};
}

Alice.DFAStateMove.prototype.add = function(cond, next) {
	if( typeof cond === 'string') {
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
Alice.DFAStateMove.prototype.get = function(input) {

	var A = Alice.StateMove;
	var H = Alice.Help;
	var j=-1;
	for(var i = 0; i < this.defined.length; i++) {
		switch(this.defined[i]) {
			case A.DIGIT :
				if(H.isDigit(input)) {
					j=i;
				}
				break;
			case A.NOT_DIGIT :
				if(!H.isDigit(input)) {
					j=i;
				}
				break;
			case A.WORD :
				if(H.isWord(input)){
					j=i;
				}
				break;
			case A.NOT_WORD :
				if(!H.isWord(input))
					j=i;
				break;
		}
	}
	if(j!==-1)
		return this.definedNext[j];
	else
		return this.directed[input];

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

$.inherit(Alice.DFAState, Alice.State);

Alice.DFA = function(start, finish) {
	this.states = [];
	this.start = start;
	this.finish = finish;
}

Alice.DFA.prototype.addState = function(state) {
	if( state instanceof Array)
		for(var i = 0; i < state.length; i++)
		this.states.push(state[i]);
	else
		for(var i = 0; i < arguments.length; i++)
		this.states.push(arguments[i]);
}