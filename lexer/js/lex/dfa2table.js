if( typeof Alice === 'undefined')
	Alice = {};

Alice.Dfa2Table = {
	base : [],
	next : [],
	check : [],
	check_base : function(input) {
		var base_i = 0; base_loop:
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
	parse : function(dfa) {
		var sts = dfa.states;
		var len = sts.length;
		this.base.length = len;
		for(var i = 0; i < len; i++) {
			sts[i].next_id = i;
		}
		for(var i = 0; i < len; i++) {
			var ipt = sts[i].input;
			var base_id = this.check_base(ipt);
			for(var j = 0; j < ipt.length; j++) {
				this.next[base_id + ipt[j]] = sts[i].next[j].next_id;
				this.check[base_id + ipt[j]] = i;
			}
			this.base[i] = base_id;
		}
		for(var i = 0; i < len; i++) {
			delete sts[i].next_id;
		}

		dfa.table_base = this.base;
		dfa.table_next = this.next;
		$.aprint(this.base);
		$.aprint(this.next);
		$.aprint(this.check);
		var r = (len + this.next.length) / (len * Alice.CharTable.eq_class.length);
		$.dprint("Dfa2Table: states %d * eqc %d table compressed to base %d + next %d, radio: %f", len, Alice.CharTable.eq_class.length, len, this.next.length, r);
		if(r >= 1)
			$.dprint("Oh Fuck!!! radio is not less than 1.")
	}
}