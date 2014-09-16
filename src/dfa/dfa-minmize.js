var $ = require('../utility/utility.js');
var D = require('./dfa.js');
var I = require('../table/input-manager.js');

var DfaMinmize;
/**
 * @author	Yuhang Ge
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://xiaoge.me
 */
 /**
  * 对dfa进行压缩，参考龙书第二版中的算法描述。（其实龙书中的算法描述很他喵的上层的，具体实现写得蛋痛，尤其是调试的时候。。。）
  */
module.exports = DfaMinmize = {
	/*
	 * 
	 * size: dfa状态的数量
	 * group_id : 每个dfa状态对应的划分的id
	 * group_id_tmp: 
	 * group_set : 划分的集合。数组中每一个元素，代表该划分的结束位置；
	 *   划分的开始位置，由上一个元素（即上一个划分的结束位置）+1来确定。第一个划分的开始位置默认为0.
	 *   因为划分的总数，最多和总的dfa状态数相同，因此group_set的大小是size+1，
	 *   最后多出来的一位保存划分的实际数量
	 * group_set_new : 
	 */
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
		this.group_id = Int32Array? new Int32Array(this.size) : new Array(this.size);
		this.group_id_tmp = Int32Array? new Int32Array(this.size) : new Array(this.size);
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
				this.accept_states.push(this.dfa_states[i]);
			}
		}
		this.get_first_group_set();
	},
	get_first_group_set : function() {
		
		var act_table = {};
		var max_id = 1,n=0;
		for(var i=0;i<this.size;i++){
			if(this.dfa_states[i].isAccept){
				if(this.dfa_states[i].action){
					var a_id = this.dfa_states[i].action.id, t_id = act_table[a_id];
					if(t_id===undefined){
						t_id = max_id++;
						act_table[a_id] = t_id;
					}
					this.group_id_tmp[i] = t_id;
				}else{
					this.group_id_tmp[i] = -1;
				}
			}else{
				this.group_id_tmp[i] = 0;
			}
		}
		//$.aprint(this.group_id_tmp);
		this.get_group_set_new();
		this.swap_group_set();
		this.group_set_new[this.size] = this.group_set[this.size];
		
		//this.output();
		 
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
			var next_dfa = this.dfa_states[i].getEqcMove(input);
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
	parse : function(dfa) {
		var eqc = I.CharTable.eq_class;

		var debug = 0;

		this.init(dfa);
		//this.output();
		outer:
		while(true && debug < 10000000) {
			for(var i = 0; i < eqc.length; i++) {

				if(debug++ > 10000000) {
					break outer;
				}
				//$.dprint(Alice.CharTable.getEqc(eqc[i]));
				this.get_group_id_tmp(I.CharTable.getEqc(eqc[i]));
				//$.aprint(this.group_id);
				//$.aprint(this.group_id_tmp);
				this.get_group_set_new();
				//$.dprint(this.get_names());
				//$.aprint(this.group_id);
				//$.aprint(this.group_id_tmp);
				//$.aprint(this.group_set);
				//$.aprint(this.group_set_new);
				//$.dprint("*****");
				if(!this.is_group_set_same()) {
					this.swap_group_set();
					//this.output();
					continue outer;
				}

			}

			if(this.is_group_set_same())
				break;
			debug++;
		}
		//$.dprint("finish at debug is : %d", debug);
		//this.output();

		D.DFAState.__auto_id__ = 0;

		var new_size = this.group_set[this.size];
		var new_states = new Array(new_size);
		for(var i = 0; i < new_size; i++) {
			new_states[i] = new D.DFAState(i.toString());
		}

		var new_start_index = this.group_id[dfa.start.__minimize_id__];
		var new_start = new_states[new_start_index];
		for(var i = 0; i < new_size; i++) {
			var old_s = this.dfa_states[this.group_set[i]];
			for(var j = 0; j < old_s.input.length; j++) {
				var new_next = this.group_id[old_s.next[j].__minimize_id__];
				//$.dprint("new next %d",new_next);
				new_states[i].addMove(old_s.input[j], new_states[new_next]);
			}
		}
		for(var i = 0; i < this.accept_states.length; i++) {
			var gid = this.group_id[this.accept_states[i].__minimize_id__];
			new_states[gid].isAccept = true;
			if(!this.accept_states[i].action)
				continue;
			if(!new_states[gid].action)
				new_states[gid].action = this.accept_states[i].action;
			else if(new_states[gid].action !== this.accept_states[i].action){
				throw "最小化DFA时出现问题，Action丢失。";
			}
		}

//		$.log("dfa minimized. %d states to %d states.", this.size, new_size);
		var new_dfa = new D.DFA(new_start, new_states);
		//new_dfa.startIndex = new_start_index;
		return new_dfa;
	},
	get_names : function(){
		var d_id = [];
		for(var i = 0; i < this.size; i++)
			d_id.push(this.dfa_states[i].name+"("+this.dfa_states[i].id+")");
		return d_id.join(" ");
	},
	output : function() {
		$.dprint(this.get_names());
		$.aprint(this.group_id);
		$.aprint(this.group_set);
		$.dprint("-------------");
	}
};