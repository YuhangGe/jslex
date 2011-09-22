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
if(typeof Alice ==='undefined')
	Alice={};

Alice.DFAState=function(isAccept,name){
	this.base(isAccept,name);
	this.nfaset=[];
	this.tag=false;
	this.id=Alice.DFAState.__auto_id__++;
}
Alice.DFAState.__auto_id__=0;
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

