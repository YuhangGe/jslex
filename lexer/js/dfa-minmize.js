if( typeof Alice === 'undefined')
	Alice = {};

Alice.DfaMinimize = {
	dfa_states : null,
	group_id : null,
	group_id_tmp : null,
	group_set : null,
	group_set_new : null,
	size : 0,
	max_group_id : 0,
	init : function(dfa) {
		this.dfa_states = dfa.states;
		this.accept_states = [];
		this.size = this.dfa_states.length;
		this.group_id = new Int32Array(this.size);
		this.group_id_tmp = new Int32Array(this.size);
		/**
		 * this.size+1:最后一位保存划分的数量
		 */
		this.group_set = new Int32Array(this.size + 1);
		this.group_set_new = new Int32Array(this.size + 1);

		this.group_set[this.size] = 1;
		this.group_set[0] = this.size - 1;
		for(var i = 0; i < this.size; i++) {
			this.dfa_states[i].__minimize_id__ = i;
			if(this.dfa_states[i].isAccept) {
				this.group_id_tmp[i] = -1;
				this.accept_states.push(this.dfa_states[i]);
			}
		}
		this.get_first_group_set();
	},
	swap_index_and_id : function(x, y) {
		var tmp = this.dfa_states[x];
		this.dfa_states[x] = this.dfa_states[y];
		this.dfa_states[y] = tmp;
		this.dfa_states[x].__minimize_id__ = x;
		this.dfa_states[y].__minimize_id__ = y;
		tmp = this.group_id_tmp[x];
		this.group_id_tmp[x] = this.group_id_tmp[y];
		this.group_id_tmp[y] = tmp;
	},
	repartion : function(f, t) {
		for(var i = t; i > f; i--) {
			for(var j = f; j < i; j++) {
				if(this.group_id_tmp[j] < this.group_id_tmp[j + 1]) {
					this.swap_index_and_id(j, j + 1);
				}
			}
			//$.aprint(arr);
		}
		this.group_id[f] = this.max_group_id;
		for(var i = f + 1; i <= t; i++) {
			if(this.group_id_tmp[i] < this.group_id_tmp[i - 1]) {
				this.group_set_new[this.max_group_id] = i - 1;
				this.group_set_new[this.size]++;
				this.max_group_id++;
			}
			this.group_id[i] = this.max_group_id;
		}
		this.group_set_new[this.max_group_id] = t;
		this.group_set_new[this.size]++;
		this.max_group_id++;
	},
	get_group_id_tmp : function(input) {
		for(var i = 0; i < this.size; i++) {
			var next_dfa = this.dfa_states[i].getMove(input);
			var n_id = -1;
			if(next_dfa) {
				n_id = this.group_id[next_dfa.__minimize_id__];
			}
			this.group_id_tmp[i] = n_id;
		}
	},
	get_group_set_new : function() {
		this.max_group_id = 0;
		this.group_set_new[this.size] = 0;
		var f = -1, t = -1;
		for(var s = 0; s < this.group_set[this.size]; s++) {
			f = t < 0 ? 0 : t + 1;
			t = this.group_set[s];
			this.repartion(f, t);
		}
	},
	/**
	 * 判断 ∏(new)是否等于 ∏，既判断新的划分是否等于原来的划分。
	 * 由于算法的执行过程中，划分发生改变的唯一可能是，原始划分中的子组增加了。
	 * 所以划分的改变只能是子组的数量增加。因此只需要判断新划分的子组数是否改变。
	 */
	is_group_set_same : function() {
		return this.group_set_new[this.size] === this.group_set[this.size]
	},
	/**
	 * 令 ∏(new) = ∏，即交换新旧划分。
	 * 因为新旧划分的数据结构是完全一样的数组，只是数组中的数据不一样。
	 * 因此只要简单地交换其引用就行了，不需要拷贝数据。
	 */
	swap_group_set : function() {
		var tmp = this.group_set_new;
		this.group_set_new = this.group_set;
		this.group_set = tmp;
	},
	get_first_group_set : function() {
		this.get_group_set_new();
		this.swap_group_set();
		this.group_set_new[this.size] = this.group_set[this.size];
	},
	parse : function(dfa) {
		var eqc = Alice.CharTable.eq_class;

		var debug = 0;

		this.init(dfa);
		this.output(); outer:
		while(true && debug < 10000000) { inner:
			for(var i = 0; i < eqc.length; i++) {

				if(debug++ > 10000000) {
					break outer;
				}
				this.get_group_id_tmp(Alice.CharTable.getEqc(eqc[i]));
				//$.aprint(this.group_id);
				//$.aprint(this.group_id_tmp);
				this.get_group_set_new();
				//$.aprint(this.group_set);
				//$.aprint(this.group_set_new);
				//$.dprint("*****");
				if(!this.is_group_set_same()) {
					this.swap_group_set();
					this.output();
					continue outer;
				}

			}

			if(this.is_group_set_same())
				break;
			debug++;
		}
		//$.dprint("finish at debug is : %d", debug);
		this.output();

		Alice.DFAState.__auto_id__ = 0;

		var new_size = this.group_set[this.size];
		var new_states = new Array(new_size);
		for(var i = 0; i < new_size; i++) {
			new_states[i] = new Alice.DFAState(i.toString());
		}
		
		var new_start = new_states[this.group_id[dfa.start.__minimize_id__]];
		for(var i = 0; i < new_size; i++) {
			var old_s = this.dfa_states[this.group_set[i]];
			for(var j = 0; j < old_s.input.length; j++) {
				var new_next = this.group_id[old_s.next[j].__minimize_id__];
				//$.dprint("new next %d",new_next);
				new_states[i].addMove(old_s.input[j],new_states[new_next]);
			}
		}
		for(var i=0;i<this.accept_states.length;i++){
			new_states[this.group_id[this.accept_states[i].__minimize_id__]].isAccept = true;
		}
		return new Alice.DFA(new_start,new_states);

	},
	output : function() {
		var d_id = [];
		for(var i = 0; i < this.size; i++)
		d_id.push(this.dfa_states[i].id);
		$.aprint(d_id);
		$.aprint(this.group_id);
		$.aprint(this.group_set);
		$.dprint("-------------");
	}
}