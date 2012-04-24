(function(A, C, N, D, T, U) {
/**
 * @author	Yuhang Ge
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://xiaoge.me
 */

/**
 * 
 * dfa的数据结构。参考龙书《编译原理》第二版
 */

D.DFAState = function(isAccept, name) {
	this.base(isAccept, name);
	this.id = D.DFAState.__auto_id__++;
	this.nfaset = [];
	this.tag = false;
	this.input = [];
	this.next = [];
}
D.DFAState.__auto_id__ = 0;

D.DFAState.prototype = {
	toString : function() {
		var str = "【";
		for(var i = 0; i < this.input.length; i++)
			str += this.input[i] + "->" + this.next[i].id + ";";
		str += '】';
		return this.callBase('toString') + str;
	},
	addMove : function(input, next) {
		if(this.input.indexOf(input) < 0) {
			this.input.push(input);
			this.next.push(next);
		} else {
			$.aprint(this.input);
			$.dprint(input);
			console.trace();
			throw "_addMove();DFA 状态转移一个输入只能有一个输出！(defined)";
		}
	},
	getMove : function(input) {
		var eqc = Alice.CharTable.getEqc(input);
		return this.getEqcMove(eqc);
	},
	getEqcMove : function(eqc) {
		var i = this.input.indexOf(eqc);
		if(i < 0)
			return null;
		else
			return this.next[i];
	}
}
U.inherit(D.DFAState, C.State);

D.DFA = function(start, states) {
	this.states = [];
	this.start = start;
	if(states)
		this.addState(states);
}

D.DFA.prototype = {
	addState : function(state) {
		if( state instanceof Array)
			for(var i = 0; i < state.length; i++)
				this.states.push(state[i]);
		else
			for(var i = 0; i < arguments.length; i++)
				this.states.push(arguments[i]);
	},
	toString : function(state) {
		var rtn = "";
		for(var i = 0; i < this.states.length; i++)
			rtn += this.states[i].toString() + " ; ";
		return rtn;
	}
}

})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility);