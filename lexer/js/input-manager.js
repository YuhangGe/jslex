if( typeof Alice === "undefined")
	Alice = {};

/**
 * @class EquivalenceManager
 * 输入符管理类，对输入符进行等价类划分。输入符并不储存其字符串字符，而是其对应的编码。
 * 对于Ascii字符集，是0-255，对于Unicode字符集，是0-0xffff.由于字符集数量庞大，
 * 使用数组来实现双向链表操作，从而实现相对高效（时间+内存效率）的等价类管理
 *
 * @param size 字符集大小，对于Ascii集是256，对于Unicode集是0x10000
 */
Alice.EquivalenceManager = function(char_table_size) {
	if(!char_table_size)
		this.size = 256;
	else
		this.size = char_table_size;
	/*
	* 双向链表，保存等价输入字符集信息
	*/
	//保存字符对应的等价类编号
	this.char_table = new Int16Array(this.size);
	//等价类中下一个字符位置
	this.table_next = new Int16Array(this.size);
	//等价类中上一个字符位置
	this.table_prev = new Int16Array(this.size);

	/*
	 * empty_set:恒为0的数组，用来清空其它数组。通过Int8Array的set函数
	 */
	this.empty_set = new Int8Array(this.size + 1);
	/**
	 * 输入字符集，某位置1表示包含该字符。this.size+1，
	 * 额外添加的一位，用来表示字符集中字符个数
	 */
	this.input_set = new Int8Array(this.size + 1);
	/*
	 * 储存字符集和等价类相比较后的结果，是一个单向链表，
	 * 数值是指向下一位的指针。其中链表头保存在额外的this.size+1中
	 */
	this.compare_set = new Int8Array(this.size + 1);
	/*
	 * 等价类的集合，储存的是双向链表的表头集合，每个元素指向char_table中的对应位置，
	 * 该位置是某个等价类的链表头所在位置。通过eq_class，可以遍历所有等价类。
	 */
	this.eq_class = [];
	/*
	 * 等价类的最大编号，会递增，用来给新建的等价类进行编号。
	 */
	this.eqc_max_id = 0;
	/*
	 * 用来保存已经插入过的字符集的hash表，如果已经存在于hash表中，则不需要再进行操作。
	 * 原因是，已经操作过的字符集，在等价类中的存在形式，只可能要么全部元素在一个等价类中，
	 * 要么成为了几个等价类的部分。但不论怎样，当这个字符集再次出现，对当前等价类不会有任何影响。
	 */
	this.hash_table = {};
}
Alice.EquivalenceManager.prototype.addInput = function(nfaInput) {
	if(nfaInput === Alice.e)
		throw "_addInput";
	
	//$.dprint("try add nfainput %s",nfaInput.toString());
	var hash_key = nfaInput.toString();
	if(this.hash_table[hash_key]){
		//$.dprint("aready added!");
		return;
	}else{
		this.hash_table[hash_key]=true;
	}
	if(nfaInput.type === Alice.NFAInput.SINGLE) {
		this.addChar(nfaInput.value);
	} else if(nfaInput.type === Alice.NFAInput.RANGE 
		||nfaInput.type === Alice.NFAInput.EXCEPT) {
		
		this.addCharSet(nfaInput);		
	}

}
Alice.EquivalenceManager.prototype.init = function() {
	for(var i = 0; i < this.size; i++) {
		this.char_table[i] = 0;
		this.table_next = 0;
		this.table_prev = 0;
	}
	this.eq_class.length = 0;
}
/**
 * 插入单个字符
 */
Alice.EquivalenceManager.prototype.addChar = function(input) {
	//查找字符对应的等价类
	var eqc = this.char_table[input];
	if(eqc === 0) {
		/*
		 * 如果没有找到，新建一个等价类
		 */
		this.char_table[input] = ++this.eqc_max_id;
		this.table_next[input] = this.table_prev[input] = -1;
		this.eq_class.push(input);
		return;
	}
	/*
	 * 找到了，先修改原来的等价类：
	 *  如果prev==next==-1说明原等价类已经是单字符，返回
	 *  如果next>0修改next的prev指针
	 *  如果prev>0修改prev的next指针
	 *  如果prev<0，说明字符对应了原来的等价类的链表头，还要修改this.eq_class的对应值
	 */
	var prev = this.table_prev[input], next = this.table_next[input];
	if(prev < 0 && next < 0)
		return;

	if(next > 0)
		this.table_prev[next] = prev;
	if(prev > 0)
		this.table_next[prev] = next;
	else {
		var eqc_idx = this.eq_class.indexOf(eqc);
		this.eq_class[eqc_idx] = next;
	}
	/**
	 * 最后新建等价类
	 */
	this.char_table[input] = ++this.eqc_max_id;
	this.table_next[input] = this.table_prev[input] = -1;
	this.eq_class.push(input);
}
Alice.EquivalenceManager.prototype.addCharSet = function(input) {
	/**
	 * 首先根据input数组，生成输入字符集。通过在this.input_set中标记0和1
	 * 来指明该位置对应的字符是否存在
	 */
	this.create_input_set(input);

	/*
	 * 然后开始执行等价类相关操作
	 */
	for(var j = 0; j < this.eq_class.length; j++) {
		/**
		 * 对比等价类和当前输入符集，在比较的过程中同时会对当前输入符集进行相关操作，
		 * 见eqc_compare函数注释
		 */
		var eqc_c = this.eqc_compare(this.eq_class[j]);

		if(eqc_c < 0) {
			/*
			 * 当前等价类与当前输入字符集没有任何交集，或者等价类是输入符的真子集，
			 * 则说明当前等价类是不需要进行拆分的，直接跳过，继续处理下一个等价类
			 */
			continue;
		} else if(eqc_c === 0) {
			/**
			 * 如果当前input_set和某个等价类全等，那么不需要生成新的等价类，
			 * 也不会再插入新的等价类，直接退出函数
			 */
			return;
		} else {
			/*
			 * 当前等价类与输入字符集有交集且互不为子集，或者输入字符集是等价类真子集，则需要将当前等价类拆分成两个等价类。
			 * 相交的部分成为一个新的等价类，剩下的部分属于原来的等价类。
			 * 在this.eqc_compare函数中，相交部分已经保存在了单向链表this.compare_set中了，
			 * 接下来只需要利用该链表对当前等价类进行拆分
			 */
			this.eqc_partion(j);
		}
	}

	/**
	 * 如果运行到此处，说明有新的等价类需要插入。执行插入函数。
	 */
	this.ins_eqc();
}
Alice.EquivalenceManager.prototype.create_input_set = function(input, except) {
	var size = 0;
	this.input_set.set(this.empty_set);
	for(var i=0;i<this.size;i++){
		if(input.isFit(i)){
			this.input_set[i]=1;
			size++;
		}
	}
	this.input_set[this.size]=size;
	//$.dprint(this.input_set);
}

/**
 * 对当前等价类进行拆分，利用比较结果集compare_set，将当前等价类双向链表拆分成
 * 两个等价类双向链表，其中一个是新构造的，另一个是原始的。
 */
Alice.EquivalenceManager.prototype.eqc_partion = function(eqc) {

	var new_prev = -1;
	for(var t = this.compare_set[this.size]; t < this.size; ) {
		/**
		 * 对原始双向链表进行修改 ，即在原始链表中删除元素t,涉及双向链表的指针操作，不解释了。
		 * 注意当prev<0(即prev=-1)的时候，说明拆分涉及到原始等价类的头，
		 *   这时候要把等价类头索引数组this.eq_class中该等价类对应的索引修改为下一个元素
		 */
		var prev = this.table_prev[t], next = this.table_next[t];
		if(prev < 0 && next < 0) {
			throw ("wrong at eqc_partion!!!");
		}
		if(prev >= 0)
			this.table_next[prev] = next;
		else
			this.eq_class[eqc] = next;
		if(next >= 0)
			this.table_prev[next] = prev;

		/**
		 * 然后利用删除的元素 t 构建新的双向链表。
		 * 如果new_prev<0，构建双向链表头，同时在等价类索引数组this.eq_class中插入新链表的索引。
		 * 如果new_prev>0，已经存在新链表，向链表中插入新元素 t . 涉及双向链表的操作不解释了
		 */
		if(new_prev < 0) {
			//构造新链表的表头
			this.eqc_max_id++;
			this.table_prev[t] = -1;
			this.eq_class.push(t);
		} else {
			//向新链表插入的元素
			this.table_next[new_prev] = t;
			this.table_prev[t] = new_prev;
		}

		this.char_table[t] = this.eqc_max_id;
		new_prev = t;
		/*
		 * 迭代当前元素 t 到下一个，如果为0，说明已经到了链表尾，收尾并退出循环
		 */
		t = this.compare_set[t];
		if(t <= 0) {
			this.table_next[new_prev] = -1;
			break;
		}

	}

}
/**
 * 比较当前等价类和输入符集合，如果全等返回0，没有任何交集或者等价类是输入符的子集则返回-1，有交集返回1
 * 在比较过程中，会将已经处理过的字符，即同时存在于输入符集和等价类中的字符清除，并保存在链表this.compare_set中
 *
 * @param {int} eqc_index 当前等价类链表表头的位置
 * @return {int} 0：全等；1：有交集；-1：无交集或者等价类真蕴含于输入符
 */
Alice.EquivalenceManager.prototype.eqc_compare = function(eqc_index) {
	//清空compare_set
	this.compare_set.set(this.empty_set);
	/*
	 * c:用来保存同时在等价类eqc和输入字符集input_set中的字符个数，
	 *   当该个数和字符集总个数相同时，说明字符集和等价类全等
	 * prev: 用来构建compare_set链表的辅助变量
	 * c_eqc: 当前等价类包含的字符数量，如果该值和c相等，则说明当前等价类是输入符的子集
	 * i_len: 输入字符集的字符个数。
	 */
	var c = 0, prev = -1, c_eqc = 0, i_len = this.input_set[this.size];
	for(var t = eqc_index; t < this.size; ) {
		c_eqc++;
		if(this.input_set[t] === 1) {
			if(c++ > 0) {
				//构建链表指针
				this.compare_set[prev] = t;
			} else {
				//初始设置链表头
				this.compare_set[this.size] = t;
			}
			//将已经处理过的字符，即同时存在于输入符集和等价类中的字符清除
			this.input_set[t] = 0;
			this.input_set[this.size]--;
			prev = t;
		}
		t = this.table_next[t];
		if(t < 0) {
			break;
		}
	}
	/**
	 * 跟据不同的结果返回相关值。
	 * c==0 说明  input_set和等价类的交集是空，等价类不需要拆分，返回-1
	 * c==i_len && c==eqc说明  input_set和等价类全等，等价类不需要拆分，返回 0
	 * c==i_len && c!=eqc说明 input_set是等价类的真子集，等价类需要拆分，返回 1
	 * c!=i_len && c==eqc说明 等价类是input_set的真子集，等价类不需要拆分，返回 -1
	 * 其它情况，说明input_set和等价类有交集但两者互不为子集，等价类需要拆分，返回 1
	 */
	if(c === 0)
		return -1;
	else if(c === i_len && c === c_eqc)
		return 0;
	else if(c === i_len)
		return 1;
	else if(c === c_eqc)
		return -1;
	else
		return 1;
}
/**
 * 插入一个新的等价类，通过输入字符集构造
 */
Alice.EquivalenceManager.prototype.ins_eqc = function() {
	/*
	 * 如果输入字符集为空，直接返回。该条件不会满足，因为在调用ins_eqc函数
	 * 之前已经会保障输入字符不为空集。此处放在这里是为了安全。
	 */
	if(this.input_set[this.size] === 0)
		return;

	this.eqc_max_id++;
	/**
	 * 因为输入字符集是一个简单的通过0和1标记的数组，不是链表，
	 * 需要遍历查找。
	 */
	var t = 0;
	//首先找到第一个字符
	for(; t < this.size; t++)
	if(this.input_set[t] === 1)
		break;
	//通过第一个字符构建链表头
	this.char_table[t] = this.eqc_max_id;
	this.table_prev[t] = -1;
	this.eq_class.push(t);
	//继续查找字符并构建链表
	var prev = t;
	for(t++; t < this.size; t++) {
		if(this.input_set[t] === 1) {
			this.char_table[t] = this.eqc_max_id;
			this.table_next[prev] = t;
			this.table_prev[t] = prev;
			prev = t;
		}
	}
	this.table_next[prev] = -1;

}

Alice.EquivalenceManager.prototype.toString = function() {
	var rtn = "";
	for(var i = 0; i < this.eq_class.length; i++) {
		var arr = [];
		for(var t = this.eq_class[i]; t >= 0; ) {
			arr.push(String.fromCharCode(t));
			t = this.table_next[t];
		}
		rtn += "[" + arr.join(",") + "]";
	}
	return rtn;
}
Alice.EquivalenceManager.prototype.output = function() {
	$.dprint("----Output----");
	$.dprint(this.eq_class);
	$.dprint(this.char_table);
	$.dprint(this.table_prev);
	$.dprint(this.table_next);
	$.dprint(this.toString());
	$.dprint("----End Output----");
}

if(!Alice.CharTable)
	Alice.CharTable = new Alice.EquivalenceManager(256);
