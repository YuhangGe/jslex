if( typeof Alice === "undefined")
	Alice = {};

/**
 * 输入字符的等价划分类
 */
Alice.Equivalence = function(start, end) {
	this.id = Alice.Equivalence.__auto_id__++;
	this.start = start;
	this.end = end;
}
Alice.Equivalence.__auto_id__ = 0;
/**
 *
 * @param size 字符集大小，对于Ascii集是256，对于Unicode集是0x10000
 */
Alice.InputManager = function(size) {
	if(!size)
		this.size = 0x256;
	else
		this.size = size;

	/*
	 * 双向链表，保存等价输入字符集信息
	 */
	this.char_table = new Int16Array(this.size);
	this.table_next = new Int16Array(this.size);
	this.table_prev = new Int16Array(this.size);

	//this.eqc_set = new Int8Array(this.size);
	this.eqc_empty_set = new Int8Array(this.size);
	this.eqc_input_set = new Int8Array(this.size);

	this.eq_class = [];

	this.eqc_max_id = 0;
}
Alice.InputManager.prototype.init = function() {
	for(var i = 0; i < this.size; i++) {
		this.char_table[i] = 0;
		this.table_next = 0;
		this.table_prev = 0;
	}

	this.eq_class.length = 0;
}
Alice.InputManager.prototype.addInput = function(input) {
	if(arguments.length>1){
		for(var i=0;i<arguments.length;i++){
			this.addInput(arguments[i]);
		}
		return;
	}
	//$.dprint("-----0------")
	//$.dprint(input)
	/*
	 * 根据input在eqc_input_set中标记
	 */
	this.eqc_input_set.set(this.eqc_empty_set);
	for(var i = 0; i < input.length; i++) {
		this.eqc_input_set[input[i]] = 1;
	}
	//$.dprint(this.eqc_input_set);
	$.dprint("len %d",this.eq_class.length);
	var eqc_len = this.eq_class.length;
	for(var j = 0; j < eqc_len; j++) {
		//this.get_eqc_set(this.eq_class[j]);
	
		
		var new_prev = 0, change = false, change_at = 0;
		for(var t = this.eq_class[j]; t < this.size; ) {
			
			if(this.eqc_input_set[t] === 1) {
			
				var prev = this.table_prev[t], next=this.table_next[t];
				if(prev>=0){
					this.table_next[prev]=next;
					//$.dprint("%2d next: %2d",prev,next);
				}
				if(next>=0){
					this.table_prev[next]=prev;
					
				}
				if(new_prev === 0) {
					//找到第一个
					
					this.eqc_max_id++;
					if(this.table_prev[t]===-1){
						change = true;
					}
					this.table_prev[t] = -1;
					this.eq_class.push(t);
					//$.dprint(t);
				} else {
					this.table_next[new_prev] = t;
					this.table_prev[t] = new_prev;
					
				}
				this.char_table[t] = this.eqc_max_id;
				this.eqc_input_set[t] = 0;
				new_prev = t;
			}
			if(this.table_next[t] > 0) {
				t = this.table_next[t];
				//$.dprint("t: %2d",t);
			} else{
				if(change)
					change_at = this.table_next[new_prev];
				this.table_next[new_prev] = -1;
				//$.dprint("%2d next: %2d, t:%2d",new_prev,-1,t);
				break;
			}
		}
		if(change){
			this.eq_class[j] = change_at;
			$.dprint("%2d change: %2d",j,change_at);
		}
			
		
		$.dprint(this.char_table);
		$.dprint(this.table_prev);
		$.dprint(this.table_next);
		$.dprint("******");		
	}
	//$.dprint("-----2------")
	this.ins_eqc();
	//$.dprint(this.table_prev);
	//$.dprint(this.table_next);
	//$.dprint(this.char_table);
	//$.dprint(this.eq_class);
	//$.dprint("-----finish------")
}

Alice.InputManager.prototype.ins_eqc = function() {
	var t = 0;
	for( t = 0; t < this.size; t++) {
		if(this.eqc_input_set[t] === 1) {
			break;
		}
	}
	if(t === this.size)
		return;

	this.eqc_max_id++;
	this.char_table[t] = this.eqc_max_id;
	this.table_prev[t] = -1;
	this.eq_class.push(t);
	//$.dprint(t);
	var prev = t;
	for(t++; t < this.size; t++) {
		if(this.eqc_input_set[t] === 1) {
			this.char_table[t] = this.eqc_max_id;
			this.table_next[prev] = t;
			this.table_prev[t] = prev;
			prev = t;
		}
	}
	this.table_next[prev] = -1;

}

Alice.InputManager.prototype.get_eqc_set = function(start) {
	// this.eqc_set.set(this.eqc_empty_set);
	// for(var i = start; i < this.size; ) {
		// this.eqc_set[i] = 1;
		// if(this.table_next[i] > 0) {
			// i = this.table_next[i];
		// } else
			// break;
	// }
}

Alice.InputManager.prototype.getEquival = function() {

}
Alice.InputManager.prototype.output = function() {
	$.dprint("----Output----");
	$.dprint(this.eq_class);
	$.dprint(this.char_table);
	$.dprint(this.table_prev);
	$.dprint(this.table_next);
	$.dprint("----End Output----");
}