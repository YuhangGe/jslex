/**
 * @author	YuhangGe
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://yuhanghome.net
 */

/**
 * str2nfa.js
 * 将字符串正则表达式转换为nfa，参考龙书《编译原理》第二版3.7.4节算法3.23(100页)
 */
if( typeof Alice === 'undefined')
	Alice = {};

/*
 * Alice.Regular命名空间
 */
Alice.Regular = {}; 

/**
 * 使用匿名函数，对命名空间进行封装
 */
(function() {
	var A = Alice;
	var R = Alice.Regular;
	var T = Alice.Tag;
	var H = Alice.Help;

	/**
	 * RegTag:对正则字条串进行语法分析时判断该token的类别
	 * RegToken:对正则字符串进行词法分析时的token
	 */
	R.Tag = {
		EOF : -1,
		'(' : 1,
		')' : 2,
		'*' : 5,
		'|' : 6,
		'^' : 7,
		'[' : 8,
		']' : 9,
		'+' : 10,
		'?' : 11,
		'{' : 12,
		'}' : 13,
		'?' : 14,
		'"' : 15,
		'\'' : 16,
		CHAR : 19,
		STRING : 20,
		DEFINED : 21 // \d \D \s \S \w
	}
	R.Token = function(tag, value) {
		this.tag = tag;
		this.value = value;
	}

	R.Token.EOF = new R.Token(R.Tag.EOF, null);

	R.Escape = {
		't' : '\t',
		'b' : '\b',
		'n' : '\n',
		'f' : '\f',
		'r' : '\r',
		'v' : '\v'
	};

	R.Defined = {
		'a' : T.LETTER,
		'A' : T.NOT_LETTER,
		'l' : T.LOWER,
		'L' : T.NOT_LOWER,
		'u' : T.UPPER,
		'U' : T.NOT_UPPER,
		'd' : T.DIGIT,
		'D' : T.NOT_DIGIT,
		's' : T.SPACE,
		'S' : T.NOT_SPACE,
		'w' : T.WORD,
		'W' : T.NOT_WORD,
		'.' : T.DOT
	};

	/**
	 * 从正则字符串到nfa，参看龙书。
	 * 此处使用lr的自顶向下递归进行语法制导翻译，对于具体的nfa的生成，包括各种运算，交由Alice.NFA类的静态函数进行。
	 */
	R.Str2Nfa = {
		str : null,
		idx : 0,
		cur_t : null,
		len : 0,
		nfa : null,
		/*
		 * 当前是否正处于引号之中，如果处于引号中，quote=该引号（“或者‘），否则quote=null
		 */
		quote : null 
	}
	R.Str2Nfa.read_ch = function() {
		if(this.idx === this.len) {
			return null;
		} else {
			return this.str[this.idx++];
		}
	}
	R.Str2Nfa.get_token = function(c) {
		if(c === null) {
			this.cur_t = R.Token.EOF;
			return this.cur_t;
		}
		if(this.quote!==null){
			var str="";
			while(c !== this.quote) {
				str+=c;
				c = this.read_ch();
				if(c===null)
					throw "error! need quote.";		
			}
			this.quote=null;
			this.cur_t = new R.Token(R.Tag.STRING, str);
			return this.cur_t;
		}
		switch(c) {
			case '\\':
				c = this.read_ch();
				if(c === null)
					throw 1;
				if(R.Escape[c] != null)
					this.cur_t = new R.Token(R.Tag.CHAR, R.Escape[c]);
				else if(R.Defined[c] != null) {
					this.cur_t = new R.Token(R.Tag.DEFINED, R.Defined[c]);
				} else
					this.cur_t = new R.Token(R.Tag.CHAR, c);
				break;
			case '.':
				this.cur_t = new R.Token(R.Tag.DEFINED, R.Defined['.']);
				break;
			case '*':
			case '(':
			case ')':
			case '|':
			case '^':
			case '[':
			case ']':
			case '{':
			case '}':
			case '+':
			case '-':
			case '?':
			case '\"':
			case '\'':
				this.cur_t = new R.Token(R.Tag[c], c);
				break;
			default:
				this.cur_t = new R.Token(R.Tag.CHAR, c);
				break;
		}
		return this.cur_t;
	}
	R.Str2Nfa.back_token = function() {
		if(this.idx > 1) {
			this.idx--;
			return this.get_token(this.str[this.idx - 1]);
		}
		return null;
	}
	R.Str2Nfa.read_token = function() {
		return this.get_token(this.read_ch());
	}
	/* 以下是正则文法的推理。
	 * R->ER'
	 * R'->|ER' | e
	 * E->TE'
	 * E'->TE'|e
	 * T->SO
	 * T->S
	 * O->*|+|?|N
	 * N->{D}
	 * D->digit D2
	 * D2->,digit|e
	 * S->(R)
	 * S->[H]
	 * S->{DEFINED}
	 * S->str
	 * S->char
	 * H->I J
	 * I->^|e
	 * J->KJ'
	 * J'->KJ'|e
	 * K->char - char | char
	 */
	R.Str2Nfa._r = function() {
		var nfa1, nfa2;
		nfa1 = this._e();
		while(true) {
			if(this.cur_t.tag === R.Tag['|']) {
				//$.dprint('|')
				this.read_token();
				nfa2 = this._e();
				nfa1 = Alice.NFA.createOrNFA(nfa1, nfa2);
				//$.dprint(nfa1);
			} else
				break;
		}
		//$.dprint(nfa1);

		return nfa1;
	}
	R.Str2Nfa._e = function() {
		var nfa1 = this._t();
		var nf2;
		while(true) {
			if(this.cur_t.tag !== R.Tag['|'] && this.cur_t.tag !== R.Tag[')'] && this.cur_t !== R.Token.EOF) {
				nfa2 = this._t();
				nfa1 = Alice.NFA.createJoinNFA(nfa1, nfa2);
				//$.dprint(nfa1);
			} else
				break;
		}
		//$.dprint(nfa1);
		return nfa1;
	}
	R.Str2Nfa._t = function() {
		var nfa1 = this._s();
		switch(this.cur_t.tag) {

			case R.Tag['*']:
				//$.dprint('*');
				nfa1 = Alice.NFA.createStarNFA(nfa1);
				this.read_token();
				break;
			case R.Tag['+']:
				nfa1 = Alice.NFA.createBoundNFA(nfa1, 1, null);
				this.read_token();
				break;
			case R.Tag['?']:
				nfa1 = Alice.NFA.createNumberNFA(nfa1, 1, 0);
				this.read_token();
				break;
			case R.Tag['{']:
				this.read_token();
				if(this.cur_t.value >= '0' && this.cur_t.value <= '9') {
					nfa1 = this._d(nfa1);
					if(this.cur_t.value !== '}')
						throw "_t 0";
					this.read_token();
				} else {
					this.back_token();
				}

				break;
			//$.dprint(nfa1);
		}

		//$.dprint(nfa1);

		return nfa1;
	}
	R.Str2Nfa._d = function(nfa) {
		var low_str = "", high_str = "", low, high;
		while(true) {
			var c = this.cur_t.value;
			if(c < '0' || c > '9')
				break;
			low_str += c;
			this.read_token();
		}
		if(this.cur_t.value !== ',') {
			if(this.cur_t.tag === R.Tag['}']) {
				if(low_str == "")
					throw "_d 0";
				low = Number(low_str);
				return Alice.NFA.createNumberNFA(nfa, low);
			} else
				throw "_d 1";
		}
		this.read_token();
		while(true) {
			var c = this.cur_t.value;
			if(c < '0' || c > '9')
				break;
			high_str += c;
			this.read_token();
		}
		low = (low_str === "" ? null : Number(low_str));
		high = (high_str === "" ? null : Number(high_str));

		if(!low && !high)
			throw "_d 2";
		else if(low && high && high <= low)
			return Alice.NFA.createNumberNFA(nfa, low);

		return Alice.NFA.createBoundNFA(nfa, low, high);
	}
	R.Str2Nfa._s = function() {
		var nfa;
		switch(this.cur_t.tag) {
			case R.Tag['(']:
				//$.dprint('(');
				this.read_token();
				nfa = this._r();
				if(this.cur_t.tag !== R.Tag[')'])
					throw "_s 0";
				this.read_token();
				break;
			case R.Tag['[']:
				this.read_token();
				nfa = this._h();
				if(this.cur_t.tag !== R.Tag[']'])
					throw "_s 1";
				this.read_token();
				break;
			case R.Tag['{']:
				this.read_token();
				nfa = this._u();
				if(this.cur_t.tag !== R.Tag['}'])
					throw "_s 3";
				this.read_token();
				break;
			case R.Tag['"']:
			case R.Tag['\'']:
				this.quote = this.cur_t.value;
				this.read_token();
				nfa = Alice.NFA.createStrNFA(this.cur_t.value);
				this.read_token();
				break;
			case R.Tag.DEFINED:
				nfa = Alice.NFA.createMultiNFA(Alice.DEF_INPUT[this.cur_t.value],this.cur_t.value<0?true:false);
				this.read_token();
				break;
			case R.Tag.CHAR:
				nfa = Alice.NFA.createSingleNFA(this.cur_t.value.charCodeAt(0));
				this.read_token();
				break;
			default:
				$.dprint(this.cur_t);
				throw "_s 2";
		}
		return nfa;
	}
	R.Str2Nfa._u = function() {
		var w = "";
		while(true) {
			if(this.cur_t.tag === R.Tag['}'] || this._u_not_digit(this.cur_t.value) === false)
				break;
			w += this.cur_t.value;
			this.read_token();
		}
		if(Alice.Lex.Parser.define[w]!=null){
			return Alice.Lex.Parser.define[w].copy();
		}else
			throw "_u 0 :"+w;
	}
	R.Str2Nfa._u_not_digit = function(chr){
		return chr<'0' || chr>'9';
	}
	R.Str2Nfa._str = function() {
		var str = "";
		 
		while(this.cur_t.tag !== this.quote) {
			
			if(this.cur_t === Alice.Regular.Token.EOF)
				throw "_str 0";
			str += this.cur_t.value;
			 
			this.read_token();	
		}
		$.dprint(str);
		return Alice.NFA.createStrNFA(str);
	}
	/*
	 * 解析[^a-z0-9]一类的正则子串,^排除暂时没有实现
	 */
	R.Str2Nfa._h = function() {

		var not = false;
		if(this.cur_t.tag === R.Tag['^']) {
			not = true;
			this.read_token();
		}
		var chrs = [];
		while(this.cur_t.tag !== R.Tag[']'] && this.cur_t !==R.Token.EOF) {
			var c_from, c_to;
			c_from = this.cur_t.value;
			if(this.cur_t.tag === R.Tag.DEFINED) {
				if(c_from>0){
					H.arrUnion(chrs,Alice.DEF_INPUT[c_from]);	
				}else{
					chrs.push(c_from);
				}
				this.read_token();
				continue;
			}
			this.read_token();
			if(this.cur_t.value !== '-') {
				chrs.push(c_from.charCodeAt(0));
			} else {
				this.read_token();
				if(this.cur_t.tag === R.Tag[']']) {
					chrs.push(c_from.charCodeAt(0));
					chrs.push('-'.charCodeAt(0));
					break;
				} else if(this.cur_t.tag === R.Tag.DEFINED) {
					throw "_h 0";
				}
				c_to = this.cur_t.value;
				if(c_to >= c_from) {
					this._h_add(c_from, c_to, chrs);
				} else
					throw "_h 1";
				this.read_token();
			}
		}
		return this._h_nfa(chrs, not);
	}
	/**
	 * _h辅助函数，将from到to区间的字符加入到arr中。
	 */
	R.Str2Nfa._h_add = function(from, to, arr) {
		var f = from.charCodeAt(0), t = to.charCodeAt(0);
		for(var i = f; i <= t; i++) {
			arr.push(i);
		}
	}
	/*
	 * _h解析的辅助函数，通过chrs数组中的字符构建nfa。
	 * not参数指明是否是排除chrs数组中的字符的剩下字符。
	 */
	R.Str2Nfa._h_nfa = function(chrs, except) {
		/*
		 * 对数组排序并去除重复元素。这样是为了在插入等价类的时候计算其hash值，
		 * 可以做到尽可能的不对已经插入过的字符集进行等价类操作
		 */
		var uni_chrs = H.uniqueSort(chrs);
		//$.dprint(uni_chrs);
		return Alice.NFA.createMultiNFA(uni_chrs,except);
	}
	R.Str2Nfa.parse = function(str) {
		this.str = str;
		this.idx = 0;
		this.len = str.length;
		this.nfa = null;
		//try{
		this.read_token();
		this.nfa = this._r();
		//}catch(e){
		//	$.dprint("wrong!"+e);
		//}
		return this.nfa;
	}
})();
