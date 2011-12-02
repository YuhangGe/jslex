/**
 * @author	YuhangGe
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://yuhanghome.net
 */

/**
 * nfa2dfa.js
 * 将nfa转换为等价dfa，参考龙书《编译原理》第二版3.7.1节算法3.20(97页)
 *
 */
if( typeof Alice === 'undefined')
	Alice = {};


Alice.Nfa2Dfa = {
	//求e-closure和move集合时保存该nfa状态集合中是否有接收状态,
	//如果有，则对应生成的dfa状态也是可接收的。
	is_accept:false,
	char_set : null,
	char_size : 0,
	hash_table : {},
	dstates : [],
	//函数意义同龙书算法3.20对应函数
	e_closure : function(T) {
		this.is_accept = false;
		var stack = [];
		var e_c = [];
		for(var i = 0; i < T.length; i++) {
			stack.push(T[i]);
			e_c.push(T[i]);
			/*if(T[i].isAccept === true){
				this.is_accept = true;
			}*/
			this.is_accept |= T[i].isAccept;		
		}
		while(stack.length > 0) {
			var t = stack.pop();
			//$.dprint(t);
			var u = t.e_moves;
			//$.dprint(u);
			for(var i = 0; i < u.length; i++) {
				if(e_c.indexOf(u[i])===-1) {
					e_c.push(u[i]);
					stack.push(u[i]);
					this.is_accept |= u[i].isAccept;
				}
			}
		}
		/**
		 * this.is_accept |= ...运算后，会从boolean型变成int型，即true/false变成1/0
		 * 虽然不知道这个在if判断中是否会有区别(javascript没有类型)，
		 * 但通过以下运算重新转换成boolean型相信不会更坏
		 */
		this.is_accept = this.is_accept?true:false;
		return e_c;
	},
	//函数意义同龙书算法3.20对应函数
	get_move : function(T, input) {
		var e_c = [];
		for(var i=0;i<T.length;i++){
			if(T[i].getMove(input) && (e_c.indexOf(T[i])===-1))
				e_c.push(T[i]);
		}
		return e_c;
	},
	//得到dstates中未标记状态
	get_untag_state : function() {
		for(var i = 0; i < this.dstates.length; i++)
			if(!this.dstates[i].tag)
				return this.dstates[i];
		return null;
	},
	get_hash_key : function(nfaset){
		var h_id = [];
		for(var i=1;i<nfaset.length;i++)
			h_id.push(nfaset[i].id);
		h_id.sort();
		return "["+h_id.join(",")+"]";
	},
	get_exist_state : function(nfaset) {
		return this.hash_table[this.get_hash_key(nfaset)];
	},
	add_dfa_state : function(dfastate){
		this.dstates.push(dfastate);
		dfastate.tag = false;
		this.hash_table[this.get_hash_key(dfastate.nfaset)] = dfastate;
	},
	parse : function(nfa) {
		this.dstates.length = 0;
		this.hash_table = {};
		/*
		 * 每次迭代，需要求当前新的DFA状态对应的NFA状态集所涵盖的输入等价类。
		 * char_set：单向链表， eq_class.length+1，最后一位用来保存链表头
		 */
		if(!this.char_set){
			this.char_set =  new Int16Array(Alice.CharTable.eq_class.length+1);
			this.char_size = this.char_set.length - 1;
		}
		
		/**
		 * 生成第一个DFA状态
		 */
		var s0 = new Alice.DFAState(Alice.Help._n.get());
		s0.nfaset = this.e_closure([nfa.start]);
		s0.isAccept = this.is_accept;
		this.add_dfa_state(s0);
		/**
		 * 以下过程参考龙书中的算法
		 */
		var T;
		while(( T = this.get_untag_state()) !== null) {
			T.tag = true;
			//$.dprint("untag:"+T.id);
			//$.dprint(T);
		
			for(var i = 0; i < inputs.length; i++) {
				//$.dprint('move:'+Alice.Help._d.get(inputs[i]));
				//$.dprint(T.nfaset);
				var tmp_m = this.get_move(T.nfaset, inputs[i]);
				//$.dprint(tmp_m);
				if(tmp_m.length === 0)
					continue;
				
				var tmp_s = this.e_closure(tmp_m);
				//$.dprint("e_closure");
				//$.dprint(tmp_s);

				var dfa_state = this.get_exist_state(tmp_s);
				//$.dprint("U:"+U);
				if(!dfa_state) {
					dfa_state = new Alice.DFAState(this.is_accept, Alice.Help._n.get());
					dfa_state.nfaset = tmp_s;
					//$.dprint("push "+U.id);
					//$.dprint(U.nfaset);
					this.add_dfa_state(dfa_state);
				}
				//$.dprint("add "+T.id+" "+inputs[i]+","+U.id);
				T.addMove(input[i], dfa_state);
			}
		}
		//console.log(dstates);
		var dfa = new Alice.DFA(dstates[0]);
		dfa.addState(dstates);

		return dfa;
	}
}
