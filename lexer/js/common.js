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


/**
 * 辅助函数命名空间
 */
Alice.Help = {};

jQuery.extend(Alice.Help, {
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
	uniqueArr : function(arr){
		var u_arr=[];
		for(var i=0;i<arr.length;i++){
			if(u_arr.indexOf(arr[i])===-1)
				u_arr.push(arr[i]);
		}
		return u_arr;
	},
	/**
	 * 对arr进行排序，并排除重复元素，返回新的一个数组
	 */
	uniqueSort : function(arr){
		var s_arr = new Array(arr.length), end = 1;
		s_arr[0] = arr[0];
	
	out_for:	
		for(var i=1,len=arr.length;i<len;i++){
			var elm = arr[i];
			for(var j = 0; j<end ;j++){
				if(arr[i] === s_arr[j]){
					continue out_for;
				}else if(elm < s_arr[j]){
					s_arr.splice(j,0,elm);
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
	arrUnion:function(arr1,arr2){
		for(var i=0;i<arr2.length;i++)
			arr1.push(arr2[i]);
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
		return chr < 48 || chr > 57;
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



Alice.Tag = {};
Alice.DEF_INPUT = {};
Alice.DEF_FUNC = {};
(function(){
	
	var T = Alice.Tag;
	var D = Alice.DEF_INPUT;
	var F = Alice.DEF_FUNC;
	var H = Alice.Help;
	
	T.DIGIT = 10; 		//数字：	\d
	T.NOT_DIGIT = -1;	//非数字：	\D
	T.SPACE = 12;	//空字符\f\n\r\t\v：	\s
	T.NOT_SPACE = -2;	//非字符：	\S
	T.WORD = 14;		//字符a-zA-Z_：\s
	T.NOT_WORD = -3;	//非字符：	\W
	T.LETTER = 16;		//字母：	\a
	T.NOT_LETTER = -4;	//非字母：	\A
	T.UPPER = 18;		//大写字母：\u
	T.NOT_UPPER = -5;	//非大写字母：\U
	T.LOWER = 20;	//小写字母：\l
	T.NOT_LOWER = -6;	//非小写字母：\L
	T.DOT = -7;	//除\n外任意字符：.
	
	var s2arr=function(str){
		var rtn=[];
		for(var i=0;i<str.length;i++)
			rtn.push(str.charCodeAt(i));
		return rtn;
	}
	D[T.DIGIT] = D[T.NOT_DIGIT] = s2arr("0123456789");
	D[T.WORD]=s2arr("abcdefghilklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_");
	D[T.SPACE]=s2arr("\n\t\v\v\f");
	D[T.LETTER]=s2arr("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
	D[T.LOWER]=s2arr("abcdefghigklmnopqrstuvwxyz");
	D[T.UPPER]=s2arr("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
	
	F[T.NOT_DIGIT] = H.isNotDigit;
	F[T.NOT_WORD] = H.isNotWord;
	
})();