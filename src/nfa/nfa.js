(function(A, C, N, D, T, U) {
	/**
	 * @author	Yuhang Ge
	 * @email	abraham1@163.com
	 * @address	software institute, nanjing university
	 * @blog	http://xiaoge.me
	 */

	/**
	 * @class NFAState
	 * nfa状态类
	 */
	N.NFAState = function(isAccept, name) {
		this.base(isAccept, name);
		this.id = N.NFAState.__auto_id__++;
		this.move = null;
		this.e_moves = [];
	}
	N.NFAState.__auto_id__ = 0;
	N.NFAState.prototype.toString = function() {
		var str = this.callBase('toString');
		str += "【";
		if(this.move)
			str += this.move[0].toString() + "->" + this.move[1].id + ";";
		for(var i = 0; i < this.e_moves.length; i++)
			str += C.Input.e.toString() + "->" + this.e_moves[i].id + ";";
		str += "】";
		return str;
	}
	N.NFAState.prototype = {
		getMove : function(input) {
			if(input === C.Input.e)
				return this.e_moves;
			else if(this.move && this.move[0].isFit(input))
				return this.move[1];
			else
				return null;

		},
		addMove : function(input, next) {
			if(input === C.Input.e)
				this.e_moves.push(next);
			else {
				if(this.move)
					throw "aready have move in nfastate!";
				else
					this.move = [input, next];
			}
		}
	}
	U.inherit(N.NFAState, C.State);

	/**
	 * nfa类
	 */
	N.NFA = function(start, finish) {

		this.states = [];

		this.start = start;
		this.finish = finish;
	}
	N.NFA.prototype = {
		copy : function() {
			var targets = [];
			var src;
			for(var i = 0; i < this.states.length; i++) {
				src = this.states[i];
				var tar = new N.NFAState(src.isAccept);
				src.target = tar;
				targets.push(tar);
			}
			var rtn = new N.NFA(this.start.target, this.finish.target);
			for(var i = 0; i < this.states.length; i++) {
				src = this.states[i];
				if(src.move)
					targets[i].addMove(src.move[0], src.move[1].target);
				for(var j = 0; j < src.e_moves.length; j++)
					targets[i].addMove(C.Input.e, src.e_moves[j].target);
				rtn.states.push(targets[i]);
			}

			//销毁临时附在state上的指向复制后的对象的指针target
			for(var i = 0; i < this.states.length; i++)
				delete this.states[i].target;

			return rtn;
		},
		addState : function(state) {
			if( state instanceof Array)
				for(var i = 0; i < state.length; i++)
					this.states.push(state[i]);
			else
				for(var i = 0; i < arguments.length; i++)
					this.states.push(arguments[i]);
		},
		toString : function() {
			var rtn = "";
			for(var i = 0; i < this.states.length; i++)
				rtn += this.states[i].toString() + " ; ";
			return rtn;
		}
	}
	/***********************/
	/**
	 * 为Alice.Nfa.NFA添加静态成员函数
	 * 函数作用是对nfa进行运算，用在构造nfa的算法中。
	 * 参看龙书3.7.4节算法3.23(101页)
	 */
	U.extend(N.NFA, {
		/**
		 * 将两个nfa进行并运算，返回一个新的nfa。
		 * r=s|t
		 */
		createOrNFA : function(nfa1, nfa2) {

			var s = new N.NFAState();
			var f = new N.NFAState(true);
			s.addMove(C.Input.e, nfa1.start);
			s.addMove(C.Input.e, nfa2.start);
			nfa1.finish.isAccept = false;
			nfa1.finish.addMove(C.Input.e, f);
			nfa2.finish.isAccept = false;
			nfa2.finish.addMove(C.Input.e, f);
			var rtn = new N.NFA(s, f);
			rtn.addState(nfa1.states);
			rtn.addState(nfa2.states);
			rtn.addState(s, f);
			return rtn;

		},
		/**
		 * 将两个nfa进行连接运算，返回一个新的nfa。
		 * r=st
		 */
		createJoinNFA : function(nfa1, nfa2) {
			// $.dprint('*********');
			// $.dprint(nfa1);
			// $.dprint(nfa2);
			var rtn = new N.NFA(nfa1.start, nfa2.finish);
			nfa1.finish.isAccept = false;
			//合并nfa1的接受状态和nfa2的开始状态为同一个状态
			if(nfa2.start.move)
				nfa1.finish.addMove(nfa2.start.move[0], nfa2.start.move[1]);
			for(var i = 0; i < nfa2.start.e_moves.length; i++)
				nfa1.finish.addMove(C.Input.e, nfa2.start.e_moves[i]);

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
		},
		/**
		 * 根据nfa生成一个重复识别的nfa
		 * 即r=s*
		 */
		createStarNFA : function(nfa) {
			$.log(N)
			var s = new N.NFAState();
			var f = new N.NFAState(true);
			s.addMove(C.Input.e, nfa.start);
			s.addMove(C.Input.e, f);
			nfa.finish.isAccept = false;
			nfa.finish.addMove(C.Input.e, nfa.start);
			nfa.finish.addMove(C.Input.e, f);
			var snfa = new N.NFA(s, f);
			snfa.addState(s, f);
			snfa.addState(nfa.states);

			return snfa;
		},
		/**
		 * 生成一个基本的nfa，只有开始态和接收态两个状态
		 */
		createSingleNFA : function(input) {
			if(input !== C.Input.e) {
				input = new C.Input(C.Input.Type.SINGLE, input);
				Alice.CharTable.addInput(input);
			}
			var s = new N.NFAState();
			var f = new N.NFAState(true);
			s.addMove(input, f);
			var snfa = new N.NFA(s, f);
			snfa.addState(s, f);
			return snfa;
		},
		/**
		 * 处理[]正则符号，生成arr数组中字符的or运算nfa
		 */
		createMultiNFA : function(arr, except) {
			//$.dprint(arr);
			//$.dprint(except);
			var t = except ? C.Input.Type.EXCEPT : C.Input.Type.RANGE;
			var input = new C.Input(t, arr);
			Alice.CharTable.addInput(input);
			var s = new N.NFAState();
			var f = new N.NFAState(true);
			s.addMove(input, f);
			var nfa = new N.NFA(s, f);
			nfa.addState(s, f);
			return nfa;
		},
		/**
		 * 处理连续字符串，通常是由引号包含的部分
		 */
		createStrNFA : function(str) {
			if(str.length === 0)
				return N.NFA.createSingleNFA(C.Input.e);
			var s = new N.NFAState();
			var pre = s, next = null, input = null;
			var nfa = new N.NFA();
			//var f = new N.NFAState(true);
			for(var i = 0; i < str.length; i++) {
				next = new N.NFAState();
				input = new C.Input(C.Input.Type.SINGLE, str.charCodeAt(i));
				Alice.CharTable.addInput(input);
				pre.addMove(input, next);
				nfa.addState(pre);
				pre = next;
			}
			next.isAccept = true;
			nfa.addState(next);
			nfa.start = s;
			nfa.finish = next;
			return nfa;
		},
		/**
		 * 以下两个函数用于从正则到nfa构造时的扩展方法，包括+,?,{}等
		 */
		createNumberNFA : function(nfa, num, from) {
			var rtn = nfa.copy();
			var link = (from == null ? false : true);
			var link_node = [];
			if(from === 0)
				link_node.push(rtn.start);
			for(var i = 1; i < num; i++) {
				if(link === true && i >= from)
					link_node.push(rtn.finish);
				rtn = N.NFA.createJoinNFA(rtn, nfa.copy());
			}
			if(link === true)
				for(var i = 0; i < link_node.length; i++)
					link_node[i].addMove(C.Input.e, rtn.finish);
			return rtn;
		},
		createBoundNFA : function(nfa, low, high) {

			if(low === null || low <= 0)
				low = 0;
			nfa = nfa.copy()

			if(high === null) {
				if(low === 0)
					return N.NFA.createStarNFA(nfa);
				var l = N.NFA.createNumberNFA(nfa, low);
				var rtn = N.NFA.createStarNFA(nfa);
				rtn = N.NFA.createJoinNFA(l, rtn);
				return rtn;
			}
			var rtn = N.NFA.createNumberNFA(nfa, high, low);

			return rtn;
		}
	});

})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility);
