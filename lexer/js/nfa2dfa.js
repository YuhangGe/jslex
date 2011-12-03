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
	closure_hash_table : {},
	move_hash_table : {},
	dstates : [],
	/*
	 * ε_closure(T):计算能够从T中某个NFA状态s开始只通过ε转换到达的NFA状态集合，即∪(s∈T)ε-closure(s)
	 * 在此处实现时，传入的是上一步计算出来的move集，首先通过该move集的hash_key查找是否已经存在，
	 * 如果存在直接返回对应的e_closure；否则，跟据龙书98页的e-closure算法进行计算closure。
	 * 同时，还会该集合中的nfa状态是否有可接受状态，is_accept；以及该集合的哈希值，hash_key
	 */
	e_closure : function(mv) {

		if(this.move_hash_table[mv.hash_key])
			return this.move_hash_table[mv.hash_key];
		/*
		 * T: 上一步计算的move集
		 * is_accept: 
		 * e_c: 
		 * e_id:
		 * new_closure:
		 * hash_key: 
		 */
		var T = mv.move, is_accept = false, stack = [], 
			e_c = [], e_id = [], new_closure = null, hash_key = "";
			
		for(var i = 0; i < T.length; i++) {
			stack.push(T[i]);
			e_c.push(T[i]);
			e_id.push(T[i].id);
			/*if(T[i].isAccept === true){
			 this.is_accept = true;
			 }*/
			is_accept |= T[i].isAccept;
		}
		while(stack.length > 0) {
			var t = stack.pop();
			//$.dprint(t);
			var u = t.e_moves;
			//$.dprint(u);
			for(var i = 0; i < u.length; i++) {
				if(e_id.indexOf(u[i].id) === -1) {
					e_c.push(u[i]);
					stack.push(u[i]);
					e_id.push(u[i].id);
					is_accept |= u[i].isAccept;
				}
			}
		}
		/**
		 * 计算哈希值，同样是对集合中每个状态的id进行排序后连接成字符串
		 */
		hash_key = e_id.sort(function(a,b){
			return a>b;
		}).join("");
		/**
		 * is_accept |= ...运算后，会从boolean型变成int型，即true/false变成1/0
		 * 虽然不知道这个在if判断中是否会有区别(javascript没有类型)，
		 * 但通过以下运算重新转换成boolean型相信不会更坏
		 */
		is_accept = is_accept ? true : false;
		new_closure = {
			'hash_key' : hash_key,
			'closure' : e_c,
			'is_accept' : is_accept
		};
		return new_closure;
	},
	/*
	 * move(T,a):能够从集合T中某个状态s出发通过标号为a的转换到达的NFA状态集合
	 * 会同时计算move集的哈希值(hash_key)，计算方法是将move集中的NFA状态集的id进行排序后连接成字符串
	 */
	get_move : function(T, input) {
		var mv = [];
		var mv_id = [];
		for(var i = 0; i < T.length; i++) {
			var m = T[i].getMove(input);
			if(m && (mv.indexOf(T[i]) === -1)) {
				mv.push(m);
				mv_id.push(m.id);
			}
		}
		if(mv.length === 0)
			return null;
		var hash_key = mv_id.sort(function(a, b) {
			return a > b;
		}).join("");
		return {
			'hash_key' : hash_key,
			'move' : mv
		};
	},
	//得到dstates中未标记状态
	get_untag_state : function() {
		for(var i = 0; i < this.dstates.length; i++)
		if(!this.dstates[i].tag)
			return this.dstates[i];
		return null;
	},
	add_dfa_state : function(dfastate, hash_key) {
		this.dstates.push(dfastate);
		dfastate.tag = false;
		this.closure_hash_table[hash_key] = dfastate;
	},
	parse : function(nfa) {
		this.dstates.length = 0;
		this.closure_hash_table = {};
		this.move_hash_table = {};
		/*
		 * 得到等价类
		 */
		var eqc = Alice.CharTable.eq_class;

		/**
		 * 生成第一个DFA状态
		 */
		var s0 = new Alice.DFAState(Alice.Help._n.get());
		var mv0 = {
			'hash_key':undefined,
			'move' : [nfa.start],
			'is_accept': false
		}
		var ec0 = this.e_closure(mv0);
		s0.nfaset = ec0.closure;
		s0.isAccept = ec0.is_accept;
		this.add_dfa_state(s0, ec0.hash_key);
		/**
		 * 以下过程参考龙书的算法97页算法3.20：子集构造（subset construction）算法
		 */
		var T;
		while(( T = this.get_untag_state()) !== null) {
			T.tag = true;
			$.dprint("untag:"+T.id);
			$.dprint(T);
			/**
			 * 遍历所有输入符，即所有输入符等价类。
			 * 等价类的数量可能会非常多（最大跟字符集数量一样大，如果是Unicode字符集，达到0xffff，
			 * 如果是Ascii字符集，是256）。一个可能的优化是只遍历dfa状态的nfa状态集（即T.nfaset）对应的等价类。
			 * 这样做存在的问题就是，会将等价类管理模块（Alice.EquivalenceManager类）
			 * 和nfa模块耦合起来（当前等价类模块无nfa状态的引用），因为需要知道每个等价类对应了哪些nfa状态
			 * 的输入符，同时，等价类是在不断变化的，变化过程还要动态修改与其相关的nfa状态引用，
			 * 潜在的复杂对于编码没有好处。 
			 */
			for(var i = 0; i < eqc.length; i++) {
				$.dprint('move:'+eqc[i]);
				$.dprint(T.nfaset);
				/**
				 * move(T,a):能够从集合T中某个状态s出发通过标号为a的转换到达的NFA状态集合
				 * 为了效率，在得到该move集合后，会计算集合类NFA状态的所有元素的hash_key，
				 * 这个hash_key会用来索引已经存在的move集。当有相同的move集出现后，
				 * 就不需要二次计算该move集的e_closure
				 */
				var mv = this.get_move(T.nfaset, eqc[i]);
			
				if(!mv)
					continue;
				$.dprint(mv.move);
				/*
				 * 计算move集合的e_closure集合
				 */
				var ec = this.e_closure(mv);
				$.dprint("e_closure");
				$.dprint(ec.closure);
				/**
				 * 从已经存在的e_closure集中查找该e_closure对应的dfa状态，
				 * 如果没有打到，说明该dfa状态还示存在，需要新建
				 */
				var dfa_state = this.closure_hash_table[ec.hash_key];
				$.dprint("dfa_state:"+dfa_state);
				if(!dfa_state) {
					dfa_state = new Alice.DFAState(ec.is_accept, Alice.Help._n.get());
					dfa_state.nfaset = ec.closure;
					$.dprint("push "+dfa_state.id);
					$.dprint(dfa_state.nfaset);
					this.add_dfa_state(dfa_state, ec.hash_key);
				}
				$.dprint("add "+T.id+" "+eqc[i]+","+dfa_state.id);
				T.addMove(eqc[i], dfa_state);
			}
		}
		//console.log(dstates);
		var dfa = new Alice.DFA(this.dstates[0]);
		dfa.addState(this.dstates);

		return dfa;
	}
}