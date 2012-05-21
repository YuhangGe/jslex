/**
 * @author	Yuhang Ge
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://xiaoge.me
 */

/**
 * alice.js
 * 全局命名空间入口，定义了项目的命名空间和子命名空间。
 * 公共模块，包括各种辅助函数，辅助类
 */
Alice = {
	__RUNTIME__ : "js", // __runtime__ : js 或  node 。当前是否在nodejs上运行
	parse : function(lex_src){
		var lex = Alice.Core.Lexer.parse(lex_src);
		return Alice.Dfa.Dfa2Src.parse(lex.dfa_obj, lex.routine);
	},
	Core : {
		/**
		 * Core 命名空间，包括核心逻辑的实现处理 
		 */
	},
	Nfa : {
		/*
		 * Nfa 命名空间，包括nfa相关类的定义，正则字符串到nfa的算法，nfa到dfa的算法，
		 */
	},
	Dfa : {
		/*
		 * Dfa 命名空间，包括dfa相关的类的定义，dfa的压缩算法
		 */
	},
	Table : {
		/**
		 * TableSpace 命名空间，包括输入符等价类划分，dfa转换成线性表（default,check,base,next）
		 */
	},
	Utility : {
		/**
		 *  UtilitySpace 命名空间，包括常用函数
		 */
		extend : function(src, ext) {
			for(var f in ext) {
				if(src[f] == null)
					src[f] = ext[f];
				else
					throw "extend error!"
			}
		},
		
	}
};


(function(A,C,N,D,T,U) {
	/**
	 * 辅助函数
	 */
	U.extend(U, {
		/**
		 * 绑定继承关系，使用了javascript闭包性质，使得baseType可以使用
		 * @param {Object} inheritClass 继承类
		 * @param {Object} baseClass 父类
		 *
		 */
		inherit : function(inheritClass, baseClass) {
			//首先把父类的prototype中的函数继承到子类中
			for(var pFunc in baseClass.prototype) {
				var sp = inheritClass.prototype[pFunc];
				//如果子类中没有这个函数，添加
				if( typeof sp === 'undefined') {
					inheritClass.prototype[pFunc] = baseClass.prototype[pFunc];
				}
				//如果子类已经有这个函数，则忽略。以后可使用下面的callBase函数调用父类的方法

			}
			//保存继承树，当有多级继承时要借住继承树对父类进行访问
			inheritClass.__base_objects__ = new Array();
			inheritClass.__base_objects__.push(baseClass);

			if( typeof baseClass.__base_objects__ !== 'undefined') {
				for(var i = 0; i < baseClass.__base_objects__.length; i++)
					inheritClass.__base_objects__.push(baseClass.__base_objects__[i]);
			}

			/**
			 * 执行父类构造函数，相当于java中的this.super()
			 * 不使用super是因为super是ECMAScript保留关键字.
			 * @param {arguments} args 参数，可以不提供
			 */
			inheritClass.prototype.base = function(args) {

				var baseClass = null, rtn = undefined;
				if( typeof this.__inherit_deep__ === 'undefined') {
					this.__inherit_deep__ = 0;
				} else {
					this.__inherit_deep__++;
					//$.dprint("d+:"+this.__inherit_deep__);
				}

				baseClass = inheritClass.__base_objects__[this.__inherit_deep__];

				if( typeof args === "undefined" || args == null) {
					rtn = baseClass.call(this);
				} else if( args instanceof Array === true) {
					rtn = baseClass.apply(this, args);
				} else {
					var _args = new Array();
					for(var i = 0; i < arguments.length; i++)
						_args.push(arguments[i]);
					rtn = baseClass.apply(this, _args);
				}

				this.__inherit_deep__--;

				//$.dprint("d-:"+this.__inherit_deep__);
				return rtn;
			}
			/**
			 * 给继承的子类添加调用父函数的方法
			 * @param {string} method 父类的函数的名称
			 * @param {arguments} args 参数，可以不提供
			 */
			inheritClass.prototype.callBase = function(method, args) {

				var baseClass = null, rtn = undefined;

				if( typeof this.__inherit_deep__ === 'undefined') {
					this.__inherit_deep__ = 0;

				} else {
					this.__inherit_deep__++;
					//$.dprint("d+:"+this.__inherit_deep__);
				}

				//$.dprint(this.__inherit_deep__);
				baseClass = inheritClass.__base_objects__[this.__inherit_deep__];

				var med = baseClass.prototype[method];
				if( typeof med === 'function') {
					if( typeof args === "undefined" || args == null) {
						rtn = med.call(this);
					} else if( args instanceof Array === true) {
						rtn = med.apply(this, args);
					} else {
						var _args = new Array();
						//从位置1开始，因为第0位参数是method的名称
						for(var i = 1; i < arguments.length; i++) {
							_args.push(arguments[i]);
						}
						rtn = med.apply(this, _args);
					}
				} else {
					throw "There is no method:" + method + " in baseClass";
				}

				this.__inherit_deep__--;

				//$.dprint("d-:"+this.__inherit_deep__);
				//$.dprint("----");
				return rtn;
			}
		},
		_d : {
			10 : "\\d", //数字：	\d
			11 : "\\D", //非数字：	\D
			12 : "\\s", //空字符\f\n\r\t\v：	\s
			13 : "\\S", //非字符：	\S
			14 : "\\w", //字符a-zA-Z_：\s
			15 : "\\W", //非字符：	\W
			16 : "\\a", //字母：	\a
			17 : "\\A", //非字母：	\A
			18 : "\\u", //大写字母：\u
			19 : "\\U", //非大写字母：\U
			20 : "\\l", //小写字母：\l
			21 : "\\L", //非小写字母：\L
			22 : ".", //除\n外任意字符：.
			'\t' : '\\t',
			'\b' : '\\b',
			'\n' : '\\n',
			'\f' : '\\f',
			'\r' : '\\r',
			'\v' : '\\v',
			get : function(id) {
				if(this[id])
					return this[id];
				else
					return id;
			}
		},
		/*
		 * 排除重复元素，返回新的一个数组
		 */
		uniqueArr : function(arr) {
			var u_arr = [];
			for(var i = 0; i < arr.length; i++) {
				if(u_arr.indexOf(arr[i]) === -1)
					u_arr.push(arr[i]);
			}

			return u_arr;
		},
		/**
		 * 对arr进行排序，并排除重复元素，返回新的一个数组
		 */
		uniqueSort : function(arr) {
			var s_arr = new Array(arr.length), end = 1;
			s_arr[0] = arr[0];
			out_for:
			for(var i = 1, len = arr.length; i < len; i++) {
				var elm = arr[i];
				for(var j = 0; j < end; j++) {
					if(arr[i] === s_arr[j]) {
						continue out_for;
					} else if(elm < s_arr[j]) {
						s_arr.splice(j, 0, elm);
						end++;
						continue out_for;
					}
				}
				s_arr[end++] = elm;
			}
			s_arr.length = end;
			return s_arr;
		},
		/**
		 * 简单合并两个数组，将arr2的元素添加到arr1中
		 */
		arrUnion : function(arr1, arr2) {
			for(var i = 0; i < arr2.length; i++)
				arr1.push(arr2[i]);
		},
		arrCopy : function(arr) {
			var new_arr = [];
			for(var i = 0; i < arr.length; i++)
				new_arr.push(arr[i]);
			return new_arr;
		},
		/**
		 * 得到实际串的不重复循环，主要用在生成DFA状态时状态的名称。
		 * a,b,c,...,z,aa,bb,cc,...,zz,aaa,....
		 */
		_n : {
			i : -1,
			names : "abcdefghigklmnopqrstuvwxyz".split(''),
			get : function() {
				var n = ++this.i;
				var len = this.names.length;
				var chr = [];
				var k;
				while(true) {
					k = n % len;
					chr.push(this.names[k]);
					n = (n - k) / len;
					if(n === 0)
						break;
				}
				//$.dprint(chr);
				var rtn = "";
				for(var i = chr.length - 1; i >= 0; i--)
					rtn += chr[i];
				return rtn;
			}
		},
		/**
		 * 比较两个集合是否一样，因为保证了是集合，所以算法相对简单。
		 * 元素个数相同且第一个集合中每个元素都在第二个集合中就行了。
		 */
		setEqual : function(set1, set2) {
			if(set1.length !== set2.length)
				return false;
			for(var i = 0; i < set1.length; i++) {
				if(set2.indexOf(set1[i]) === -1)
					return false;
			}
			return true;
		},
		isDigit : function(chr) {
			//$.dprint("isDigit:"+chr);
			return chr >= 48 && chr <= 57;
		},
		isNotDigit : function(chr) {
			return chr < 48 || chr > 57;
		},
		isLetter : function(chr) {
			//$.dprint("isLetter:"+chr);
			return chr >= 97 && chr <= 122 || chr >= 65 && chr <= 90;
		},
		isNotLetter : function(chr) {
			return chr < 65 || chr > 90 && chr < 97 || chr > 122;
		},
		isWord : function(chr) {
			//$.dprint("isWord:" + chr);
			return this.isLetter(chr) || this.isDigit(chr) || chr === 95;
		},
		isNotWord : function(chr) {
			return !this.isWord(chr);
		},
		isSpace : function(chr) {
			return chr === 32 || chr === 9 || chr === 10 || chr === 13 || chr === 12 || chr === 11;
		},
		isNotSpace : function(chr) {
			return !Alice.Help.isSpace(chr);
		},
		isUpper : function(chr) {
			return chr >= 65 && chr <= 90;
		},
		isNotUpper : function(chr) {
			return chr < 65 || chr > 90;
		},
		isLower : function(chr) {
			return chr >= 97 && chr <= 122;
		},
		isNotLower : function(chr) {
			return chr < 97 || chr > 122;
		},
		isDot : function(chr) {
			return chr !== 10;
		},
		/*
		 * 将数组压缩成字符串，字符串的第一个字符的ascii码代表当前字符串压缩格式。
		 * 0代表直接压缩，1代表隔位压缩。如数组[2,2,2,3,3,5,0xfff0,0xfff0,9,9,9,9]
		 * 直接压缩的结果是 "\0\2\2\2\3\3\5\ufff0\ufff0\9\9\9\9"
		 * 隔位压缩的结果是 "\1\3\2\2\3\1\5\2\ufff0\4\9"，即前一位代表后一位字符的重复数量。
		 * 压缩格式的选择根据最后生成的字符串的长度而定。
		 */
		arr_to_str : function(arr) {
			var s_0 = ["\\0"], s_1 = ["\\1"], s_0_n = 0, s_1_n = 0;
			var pre_i = arr[0], pre_c = this.int_to_char(pre_i), pre_n = 1, len = arr.length - 1;
			s_0.push(pre_c);
			for(var i = 1; i <= len; i++) {
				var cur_i = arr[i], cur_c = this.int_to_char(cur_i);
				s_0_n += cur_c.length;
				s_0.push(cur_c);
				if(cur_i !== pre_i) {
					var tmp = this.int_to_char(pre_n);
					s_1_n += tmp.length + pre_c.length;
					s_1.push(tmp);
					s_1.push(pre_c);
					pre_c = cur_c;
					pre_i = cur_i;
					pre_n = 1;
				} else {
					pre_n++;
				}
				if(i === len) {
					var tmp = this.int_to_char(pre_n);
					s_1_n += tmp.length + pre_c.length;
					s_1.push(tmp);
					s_1.push(pre_c);
				}
			}
			return s_0_n <= s_1_n ? s_0.join("") : s_1.join("");
		},
		int_to_char : function(i) {
			if(i == null) {
				i = 0;
			} else {
				i++;
			}
			if(i < 64) {
				return "\\" + i.toString(8);
			} else if(i < 256) {
				return "\\x" + i.toString(16);
			} else if(i < 0x1000) {
				return "\\u0" + i.toString(16);
			} else {
				return "\\u" + i.toString(16);
			}
		},
		/**
		 * 将上面函数压缩的字符串还原成
		 */
		str_to_array : function(str, arr) {
			var t = str.charCodeAt(0), len = str.length, c = 0;
			for(var i = 1; i < len; i++) {
				if(t === 0)
					arr[i - 1] = str.charCodeAt(i) - 1;
				else {
					var n = str.charCodeAt(i) - 1, v = str.charCodeAt(i + 1) - 1;
					for(var j = 0; j < n; j++) {
						arr[c] = v;
						c++;
					}
					i++;
				}
			}
		}
	});

})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility);

(function(A, C, N, D, T, U) {
	/**
	 * 处理正则表达式中的转义符，比如 \d  \w  \s
	 * 目前的设计还在斟酌中，不知道把这一块放在什么模块中好
	 */

	var T = C.Tag = {};
	var D = C.DEF_INPUT = {};
	var F = C.DEF_FUNC = {};

	U.extend(T, {
		DIGIT : 1,
		//数字：	\d
		NOT_DIGIT : -1,
		//非数字：	\D
		SPACE : 2,
		//空字符\f\n\r\t\v：	\s
		NOT_SPACE : -2,
		//非字符：	\S
		WORD : 3,
		//字符a-zA-Z_：\s
		NOT_WORD : -3,
		//非字符：	\W
		LETTER : 4,
		//字母：	\a
		NOT_LETTER : -4,
		//非字母：	\A
		UPPER : 5,
		//大写字母：\u
		NOT_UPPER : -5,
		//非大写字母：\U
		LOWER : 6,
		//小写字母：\l
		NOT_LOWER : -6,
		//非小写字母：\L
		DOT : -7,
		//除\n外任意字符：.
	})

	var s2arr = function(str) {
		var rtn = [];
		for(var i = 0; i < str.length; i++)
			rtn.push(str.charCodeAt(i));
		return rtn;
	}
	D[T.DIGIT] = D[T.NOT_DIGIT] = s2arr("0123456789");
	D[T.WORD] = D[T.NOT_WORD] = s2arr("abcdefghilklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_");
	D[T.SPACE] = D[T.NOT_SPACE] = s2arr("\n\t\v\v\f");
	D[T.LETTER] = D[T.NOT_LETTER] = s2arr("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
	D[T.LOWER] = D[T.NOT_LOWER] = s2arr("abcdefghigklmnopqrstuvwxyz");
	D[T.UPPER] = D[T.NOT_UPPER] = s2arr("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
	D[T.DOT] = s2arr("\n");

	F[T.NOT_DIGIT] = U.isNotDigit;
	F[T.NOT_WORD] = U.isNotWord;
	F[T.NOT_LETTER] = U.isNotLetter;
	F[T.NOT_UPPER] = U.isNotUpper;
	F[T.NOT_LOWER] = U.isNotLower;
	F[T.NOT_SPACE] = U.isNotSpace;
	F[T.DOT] = U.isDot;
	
	/**
	 * @class Alice.Core.Input
	 */
	C.Input = function(type, value) {
		this.type = type;
		this.value = value;
	}

	C.Input.prototype = {
		toString : function() {
			if(this.type === C.Input.Type.SINGLE || this.type === C.Input.Type.EMPTY)
				return this.value.toString();
			else if(this.type === C.Input.Type.RANGE) {
				return "[" + this.value.join(",") + "]";
			} else {
				return "^[" + this.value.join(",") + "]";
			}
		},
		isFit : function(input) {
			if(this.type === C.Input.Type.SINGLE)
				return this.value === input;

			var i = 0, fit = false, expt = this.type === C.Input.Type.EXCEPT;
			for( i = 0; i < this.value.length; i++) {
				if(this.value[i] < 0 && C.DEF_FUNC[this.value[i]](input)) {
					fit = true;
					break;
				} else if(this.value[i] === input) {
					fit = true;
					break;
				}
			}
			/*
			 * return expt^fit等价于：
			 *   if(expt===true) return !fit;
			 *   else return fit;
			 */
			return expt ^ fit;
		}
	}
	C.Input.Type = {
		SINGLE : 0,
		RANGE : 1,
		EXCEPT : 2,
		EMPTY : 4
	};
	C.Input.e = new C.Input(C.Input.Type.EMPTY, 'ε');

	/**
	 * @class Alice.Core.State
	 * 状态基类，其子类包括 Alice.Nfa.NFAState 和 Alice.Dfa.DFAState
	 */
	C.State = function(isAccept, name) {
		this.isAccept = false;
		if( typeof isAccept === 'boolean') {
			this.isAccept = isAccept;
			this.name = name;
		} else if( typeof isAccept === 'string') {
			this.name = isAccept;
		}

	}
	C.State.prototype = {
		toString : function() {
			if(this.name)
				return this.name + '(' + this.id + ')' + (this.isAccept === true ? "[acc]" : "")
			else
				return this.id + (this.isAccept === true ? "[acc]" : "");
		},
		addMove : function(input, next) {
			throw "must implement (Alice.Core.State.addMove).";
		},
		getMove : function(input) {
			throw "must implement (Alice.Core.State.getMove).";
		}
	}

	/*
	 * @class Alice.Core.Alice
	 * 模式的动作类Action，id是用来标识该action的优先级，先声明的模式id小，在lex源码中，当出现
	 * 冲突的时候，优先选择id小的。
	 */
	C.Action = function(func) {
		this.id = C.Action.__auto_id__++;
		this.func = func;
	}
	C.Action.__auto_id__ = 0;

})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility);
(function(A, C, N, D, T, U) {
	/**
	 * 将lex规则转换成dfa
	 * 注意标志符目前暂时不支持数字。即可以
	 * NUM \d+ 但不能  NUM_1 \d+
	 * 同时，如果由已经定义的规则再组合规则，则需要用{}引用。
	 * 比如
	 * FLOAT {NUM}\.{NUM}
	 * 但是如果是 FLOAT NUM\.NUM则是把NUM当作直接的字符串。
	 */

	C.Lexer = {
		src : null,
		idx : 0,
		cur_t : null,
		define : {},
		define_used : {},
		rule : {
			"DEFAULT" : []
		},
		routine : {'construct': '','start': '', 'finish' : '', 'error':''}
	};
	U.extend(C.Lexer, {
		_define : function() {
			var in_option = true;
			while(in_option){
				var option = this.cur_t.toLowerCase();
				switch(option){
					case '$caseignore':
						this.read_word();
						D.Dfa2Src.case_ignore = this.cur_t.toLowerCase()==="true"?true:false;
						if(this.cur_t==='true'){
							$.log("option - case ignore: true");
						}
						this.read_word();
						break;
					case '$lexname':
						this.read_word();
						D.Dfa2Src.lex_name = this.cur_t;
						$.log("option - lex name: "+this.cur_t);
						this.read_word();
						break;
					case '$template':
					    this.read_word();
					    D.Dfa2Src.template = this.cur_t;
					    $.log("option - template name: "+this.cur_t);
					    this.read_word();
					default:
						in_option= false;
						break;
				}
			}

			while(this.cur_t !== '$$' && this.cur_t != null) {
				//$.dprint(this.cur_t);
				this._d_line();
				//$.aprint(Alice.CharTable.char_table);
				//$.aprint(Alice.CharTable.eq_class);
				this.read_word();
			}
			this.read_word();
		},
		_d_line : function() {
			var lbl = this.cur_t;
			var exp = this.read_word();

			var r = N.Str2Nfa.parse(exp);
			r.finish.isAccept = false;
			//$.dprint(lbl);
			this.define[lbl] = r;
		},
		_rule : function() {
			while(this.cur_t !== '$$' && this.cur_t != null) {

				this._r_line();
				this.read_word();

			}
			this.read_word();
			this._routine();
		},
		_r_line : function() {
			var lbl = this.cur_t, state = "DEFAULT";
			if(this.cur_t === "<") {
				state = this.read_word();
				if(state === "Daisy") {
					throw "不能使用Daisy作为状态标识。"
				}
				//$.dprint(state);
				this.idx--;

				if(this.read_word() !== ">")
					throw "error! state must be closed by '>'."
				lbl = this.read_word();
			}
			//$.dprint("state: %s, lbl: %s",state,lbl);
			var expNfa = this.define[lbl];
			if(expNfa == null)
				throw "没有定义的标识@_r_line 0:" + lbl;
			if(this.define_used[lbl] === true) {
				/**
				 * 如果在define块定义的标识已经被某个状态集使用过，则必须使用它的拷贝来生成一个rule
				 */
				expNfa = expNfa.copy();
			} else {
				this.define_used[lbl] = true;
			}
			var func_str = "";
			var c = this.read_ch();
			var until = '\n';
			while(c !== null && this.isSpace(c) && c !== until)
			c = this.read_ch();
			if(c === '{') {
				until = '}';
				c = this.read_ch();
			}
			while(c !== null && c !== until) {
				func_str += c;
				c = this.read_ch();
			}
			//this.read_ch();

			expNfa.finish.isAccept = true;
			expNfa.finish.action = new C.Action(func_str);

			if(this.rule[state] == null) {
				this.rule[state] = [];
			}
			this.rule[state].push(expNfa);
		},
		_routine : function() {
			while(this.cur_t!==null){
				this._routine_line(this.cur_t);
				this.read_word();
			}
			
		},
		_routine_line : function(name){
			name = name.toLowerCase();
			var func_str = "";
			var c = this.read_ch();
			var until = '\n';
			while(c !== null && this.isSpace(c) && c !== until)
			c = this.read_ch();
			if(c === '{') {
				until = '}';
				c = this.read_ch();
			}
			while(c !== null && c !== until) {
				func_str += c;
				c = this.read_ch();
			}
			if(['$construct','$start','$finish','$error'].indexOf(name)<0){
				console.log("warning: unknow global function "+name+", ignored.");
				return;
			}else{
				$.log(name);
				$.log(func_str);
			}
			this.routine[name.substring(1,name.length)] = func_str;
		},
		read_ch : function() {
			if(this.idx === this.len) {
				return null;
			} else {
				return this.src[this.idx++];
			}
		},
		back_ch : function() {
			if(this.idx > 0)
				this.idx--;
		},
		read_word : function() {
			var c = this.read_ch();
			while(c !== null && this.isSpace(c))
			c = this.read_ch();
			if(c === "<" || c === ">")
				return this.cur_t = c;

			var w = "";
			var quote = null;
			if(c === '[')
				quote = ']';
			while(c !== null) {
				if(quote === null && (this.isSpace(c) || c === ">"))
					break;
				w += c;

				if(c === "\\") {
					c = this.read_ch();
					if(c !== null)
						w += c
				} else if(c === '\"' || c === '\'') {
					if(quote === c)
						quote = null;
					else if(quote === null)
						quote = c;
				} else if(c === '[' && quote === null) {
					quote = ']';
				} else if(c === ']' && quote !== null) {
					quote = null;
				}
				c = this.read_ch();
			}
			//$.dprint("w:"+w);
			if(w.length === 0)
				this.cur_t = null;
			else
				this.cur_t = w;
			return this.cur_t;
		},
		parse : function(source) {
			//init
			this.src = source;
			this.idx = 0;
			this.len = source.length;
			//begin parse
			this.read_word();

			this._define();

			this._rule();
			this._routine();

			var dfa_arr = [], default_dfa = null, states = {};
			//$.dprint(lexNFA);
			for(var s in this.rule) {
				var rs = this.rule[s];
				var lexNFA = new N.NFA();
				var lexStart = new N.NFAState();
				lexNFA.start = lexStart;
				lexNFA.addState(lexStart);
				for(var i = 0; i < rs.length; i++) {
					var nfaExp = rs[i];
					lexStart.addMove(C.Input.e, nfaExp.start);
					lexNFA.addState(nfaExp.states);
				}
				//$.dprint(lexNFA);
				var dfa = N.Nfa2Dfa.parse(lexNFA);
				//$.dprint(dfa);
				var m_dfa = D.DfaMinimize.parse(dfa);
				//$.dprint(m_dfa);
				m_dfa.state_name = s;
				dfa_arr.push(m_dfa);
				if(s === "DEFAULT")
					default_dfa = m_dfa;

			}
			//$.dprint(dfa_arr);

			var dfa_obj = {
				dfa_array : dfa_arr,
				default_dfa : default_dfa,
			}

			T.Dfa2Table.parse(dfa_obj);
			/*$.aprint(m_dfa.table_base);
			 $.dprint(Alice.Help.array_to_str(m_dfa.table_base));
			 $.aprint(m_dfa.table_default);
			 $.dprint(Alice.Help.array_to_str(m_dfa.table_default));
			 $.aprint(m_dfa.table_check);
			 $.dprint(Alice.Help.array_to_str(m_dfa.table_check));
			 $.aprint(m_dfa.table_next);
			 $.dprint(Alice.Help.array_to_str(m_dfa.table_next));
			 $.aprint(m_dfa.table_action);
			 $.dprint(Alice.Help.array_to_str(m_dfa.table_action));
			 $.dprint(Alice.Help.array_to_str(Alice.CharTable.char_table));
			 */
			return {
				dfa_obj : dfa_obj,
				routine : this.routine
			}

		},
		isSpace : function(chr) {
			return chr === ' ' || chr === '\n' || chr === '\t' || chr === '\r';
		}
	});

})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility);

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
(function(A, C, N, D, T, U) {
	/**
	 * @author	Yuhang Ge
	 * @email	abraham1@163.com
	 * @address	software institute, nanjing university
	 * @blog	http://xiaoge.me
	 */

	/**
	 * @class Alice.Nfa.Nfa2Dfa
	 * 将nfa转换为等价dfa
	 * 参考龙书《编译原理》第二版3.7.1节算法3.20(97页)
	 */
	N.Nfa2Dfa = {
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
			var T = mv.move, is_accept = false, stack = [], e_c = [], e_id = [], new_closure = null, hash_key = "";

			for(var i = 0; i < T.length; i++) {
				stack.push(T[i]);
				e_c.push(T[i]);
				e_id.push(T[i].id);
				/*if(T[i].isAccept === true){
				 is_accept = true;
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
			hash_key = e_id.sort(function(a, b) {
				return a > b;
			}).join(",");
			/**
			 * is_accept |= ...运算后，会从boolean型变成int型，即true/false变成1/0
			 * 虽然不知道这个在if判断中是否会有区别(javascript没有类型)，
			 * 但通过以下运算重新转换成boolean型相信不会更坏
			 */
			is_accept = is_accept ? true : false;
			new_closure = {
				hash_key : hash_key,
				closure : e_c,
				is_accept : is_accept
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
			}).join(",");
			return {
				hash_key : hash_key,
				move : mv
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
			var s0 = new D.DFAState(U._n.get());
			var mv0 = {
				hash_key : undefined,
				move : [nfa.start],
				is_accept : false
			}
			var ec0 = this.e_closure(mv0);
			s0.nfaset = ec0.closure;
			s0.isAccept = ec0.is_accept;
			this.add_dfa_state(s0, ec0.hash_key);
			/**
			 * 以下过程参考龙书的算法97页算法3.20：子集构造（subset construction）算法
			 */
			var S;
			while( S = this.get_untag_state()) {
				S.tag = true;
				//$.dprint("untag:"+T.id);
				//$.dprint(T);
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
					//$.dprint('move:'+eqc[i]);
					//$.dprint(T.nfaset);
					/**
					 * move(T,a):能够从集合T中某个状态s出发通过标号为a的转换到达的NFA状态集合
					 * 为了效率，在得到该move集合后，会计算集合类NFA状态的所有元素的hash_key，
					 * 这个hash_key会用来索引已经存在的move集。当有相同的move集出现后，
					 * 就不需要二次计算该move集的e_closure
					 */
					var mv = this.get_move(S.nfaset, eqc[i]);

					if(!mv)
						continue;
					//$.dprint(mv.move);
					/*
					 * 计算move集合的e_closure集合
					 */
					var ec = this.e_closure(mv);
					//$.dprint("e_closure");
					//$.dprint(ec.closure);
					/**
					 * 从已经存在的e_closure集中查找该e_closure对应的dfa状态，
					 * 如果没有打到，说明该dfa状态还示存在，需要新建
					 */
					var dfa_state = this.closure_hash_table[ec.hash_key];
					//$.dprint("dfa_state:"+dfa_state);
					if(!dfa_state) {
						dfa_state = new D.DFAState(ec.is_accept, U._n.get());
						dfa_state.nfaset = ec.closure;
						//$.dprint("push "+dfa_state.id);
						//$.dprint(dfa_state.nfaset);
						this.add_dfa_state(dfa_state, ec.hash_key);
					}
					//$.dprint("add "+T.id+" "+eqc[i]+","+dfa_state.id);
					var eqc_index = Alice.CharTable.getEqc(eqc[i]);
					if(eqc_index == null) {
						$.dprint("eqc_index null");
					}
					S.addMove(eqc_index, dfa_state);
				}
			}

			/**
			 * 为每个DFA状态设置action
			 */
			for(var i = 0; i < this.dstates.length; i++) {

				if(!this.dstates[i].isAccept) {
					continue;
				}
				var nfaset = this.dstates[i].nfaset;
				var min_id = -1, ac = null, j = 0;
				for(var j = 0; j < nfaset.length; j++) {
					if(nfaset[j].isAccept && nfaset[j].action) {
						if(min_id < 0) {
							min_id = nfaset[j].action.id;
							ac = nfaset[j].action;
						} else if(min_id > nfaset[j].action.id) {
							min_id = nfaset[j].action.id;
							ac = nfaset[j].action;
						}

					}
				}

				//$.dprint(min_id);
				//if(min_id<0)
				//throw "no action found in accepted state!";
				this.dstates[i].action = ac;
			}

			//console.log(dstates);
			var dfa = new D.DFA(this.dstates[0]);
			dfa.addState(this.dstates);

			return dfa;
		}
	}
})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility); (function(A, C, N, D, T, U) {
	/**
	 * @author	YuhangGe
	 * @email	abraham1@163.com
	 * @address	software institute, nanjing university
	 * @blog	http://xiaoge.me
	 */

	/**
	 * str2nfa.js
	 * 将字符串正则表达式转换为nfa，参考龙书《编译原理》第二版3.7.4节算法3.23(100页)
	 */

	/**
	 * RegTag:对正则字条串进行语法分析时判断该token的类别
	 * RegToken:对正则字符串进行词法分析时的token
	 */
	N.Tag = {
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
	N.Token = function(tag, value) {
		this.tag = tag;
		this.value = value;
	}

	N.Token.EOF = new N.Token(N.Tag.EOF, null);

	N.Escape = {
		't' : '\t',
		'b' : '\b',
		'n' : '\n',
		'f' : '\f',
		'r' : '\r',
		'v' : '\v'
	};

	N.Defined = {
		'a' : C.Tag.LETTER,
		'A' : C.Tag.NOT_LETTER,
		'l' : C.Tag.LOWER,
		'L' : C.Tag.NOT_LOWER,
		'u' : C.Tag.UPPER,
		'U' : C.Tag.NOT_UPPER,
		'd' : C.Tag.DIGIT,
		'D' : C.Tag.NOT_DIGIT,
		's' : C.Tag.SPACE,
		'S' : C.Tag.NOT_SPACE,
		'w' : C.Tag.WORD,
		'W' : C.Tag.NOT_WORD,
		'.' : C.Tag.DOT
	};

	/**
	 * 从正则字符串到nfa，参看龙书。
	 * 此处使用lr的自顶向下递归进行语法制导翻译，对于具体的nfa的生成，包括各种运算，交由Alice.NFA类的静态函数进行。
	 */
	N.Str2Nfa = {
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
	U.extend(N.Str2Nfa, {
		read_ch : function() {
			if(this.idx === this.len) {
				return null;
			} else {
				return this.str[this.idx++];
			}
		},
		get_token : function(c) {
			if(c === null) {
				this.cur_t = N.Token.EOF;
				return this.cur_t;
			}
			if(this.quote !== null) {
				var str = "";
				while(c !== this.quote) {
					str += c;
					c = this.read_ch();
					if(c === null)
						throw "error! need quote.";
				}
				this.quote = null;
				this.cur_t = new N.Token(N.Tag.STRING, str);
				return this.cur_t;
			}
			switch(c) {
				case '\\':
					c = this.read_ch();
					//$.dprint(c);
					if(c === null)
						throw 1;
					if(N.Escape[c] != null)
						this.cur_t = new N.Token(N.Tag.CHAR, N.Escape[c]);
					else if(N.Defined[c] != null && c !== ".") {
						this.cur_t = new N.Token(N.Tag.DEFINED, N.Defined[c]);
					} else
						this.cur_t = new N.Token(N.Tag.CHAR, c);
					break;
				case '.':
					this.cur_t = new N.Token(N.Tag.DEFINED, N.Defined['.']);
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
					this.cur_t = new N.Token(N.Tag[c], c);
					break;
				default:
					this.cur_t = new N.Token(N.Tag.CHAR, c);
					break;
			}
			return this.cur_t;
		},
		back_token : function() {
			if(this.idx > 1) {
				this.idx--;
				return this.get_token(this.str[this.idx - 1]);
			}
			return null;
		},
		read_token : function() {
			return this.get_token(this.read_ch());
		},
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
		 * D2->,
		 digit|e
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
		_r : function() {
			var nfa1, nfa2;
			nfa1 = this._e();
			while(true) {
				if(this.cur_t.tag === N.Tag['|']) {
					//$.dprint('|')
					this.read_token();
					nfa2 = this._e();
					nfa1 = N.NFA.createOrNFA(nfa1, nfa2);
					//$.dprint(nfa1);
				} else
					break;
			}
			//$.dprint(nfa1);

			return nfa1;
		},
		_e : function() {
			var nfa1 = this._t();
			var nf2;
			while(true) {
				if(this.cur_t.tag !== N.Tag['|'] && this.cur_t.tag !== N.Tag[')'] && this.cur_t !== N.Token.EOF) {
					nfa2 = this._t();
					nfa1 = N.NFA.createJoinNFA(nfa1, nfa2);
					//$.dprint(nfa1);
				} else
					break;
			}
			//$.dprint(nfa1);
			return nfa1;
		},
		_t : function() {
			var nfa1 = this._s();
			switch(this.cur_t.tag) {

				case N.Tag['*']:
					//$.dprint('*');
					nfa1 = N.NFA.createStarNFA(nfa1);
					this.read_token();
					break;
				case N.Tag['+']:
					nfa1 = N.NFA.createBoundNFA(nfa1, 1, null);
					this.read_token();
					break;
				case N.Tag['?']:
					nfa1 = N.NFA.createNumberNFA(nfa1, 1, 0);
					this.read_token();
					break;
				case N.Tag['{']:
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
		},
		_d : function(nfa) {
			var low_str = "", high_str = "", low, high;
			while(true) {
				var c = this.cur_t.value;
				if(c < '0' || c > '9')
					break;
				low_str += c;
				this.read_token();
			}
			if(this.cur_t.value !== ',') {
				if(this.cur_t.tag === N.Tag['}']) {
					if(low_str == "")
						throw "_d 0";
					low = Number(low_str);
					return N.NFA.createNumberNFA(nfa, low);
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
				return N.NFA.createNumberNFA(nfa, low);

			return N.NFA.createBoundNFA(nfa, low, high);
		},
		_s : function() {
			var nfa;
			switch(this.cur_t.tag) {
				case N.Tag['(']:
					//$.dprint('(');
					this.read_token();
					nfa = this._r();
					if(this.cur_t.tag !== N.Tag[')'])
						throw "_s 0";
					this.read_token();
					break;
				case N.Tag['[']:
					this.read_token();
					nfa = this._h();
					if(this.cur_t.tag !== N.Tag[']'])
						throw "_s 1";
					this.read_token();
					break;
				case N.Tag['{']:
					this.read_token();
					nfa = this._u();
					if(this.cur_t.tag !== N.Tag['}'])
						throw "_s 3";
					this.read_token();
					break;
				case N.Tag['"']:
				case N.Tag['\'']:
					this.quote = this.cur_t.value;
					this.read_token();
					nfa = N.NFA.createStrNFA(this.cur_t.value);
					this.read_token();
					break;
				case N.Tag.DEFINED:
					nfa = N.NFA.createMultiNFA(C.DEF_INPUT[this.cur_t.value], this.cur_t.value < 0 ? true : false);
					this.read_token();
					break;
				case N.Tag.CHAR:
					nfa = N.NFA.createSingleNFA(this.cur_t.value.charCodeAt(0));
					this.read_token();
					break;
				default:
					$.dprint(this.cur_t);
					throw "_s 2";
			}
			return nfa;
		},
		_u : function() {
			var w = "";
			while(true) {
				if(this.cur_t.tag === N.Tag['}'] || this._u_not_digit(this.cur_t.value) === false)
					break;
				w += this.cur_t.value;
				this.read_token();
			}
			if(C.Lexer.define[w] != null) {
				return C.Lexer.define[w].copy();
			} else
				throw "_u 0 :" + w;
		},
		_u_not_digit : function(chr) {
			return chr < '0' || chr > '9';
		},
		_str : function() {
			var str = "";

			while(this.cur_t.tag !== this.quote) {

				if(this.cur_t === N.Token.EOF)
					throw "_str 0";
				str += this.cur_t.value;

				this.read_token();
			}
			//$.dprint(str);
			return N.NFA.createStrNFA(str);
		},
		/*
		 * 解析[^a-z0-9]一类的正则子串,^排除暂时没有实现
		 */
		_h : function() {

			var not = false;
			if(this.cur_t.tag === N.Tag['^']) {
				not = true;
				this.read_token();
			}
			var chrs = [];
			while(this.cur_t.tag !== N.Tag[']'] && this.cur_t !== N.Token.EOF) {
				var c_from, c_to;
				c_from = this.cur_t.value;
				if(this.cur_t.tag === N.Tag.DEFINED) {
					if(c_from > 0) {
						H.arrUnion(chrs, C.DEF_INPUT[c_from]);
					} else {
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
					if(this.cur_t.tag === N.Tag[']']) {
						chrs.push(c_from.charCodeAt(0));
						chrs.push('-'.charCodeAt(0));
						break;
					} else if(this.cur_t.tag === N.Tag.DEFINED) {
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
		},
		/**
		 * _h辅助函数，将from到to区间的字符加入到arr中。
		 */
		_h_add : function(from, to, arr) {
			var f = from.charCodeAt(0), t = to.charCodeAt(0);
			for(var i = f; i <= t; i++) {
				arr.push(i);
			}
		}
		/*
		 * _h解析的辅助函数，通过chrs数组中的字符构建nfa。
		 * not参数指明是否是排除chrs数组中的字符的剩下字符。
		 */,
		_h_nfa : function(chrs, except) {
			/*
			 * 对数组排序并去除重复元素。这样是为了在插入等价类的时候计算其hash值，
			 * 可以做到尽可能的不对已经插入过的字符集进行等价类操作
			 */
			var uni_chrs = U.uniqueSort(chrs);
			//$.dprint(uni_chrs);
			return N.NFA.createMultiNFA(uni_chrs, except);
		},
		parse : function(str) {
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
	});

})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility); (function(A, C, N, D, T, U) {
/**
 * @author	Yuhang Ge
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://xiaoge.me
 */

/**
 * 
 * dfa的数据结构。参考龙书《编译原理》第二版
 */

D.DFAState = function(isAccept, name) {
	this.base(isAccept, name);
	this.id = D.DFAState.__auto_id__++;
	this.nfaset = [];
	this.tag = false;
	this.input = [];
	this.next = [];
}
D.DFAState.__auto_id__ = 0;

D.DFAState.prototype = {
	toString : function() {
		var str = "【";
		for(var i = 0; i < this.input.length; i++)
			str += this.input[i] + "->" + this.next[i].id + ";";
		str += '】';
		return this.callBase('toString') + str;
	},
	addMove : function(input, next) {
		if(this.input.indexOf(input) < 0) {
			this.input.push(input);
			this.next.push(next);
		} else {
			$.aprint(this.input);
			$.dprint(input);
			console.trace();
			throw "_addMove();DFA 状态转移一个输入只能有一个输出！(defined)";
		}
	},
	getMove : function(input) {
		var eqc = Alice.CharTable.getEqc(input);
		return this.getEqcMove(eqc);
	},
	getEqcMove : function(eqc) {
		var i = this.input.indexOf(eqc);
		if(i < 0)
			return null;
		else
			return this.next[i];
	}
}
U.inherit(D.DFAState, C.State);

D.DFA = function(start, states) {
	this.states = [];
	this.start = start;
	if(states)
		this.addState(states);
}

D.DFA.prototype = {
	addState : function(state) {
		if( state instanceof Array)
			for(var i = 0; i < state.length; i++)
				this.states.push(state[i]);
		else
			for(var i = 0; i < arguments.length; i++)
				this.states.push(arguments[i]);
	},
	toString : function(state) {
		var rtn = "";
		for(var i = 0; i < this.states.length; i++)
			rtn += this.states[i].toString() + " ; ";
		return rtn;
	}
}

})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility);(function(A, C, N, D, T, U) {
	/**
	 * @author	Yuhang Ge
	 * @email	abraham1@163.com
	 * @address	software institute, nanjing university
	 * @blog	http://xiaoge.me
	 */

	/**
	 * 将经过nfa转换，压缩最后生成的dfa输出为js源代码。
	 * 输出时会使用模板生成相应格式的源代码。
	 *
	 */
	D.Dfa2Src = {
		template : "lex",
		template_hash : {},
		act_hash : {},
		lex_name : "JSLexer",
		case_ignore : false,
		getTemplate : function(){
			if(Alice.__RUNTIME__ && Alice.__RUNTIME__==='node'){
				var tn = "node_"+this.template;
				if(this.template_hash[tn]==null){
					var fs = require("fs");
					this.template_hash[tn] = fs.readFileSync("../src/template/"+tn+"_tpl.txt",'utf8');
				}
				return this.template_hash[tn];
			}else{
				var tn = this.template;
				if(this.template_hash[tn]==null){
					this.template_hash[tn] = jQuery.ajax("../src/template/"+tn+"_tpl.txt?r=" + Math.random(), {
						async : false
					}).responseText;
				}
				return this.template_hash[tn];
			}
		},
		parse : function(dfa_obj, routine) {
		
			var output = this.getTemplate();
			
			output = output.replace(/\$\$_BASE_LEN_\$\$/g, dfa_obj.table_base.length)
				.replace(/\$\$_BASE_STR_\$\$/g, U.arr_to_str(dfa_obj.table_base))
				.replace(/\$\$_DEFAULT_LEN_\$\$/g, dfa_obj.table_default.length)
				.replace(/\$\$_DEFAULT_STR_\$\$/g, U.arr_to_str(dfa_obj.table_default))
				.replace(/\$\$_CHECK_LEN_\$\$/g, dfa_obj.table_check.length)
				.replace(/\$\$_CHECK_STR_\$\$/g, U.arr_to_str(dfa_obj.table_check))
				.replace(/\$\$_NEXT_LEN_\$\$/g, dfa_obj.table_next.length)
				.replace(/\$\$_NEXT_STR_\$\$/g, U.arr_to_str(dfa_obj.table_next))
				.replace(/\$\$_ACTION_LEN_\$\$/g, dfa_obj.table_action.length)
				.replace(/\$\$_ACTION_STR_\$\$/g, U.arr_to_str(dfa_obj.table_action))
				.replace(/\$\$_EQC_LEN_\$\$/g, dfa_obj.table_eqc.length)
				.replace(/\$\$_EQC_STR_\$\$/g, U.arr_to_str(dfa_obj.table_eqc))
				.replace(/\$\$_INIT_STATE_\$\$/g, dfa_obj.table_init_state)
				.replace(/\$\$_LEX_STATES_\$\$/g, this.parseState(dfa_obj))
				.replace("$$_ACTION_TABLE_$$", this.parseTable(dfa_obj))
				.replace(/\$\$_LEX_NAME_\$\$/g, this.lex_name)
				.replace("$$_IGNORE_CASE_0_$$", this.case_ignore ? "/*" : "")
				.replace("$$_IGNORE_CASE_1_$$", this.case_ignore ? "*/" : "/*")
				.replace("$$_IGNORE_CASE_2_$$", this.case_ignore ? "" : "*/")
				.replace("##_CONSTRUCT_##", routine['construct'])
				.replace("##_START_##", routine['start'])
				.replace("##_FINISH_##", routine['finish']);
			return output;

		},
		parseState : function(dfa_obj) {
			var s_str = "", i = 0;
			for(var j = 0; j < dfa_obj.dfa_array.length; j++) {
				var dfa = dfa_obj.dfa_array[j];
				s_str += dfa.state_name + " = " + dfa.start.id;
				if(j !== dfa_obj.dfa_array.length - 1)
					s_str += ", ";
			}
			return s_str;
		},
		parseTable : function(dfa_obj) {
			var table_str = "";
			for(var j = 0; j < dfa_obj.dfa_array.length; j++) {
				var dfa = dfa_obj.dfa_array[j];
				for(var i = 0; i < dfa.states.length; i++) {
					var s = dfa.states[i];
					if(s.isAccept) {
						if(this.act_hash[s.action.id] == null) {
							table_str += "case " + s.action.id + ":\n" + s.action.func + "\nbreak;\n"
							this.act_hash[s.action.id] = "";
						}
					}
				}
			}

			return table_str;
		}
	};
})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility); (function(A, C, N, D, T, U) {
/**
 * @author	Yuhang Ge
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://xiaoge.me
 */
 /**
  * 对dfa进行压缩，参考龙书第二版中的算法描述。（其实龙书中的算法描述很他喵的上层的，具体实现写得蛋痛，尤其是调试的时候。。。）
  */
D.DfaMinimize = {
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
		var eqc = Alice.CharTable.eq_class;

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
				this.get_group_id_tmp(Alice.CharTable.getEqc(eqc[i]));
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
				$.log("最小化DFA时出现问题，Action丢失。");
			}
		}

		$.log("dfa minimized. %d states to %d states.", this.size, new_size);
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

})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility);
(function(A,C,N,D,T,U) {
	/**
	 * @author	Yuhang Ge
	 * @email	abraham1@163.com
	 * @address	software institute, nanjing university
	 * @blog	http://xiaoge.me
	 */

	/**
	 * 将dfa压缩成线性数组表，即default, check, base, next
	 * 参考龙书第二版
	 */
	T.Dfa2Table = {
		def : [],
		base : [],
		next : [],
		check : [],
		action : [],

		/*
		 * 对dfa的状态按其输入符集合大小排序。
		 * 排序的目的在于，只可能数量少的集合可能是数量大的集合的子集，
		 * 因此在插入next\check的时候，先插入数量少的集合，
		 * 然后再插入数量多的集合，这样更有可能使得后插入的集合包含已经插入的，
		 * 也就是说，default数组充分利用。
		 */
		sort : function(states) {
			for(var i = states.length - 1; i > 0; i--) {
				for(var j = 0; j < i; j++) {
					if(states[j].table_input.length > states[j + 1].table_input.length) {
						var tmp = states[j];
						states[j] = states[j + 1];
						states[j + 1] = tmp;
					}
				}
				states[i].id = i;
			}
			states[0].id = 0;
		},
		check_base : function(input) {
			var base_id = 0; base_loop:
			while(true) {
				for(var i = 0; i < input.length; i++) {
					if(input[i] === undefined)
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
		/*
		 * 在忽略undefined元素的情况下判断s1集合是否是s2的子集并且非空
		 * 如果s1是空集（即全部是undefined元素【ud_n===s1.table_input.length】）
		 * 也返回false
		 */
		is_in : function(s1, s2) {
			var ud_n = 0;
			for(var i = 0; i < s1.table_input.length; i++) {
				var ele = s1.table_input[i];
				if(ele === undefined) {
					ud_n++;
					continue;
				}
				var k = s2.table_input.indexOf(ele);
				if(k === -1 || s1.next[i].id !== s2.next[k].id)
					return false;
			}
			if(ud_n === s1.table_input.length)
				return false;
			else
				return true;
		},
		del_set : function(s1, s2) {
			/*
			 * 则从s2中删除s1的元素
			 */
			for(var i = 0; i < s1.table_input.length; i++) {
				var j = s2.table_input.indexOf(s1.table_input[i]);
				if(j >= 0)
					s2.table_input[j] = undefined;
			}
		},

		parse : function(dfa_obj) {

			var sts = [];
			for(var i = 0; i < dfa_obj.dfa_array.length; i++) {
				for(var j = 0; j < dfa_obj.dfa_array[i].states.length; j++)
					sts.push(dfa_obj.dfa_array[i].states[j]);
			}
			var len = sts.length;
			var input_max = Alice.CharTable.eq_class.length - 1;
			this.def = [];
			this.def.length = len;
			this.base = [];
			this.base.length = len;
			this.action = [];
			this.action.length = len;
			this.next = [];
			this.check = [];

			for(var i = 0; i < len; i++) {
				sts[i].table_input = U.arrCopy(sts[i].input);
			}
			/*
			 * 首先按输入集的大小从小到到排列，原因见sort函数解释
			 */
			this.sort(sts);

			for(var i = 0; i < len; i++) {

				/*
				 * 依次插入每一个dfa状态
				 * 对每一个dfa状态 i ，首先看它是否包含了之前某个状态，
				 * 如果包含了 x ，则设置default[i] = x，同时把在i中的x元素除去
				 */
				for(var j = i - 1; j >= 0; j--) {
					if(this.is_in(sts[j], sts[i])) {
						this.del_set(sts[j], sts[i]);
						this.def[i] = j;
						//$.dprint("s in : %d in %d",j,i);
						break;
					}
				}
				/*
				 * 然后尝试将i从0位开始插入，如果有碰撞，则进一位。直到可以完全插入没有碰撞。
				 */
				var ipt = sts[i].table_input;
				var base_id = this.check_base(ipt);
				for(var j = 0; j < ipt.length; j++) {
					if(ipt[j] === undefined)
						continue;
					this.next[base_id + ipt[j]] = sts[i].next[j].id;
					this.check[base_id + ipt[j]] = i;
				}
				/*
				 * ============
				 * 接下来的代码是为了让next数组的长度足够长。
				 */
				var tmp_off = base_id + input_max;
				this.next[tmp_off] = this.next[tmp_off];
				this.check[tmp_off] = this.check[tmp_off];

				this.base[i] = base_id;

				/*
				 * 最后填充action数组
				 */
				this.action[i] = sts[i].isAccept ? sts[i].action.id : -1;

			}

			dfa_obj.table_base = this.base;
			dfa_obj.table_default = this.def;
			dfa_obj.table_next = this.next;
			dfa_obj.table_check = this.check;
			dfa_obj.table_action = this.action;
			dfa_obj.table_states = dfa_obj.states;
			dfa_obj.table_eqc = Alice.CharTable.char_table;
			dfa_obj.table_init_state = dfa_obj.default_dfa.start.id;

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

})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility);
(function(A,C,N,D,T,U) {
	/**
	 * @author	Yuhang Ge
	 * @email	abraham1@163.com
	 * @address	software institute, nanjing university
	 * @blog	http://xiaoge.me
	 */

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
		this.char_table = Int32Array ? new Int32Array(this.size) : new Array(this.size);
		//等价类中下一个字符位置
		this.table_next = Int32Array ? new Int32Array(this.size) : new Array(this.size);
		//等价类中上一个字符位置
		this.table_prev = Int32Array ? new Int32Array(this.size) : new Array(this.size);

		/*
		 * empty_set:恒为0的数组，用来清空其它数组。通过Int32Array的set函数
		 */
		this.empty_set = Int32Array ? new Int32Array(this.size + 1) : new Array(this.size + 1);
		/**
		 * 输入字符集，某位置1表示包含该字符。this.size+1，
		 * 额外添加的一位，用来表示字符集中字符个数
		 */
		this.input_set = Int32Array ? new Int32Array(this.size + 1) : new Array(this.size + 1);
		/*
		 * 储存字符集和等价类相比较后的结果，是一个单向链表，
		 * 数值是指向下一位的指针。其中链表头保存在额外的this.size+1中
		 */
		this.compare_set = Int32Array ? new Int32Array(this.size + 1) : new Array(this.size + 1);
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

		/* 生成第一个等价类，即所有输入符属于初始化等价类0 */
		this.init();
	}
	Alice.EquivalenceManager.prototype = {

		addInput : function(nfaInput) {
			if(nfaInput === C.Input.e)
				throw "_addInput";

			//$.dprint("try add nfainput %s",nfaInput.toString());
			var hash_key = nfaInput.toString();
			//$.dprint(hash_key);
			if(this.hash_table[hash_key]) {
				//$.dprint("aready added!");
				return;
			} else {
				this.hash_table[hash_key] = true;
			}
			if(nfaInput.type === C.Input.Type.SINGLE) {
				this.addChar(nfaInput.value);
			} else if(nfaInput.type === C.Input.Type.RANGE || nfaInput.type === C.Input.Type.EXCEPT) {

				this.addCharSet(nfaInput);
			}

		},
		/*
		 * 构建初始的等价类，即开始时所有字符都属于同一个等价类0
		 */
		init : function() {
			this.table_next[this.size - 1] = this.table_prev[0] = -1;
			this.table_next[0] = 1;
			this.table_prev[this.size - 1] = this.size - 2;
			for(var i = 1; i < this.size - 1; i++) {
				this.table_next[i] = i + 1;
				this.table_prev[i] = i - 1;
			}
			this.eq_class.push(0);
		},
		reset : function() {
			for(var i = 0; i < this.size; i++) {
				this.char_table[i] = 0;
				this.table_next[i] = 0;
				this.table_prev[i] = 0;
			}
			this.eq_class.length = 0;
			this.init();
		},
		/**
		 * 插入单个字符
		 */
		addChar : function(input) {

			/*
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
		},
		addCharSet : function(input) {
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
		},
		create_input_set : function(input, except) {
			var size = 0;
			this.input_set.set(this.empty_set);
			for(var i = 0; i < this.size; i++) {
				if(input.isFit(i)) {
					this.input_set[i] = 1;
					size++;
				}
			}
			//$.dprint(this.input_set[this.size]);
			this.input_set[this.size] = size;
			//$.dprint("%d,%d,%d",this.input_set.length,this.size,size);
			//$.dprint(this.input_set[this.size]);
		},
		/**
		 * 对当前等价类进行拆分，利用比较结果集compare_set，将当前等价类双向链表拆分成
		 * 两个等价类双向链表，其中一个是新构造的，另一个是原始的。
		 */
		eqc_partion : function(eqc) {

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

		},
		/**
		 * 比较当前等价类和输入符集合，如果全等返回0，没有任何交集或者等价类是输入符的子集则返回-1，有交集返回1
		 * 在比较过程中，会将已经处理过的字符，即同时存在于输入符集和等价类中的字符清除，并保存在链表this.compare_set中
		 *
		 * @param {int} eqc_index 当前等价类链表表头的位置
		 * @return {int} 0：全等；1：有交集；-1：无交集或者等价类真蕴含于输入符
		 */
		eqc_compare : function(eqc_index) {
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
		},
		/**
		 * 插入一个新的等价类，通过输入字符集构造
		 */
		ins_eqc : function() {
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

		},
		toString : function() {
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
		},
		getEqc : function(input) {
			if(input < 0 || input >= this.size)
				return 0;
			return this.char_table[input];
		},
		output : function() {
			$.dprint("----Output----");
			$.aprint(this.eq_class);
			$.aprint(this.char_table);
			$.aprint(this.table_prev);
			$.aprint(this.table_next);
			$.dprint(this.toString());
			$.dprint("----End Output----");
		}
	}

	/**
	 * 全局的一个实例，方便使用。
	 */
	if(!Alice.CharTable)
		Alice.CharTable = new Alice.EquivalenceManager(256);


})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility);

