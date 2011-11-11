/**
 * @author	YuhangGe
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://yuhanghome.net
 */

/**
 * common.js
 * 公共模块，包括各种辅助函数，辅助类
 */
if( typeof Alice === 'undefined')
	Alice = {};

/*
 * 空符ε
 */
Alice.e = {
	toString : function() {
		return "ε";
	}
}

/**
 * 辅助函数命名空间
 */
Alice.Help = {};

jQuery.extend(Alice.Help, {
	_d : {
		0 : "\\d", //数字：	\d
		1 : "\\D", //非数字：	\D
		2 : "\\s", //空字符\f\n\r\t\v：	\s
		3 : "\\S", //非字符：	\S
		4 : "\\w", //字符a-zA-Z_：\s
		5 : "\\W", //非字符：	\W
		6 : "\\a", //字母：	\a
		7 : "\\A", //非字母：	\A
		8 : "\\u", //大写字母：\u
		9 : "\\U", //非大写字母：\U
		10 : "\\l", //小写字母：\l
		11 : "\\L", //非小写字母：\L
		12 : ".", //除\n外任意字符：.
		get : function(id) {
			if(this[id])
				return this[id];
			else
				return id;
		}
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
			while(true){
				k = n % len;
				chr.push(this.names[k]);
				n = (n - k) / len;
				if(n===0)
					break;
			}
			//$.dprint(chr);
			var rtn="";
			for(var i=chr.length-1;i>=0;i--)
				rtn+=chr[i];
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
		return chr >= '0' && chr <= '9';
	},
	isNotDigit : function(chr) {
		return chr < '0' || chr > '9';
	},
	isLetter : function(chr) {
		//$.dprint("isLetter:"+chr);
		return chr >= 'a' && chr <= 'z' || chr >= 'A' && chr <= 'Z';
	},
	isNotLetter : function(chr) {
		return chr < 'A' || chr > 'Z' && chr < 'a' || chr > 'z';
	},
	isWord : function(chr) {
		//$.dprint("isWord:" + chr);
		return this.isLetter(chr) || this.isDigit(chr) || chr === '_';
	},
	isNotWord : function(chr) {
		return !this.isWord(chr);
	},
	isSpace : function(chr) {
		return chr === ' ' || chr === '\t' || chr === '\n' || chr === '\r' || chr === '\f' || chr === '\v';
	},
	isNotSpace : function(chr) {
		return !this.isNotSpace(chr);
	},
	isUpper : function(chr) {
		return chr >= 'A' && chr <= 'Z';
	},
	isNotUpper : function(chr) {
		return chr < 'A' || chr > 'Z';
	},
	isLower : function(chr) {
		return chr >= 'a' && chr <= 'z';
	},
	isNotLower : function(chr) {
		return chr < 'a' || chr > 'z';
	},
	isDot : function(chr) {
		return chr !== '\n';
	}
});
