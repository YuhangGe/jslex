if( typeof Alice === 'undefined')
	Alice = {};
	
Alice.Dfa2Table_2 = {
	def : [],
	base : [],
	next : [],
	check : [],
	action : [],

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
				if(states[j].table_input.length>states[j+1].table_input.length){
					var tmp = states[j];
					states[j] = states[j+1];
					states[j+1] = tmp;
				}
			}
			states[i].id = i;
		}
		states[0].id = 0;
	},
	check_base : function(input) {
		var base_id = 0; 
	base_loop:
		while(true) {
			for(var i = 0; i < input.length; i++) {
				if(input[i]===undefined)
					continue;
				if(this.next[base_id + input[i]] !== undefined) {
					base_id++;
					continue base_loop;
				}
			}
			break;
		}
		return base_id;

	},
	/**
	 * 在忽略undefined元素的情况下判断s1集合是否是s2的子集并且非空
	 * 如果s1是空集（即全部是undefined元素【ud_n===s1.table_input.length】）
	 * 也返回false
	 */
	is_in : function(s1,s2){
		var ud_n = 0;
		for(var i=0;i<s1.table_input.length;i++){
			var ele = s1.table_input[i];
			if(ele===undefined){
				ud_n++;
				continue;
			}
            var k = s2.table_input.indexOf(ele);
			if(k===-1 || s1.next[i].id!==s2.next[k].id)
				return false;
		}
		if(ud_n===s1.table_input.length)
			return false;
		else
			return true;
	},
	del_set: function(s1,s2){
		/**
		 * 则从s2中删除s1的元素
		 */
		for(var i=0;i<s1.table_input.length;i++){
			var j = s2.table_input.indexOf(s1.table_input[i]);
			if(j>=0)
				s2.table_input[j] = undefined;
		}
	},
	parse : function(dfa){
		var sts = dfa.states;
		var len = sts.length;
		var input_max = Alice.CharTable.eq_class.length - 1;
		this.def = [];
		this.def.length = len;
		this.base = [];
		this.base.length = len;
		this.action.length = len;
		this.next.length = 0;
		this.check.length = 0;
		
		for(var i=0;i<len;i++){
			sts[i].table_input = Alice.Help.arrCopy(sts[i].input);
		}
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
					$.dprint("s in : %d in %d",j,i);
					break;
				}
			}
			/*
			 * 然后尝试将i从0位开始插入，如果有碰撞，则进一位。直到可以完全插入没有碰撞。
			 */
			var ipt = sts[i].table_input;
			var base_id = this.check_base(ipt);
			for(var j = 0; j < ipt.length; j++) {
				if(ipt[j]===undefined)
					continue;
				this.next[base_id + ipt[j]] = sts[i].next[j].id;
				this.check[base_id + ipt[j]] = i;
			}
			/**
			 * ============
			 * 接下来的代码是为了让next数组的长度足够长。
			 */
			var tmp_off = base_id+input_max;
			this.next[tmp_off] = this.next[tmp_off];
			this.check[tmp_off] = this.check[tmp_off];
			
			
			this.base[i] = base_id;
			
		 	/**
			 * 最后填充action数组
			 */
			this.action[i] = sts[i].isAccept?sts[i].action.id:-1;
			
		}
        
        
        dfa.table_base = this.base;
        dfa.table_default = this.def;
		dfa.table_next = this.next;
        dfa.table_check = this.check;
        dfa.table_action = this.action;
        dfa.table_eqc = Alice.CharTable.char_table;
        dfa.table_init_state = dfa.start.id;
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
