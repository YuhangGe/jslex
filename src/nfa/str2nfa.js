var N = require('./nfa.js');
var _ = require('underscore');
var C = require('../core/core.js');
var $ = require('../utility/utility.js');

var Str2Nfa;

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
	 * 从正则字符串到nfa，参看龙书。
	 * 此处使用lr的自顶向下递归进行语法制导翻译，对于具体的nfa的生成，包括各种运算，交由Alice.NFA类的静态函数进行。
	 */
	module.exports = Str2Nfa = {
		str : null,
		idx : 0,
		cur_t : null,
		len : 0,
		nfa : null,
		/*
		 * 当前是否正处于引号之中，如果处于引号中，quote=该引号（“或者‘），否则quote=null
		 */
		quote : null
	};
	_.extend(Str2Nfa, {
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
					//$.log(c);
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
					//$.log('|')
					this.read_token();
					nfa2 = this._e();
					nfa1 = N.NFA.createOrNFA(nfa1, nfa2);
					//$.log(nfa1);
				} else
					break;
			}
			//$.log(nfa1);

			return nfa1;
		},
		_e : function() {
			var nfa1 = this._t();
			var nf2;
			while(true) {
				if(this.cur_t.tag !== N.Tag['|'] && this.cur_t.tag !== N.Tag[')'] && this.cur_t !== N.Token.EOF) {
					nfa2 = this._t();
					nfa1 = N.NFA.createJoinNFA(nfa1, nfa2);
					//$.log(nfa1);
				} else
					break;
			}
			//$.log(nfa1);
			return nfa1;
		},
		_t : function() {
			var nfa1 = this._s(), go_on = true;
			while(go_on){
				switch(this.cur_t.tag) {

				case N.Tag['*']:
					//$.log('*');
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
                        go_on = false;
					}
					break;
				default:
                    go_on = false;
					break;
				}
//				this.read_token();
			}
			

			//$.log(nfa1);

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
					//$.log('(');
					this.read_token();
					nfa = this._r();
					if(this.cur_t.tag !== N.Tag[')']) {
                        console.trace();
                        throw "_s 0";

                    }
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
					if(this.cur_t.tag !== N.Tag['}']) {
                        console.trace();
                        throw "_s 3";

                    }
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
                /*
                 * 符号^和-只在[]包含时才有特殊意义，否则视为普通字符
                 */
				case N.Tag.CHAR:
                case N.Tag['-'] :
                case N.Tag['^'] :
					nfa = N.NFA.createSingleNFA(this.cur_t.value.charCodeAt(0));
					this.read_token();
					break;
				default:
					$.err("_s 2", this.cur_t);
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
                $.err("_u 0 :" + w);
		},
		_u_not_digit : function(chr) {
			return chr < '0' || chr > '9';
		},
		_str : function() {
			var str = "";

			while(this.cur_t.tag !== this.quote) {

				if(this.cur_t === N.Token.EOF)
                    $.err("_str 0");
				str += this.cur_t.value;

				this.read_token();
			}
			//$.log(str);
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
						$.arrUnion(chrs, C.DEF_INPUT[c_from]);
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
                        $.err("_h 0");
					}
					c_to = this.cur_t.value;
					if(c_to >= c_from) {
						this._h_add(c_from, c_to, chrs);
					} else
                        $.err("_h 1");
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
			var uni_chrs = $.uniqueSort(chrs);
			//$.log(uni_chrs);
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
			//	$.log("wrong!"+e);
			//}
			return this.nfa;
		}
	});
