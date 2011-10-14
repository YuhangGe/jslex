/**
 * @author	YuhangGe
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://yuhanghome.net
 */

/**
 * nfa2dfa.js
 * 将nfa转换为等价dfa，参考龙书《编译原理》第二版3.7.1节算法3.20(97页)
 * 当正则表达式很复杂时，nfa会很复杂，从nfa到dfa的转换会消耗大量时间。
 */
if( typeof Alice === 'undefined')
	Alice = {};


Alice.Nfa2Dfa = {
	//求e-closure和move集合时保存该nfa状态集合中是否有接收状态,
	//如果有，则对应生成的dfa状态也是可接收的。
	is_accept:false,	
	//函数意义同龙书算法3.20对应函数
	e_closure : function(T) {
		return this.move(T, Alice.e, true);
	},
	//函数意义同龙书算法3.20对应函数
	move : function(T, input, empty) {
		var stack = [];
		var e_c = [];
		this.is_accept = false;
		for(var i = 0; i < T.length; i++) {
			stack.push(T[i]);
			if(empty === true)
				e_c.push(T[i]);
			if(T[i].isAccept === true)
				this.is_accept = true;
		}
		while(stack.length > 0) {
			var t = stack.pop();

			var u = t.getMove(input);
			for(var i = 0; i < u.length; i++) {
				if(!Alice._inArray(e_c, u[i])) {
					e_c.push(u[i]);
					if(empty === true)
						stack.push(u[i]);
					if(u[i].isAccept === true)
						this.is_accept = true;
				}
			}
		}
		return e_c;
	},
	//得到dstates中未标记状态
	get_untag_state : function(dstates) {
		for(var i = 0; i < dstates.length; i++)
		if(dstates[i].tag !== true)
			return dstates[i];
		return null;
	},
	
	get_exist : function(set,dstates) {
		//$.dprint('get---')
		//$.dprint(set);
		for(var i = 0; i < dstates.length; i++) {
			//if(set.length==7)
			//$.dprint(dstates[i].nfaset);
			if(Alice._setEqual(dstates[i].nfaset, set) === true) {
				//$.dprint('got');
				return dstates[i];
			}

		}
		return null;
	},
	parse : function(nfa) {
		var dstates=[];
		var inputs = nfa.inputs;
		var s0 = new Alice.DFAState(Alice._n.get());
		s0.nfaset = this.e_closure([nfa.start]);
		s0.isAccept = this.is_accept;
		dstates.push(s0);

		var T;
		while(( T = this.get_untag_state(dstates)) !== null) {
			T.tag = true;
			//$.dprint("untag:"+T.id);
			//$.dprint(T);
			for(var i = 0; i < inputs.length; i++) {
				//$.dprint('move');
				//$.dprint(T.nfaset);
				var tmp_m = this.move(T.nfaset, inputs[i]);
				if(tmp_m.length === 0)
					continue;
				//$.dprint(tmp_m);
				var tmp_s = this.e_closure(tmp_m);
				//$.dprint("e_closure");
				//$.dprint(tmp_s);

				var U = this.get_exist(tmp_s,dstates);
				if(U === null) {
					U = new Alice.DFAState(this.is_accept, Alice._n.get());
					U.nfaset = tmp_s;
					//$.dprint("push "+U.id);
					//$.dprint(U.nfaset);
					dstates.push(U);
				}
				//$.dprint("add "+T.id+" "+inputs[i]+","+U.id);
				T.addMove(inputs[i], U);
			}
		}
		//console.log(dstates);
		var dfa = new Alice.DFA(dstates[0], dstates[dstates.length - 1]);
		dfa.addState(dstates);

		return dfa;
	}
}
