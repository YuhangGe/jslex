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
