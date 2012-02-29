if( typeof Alice === 'undefined')
	Alice = {};
	
Alice.Dfa2Table_2 = {
	def : [],
	base : [],
	next : [],
	check : [],
	action : [],
	init_state_index: -1,
	/**
	 * 对dfa的状态按其输入符集合大小排序。
	 * 排序的目的在于，只可能数量少的集合可能是数量大的集合的子集，
	 * 因此在插入next\check的时候，先插入数量少的集合，
	 * 然后再插入数量多的集合，这样更有可能使得后插入的集合包含已经插入的，
	 * 也就是说，default数组充分利用。
	 */
	sort : function(states){
		for(var i=states.length-1;i>0;i--){
			for(var j=0;j<i;j++){
				if(states[j].input.length>states[j+1].input.length){
					var tmp = states[j];
					states[j] = states[j+1];
					states[j+1] = tmp;
				}
			}
			states[i].__next_id__ = i;
		}
		states[0].__next_id__ = 0;
	},
	check_base : function(input) {
		var base_i = 0; 
	base_loop:
		while(true) {
			for(var i = 0; i < input.length; i++) {
				if(this.next[base_i + input[i]] !== undefined) {
					base_i++;
					continue base_loop;
				}
			}
			break;
		}
		return base_i;

	},
	is_in : function(s1,s2){
		for(var i=0;i<s1.input.length;i++){
            var k = s2.input.indexOf(s1.input[i]);
			if(k===-1 || s1.next[i].__next_id__!==s2.next[k].__next_id__)
				return false;
		}
		return true;
	},
	del_set: function(s1,s2){
		/**
		 * 则从s2中删除s1的元素
		 */
		var tmp_i = [], tmp_n = [];
		for(var i=0;i<s2.input.length;i++){
			if(s1.input.indexOf(s2.input[i])===-1){
				tmp_i.push(s2.input[i]);
				tmp_n.push(s2.next[i]);
			}
		}
		s2.input = tmp_i;
		s2.next = tmp_n;
	},
	parse : function(dfa){
		var sts = dfa.states;
		var len = sts.length;
		this.def.length = len;
		this.base.length = len;
		/*
		 * 首先按输入集的大小从小到到排列，原因见sort函数解释
		 */
		this.sort(sts);
		
		for(var i=0;i<len;i++){
			/**
			 * 依次插入每一个dfa状态
			 * 对每一个dfa状态 i ，首先看它是否包含了之前某个状态，
			 * 如果包含了 x ，则设置default[i] = x，同时把在i中的x元素除去
			 */
			for(var j=i-1;j>=0;j--){
				if(this.is_in(sts[j],sts[i])){
					this.del_set(sts[j],sts[i]);
					this.def[i]=j;
					break;
				}
			}
			/*
			 * 然后尝试将i从0位开始插入，如果有碰撞，则进一位。直到可以完全插入没有碰撞。
			 */
			var ipt = sts[i].input;
			var base_id = this.check_base(sts[i].input);
			for(var j = 0; j < ipt.length; j++) {
				this.next[base_id + ipt[j]] = sts[i].next[j].__next_id__;
				this.check[base_id + ipt[j]] = i;
			}
			this.base[i] = base_id;
		}
        
        dfa.table_base = this.base;
        dfa.table_default = this.def;
		dfa.table_next = this.next;
        dfa.table_check = this.check;
        dfa.table_action = this.action;
        dfa.table_init_state = this.init_state_index;
        //$.aprint(this.base);
		//$.aprint(this.def);
		
		//$.aprint(this.next);
		//$.aprint(this.check);
		
		//var r = (len*2 + this.next.length) / (len * Alice.CharTable.eq_class.length);
		//$.dprint("Dfa2Table: states %d * eqc %d table compressed to base %d + next %d, radio: %f", len, Alice.CharTable.eq_class.length, len, this.next.length, r);
		//if(r >= 1)
			//$.dprint("Oh Fuck!!! radio is not less than 1.")
	}
}
