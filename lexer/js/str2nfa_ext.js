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


/**
 * RegTag:对正则字条串进行语法分析时判断该token的类别
 * RegToken:对正则字符串进行词法分析时的token
 */
Alice.RegTag={
	EOF:-1,
	
	'(':1,
	')':2,
	'*':5,
	'|':6,
	'^':7,
	'[':8,
	']':9,
	'+':10,
	'?':11,
	'{':12,
	'}':13,
	'.':16,
	CHAR:17,
	SPECIAL:18 // \d \D \s \S \w
}
Alice.RegToken=function(tag,value){
	this.tag=tag;
	this.value=value;
}
Alice.RegToken.EOF=new Alice.RegToken(Alice.RegTag.EOF,null);
Alice.RegToken.DIGIT=new Alice.RegToken(Alice.RegTag.DIGIT,'0-9');
Alice.RegToken.SPACE=new Alice.RegToken(Alice.RegTag.SPACE,'\f\n\r\t\v');
Alice.RegToken.WORD=new Alice.RegToken(Alice.RegTag.WORD,'0-9a-zA-Z_');
Alice.RegToken.NOTWORD=new Alice.RegToken(Alice.RegTag.NOTWORD,'0-9a-zA-Z_');
Alice.RegToken.NOTDIGIT=new Alice.RegToken(Alice.RegTag.NOTWORD,'0-9');
Alice.RegToken.NOTSPACE=new Alice.RegToken(Alice.RegTag.NOTSPACE,'\f\n\r\t\v');

Alice.RegEscape={
	't':'\t',
	'b':'\b',
	'n':'\n',
	'f':'\f',
	'r':'\r',
	'v':'\v'
}
Alice.RegSpecial={
	'd': {'array':'0123456789'.split(''),'nfa':null},
	'D':'',
	's': {'array':'\f\n\r\t\v'.split(''), 'nfa':null},
	'S':'',
	'w': {'array':'0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ_'.split(''),'nfa':null},
	'W':'',
}
Alice.RegSpecial.d.nfa=Alice.NFA.createMultiNFA(Alice.RegSpecial.d.array);
Alice.RegSpecial.s.nfa=Alice.NFA.createMultiNFA(Alice.RegSpecial.s.array);
Alice.RegSpecial.w.nfa=Alice.NFA.createMultiNFA(Alice.RegSpecial.w.array);
/**
 * 从正则字符串到nfa，参看龙书。
 * 此处使用lr的自顶向下递归进行语法制导翻译，对于具体的nfa的生成，包括各种运算，交由Alice.NFA类的静态函数进行。
 */
Alice.Str2Nfa = function() {
	this.str = null;
	this.idx = 0;
	this.cur_t = null;
	this.len = 0;
	this.nfa = null;
}
Alice.Str2Nfa.prototype.read_ch = function() {
	if(this.idx === this.len){
		return null;
	}else{
		var c=this.str[this.idx];
		this.idx++;
		return c;
	}
}
Alice.Str2Nfa.prototype.read_token = function() {
	var c=this.read_ch();
	if(c===null){
		this.cur_t=Alice.RegToken.EOF;
		return this.cur_t;
	}
	switch(c){
	case '\\':
		c=this.read_ch();
		if(c===null)
			throw 1;
		if(Alice.RegEscape[c]!=null)
			this.cur_t = new Alice.RegToken(Alice.RegTag.CHAR,Alice.RegEscape[c]);
		else if(Alice.RegSpecial[c]!=null){
			this.cur_t = new Alice.RegToken(Alice.RegTag.SPECIAL,c);
		}else 
			this.cur_t = new Alice.RegToken(Alice.RegTag.CHAR,c);
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
		this.cur_t = new Alice.RegToken(Alice.RegTag[c],c);
		break;
	default:
		this.cur_t = new Alice.RegToken(Alice.RegTag.CHAR,c);
		break;
	}
	return this.cur_t;
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
 * S->str
 * S->char
 * H->I J
 * I->^|e
 * J->KJ'
 * J'->KJ'|e
 * K->char - char | char
 */
Alice.Str2Nfa.prototype._r = function() {
	var nfa1,nfa2;
	nfa1=this._e();
	while(true){
		if(this.cur_t.tag===Alice.RegTag['|']){
			//$.dprint('|')
			this.read_token();
			nfa2=this._e();
			nfa1=Alice.NFA.createOrNFA(nfa1,nfa2);
			//$.dprint(nfa1);
		}else
			break;
	}
	//$.dprint(nfa1);

	return nfa1;
}
Alice.Str2Nfa.prototype._e = function() {
	var nfa1=this._t();
	var nf2;
	while(true){
		if(this.cur_t.tag!==Alice.RegTag['|'] 
			 && this.cur_t.tag!==Alice.RegTag[')']
			 && this.cur_t!==Alice.RegToken.EOF){
			nfa2=this._t();
			nfa1=Alice.NFA.createJoinNFA(nfa1,nfa2);
			//$.dprint(nfa1);
		}else
			break;
	}
	//$.dprint(nfa1);
	return nfa1;
}
Alice.Str2Nfa.prototype._t = function() {
	var nfa1=this._s();
	switch(this.cur_t.tag){
		
	case Alice.RegTag['*']:
		//$.dprint('*');
		nfa1=Alice.NFA.createStarNFA(nfa1);
		this.read_token();
		break;
	case Alice.RegTag['+']:
		nfa1=Alice.NFA.createPlusNFA(nfa1);
		this.read_token();
		break;
	case Alice.RegTag['?']:
		nfa1=Alice.NFA.createQuesNFA(nfa1);
		this.read_token();
		break;
	case Alice.RegTag['{']:
		this.read_token();
		nfa1=this._d(nfa1);
		if(this.cur_t.value!=='}')
			throw "_t 0";
		this.read_token();
		break;
		//$.dprint(nfa1);
	}
	
	//$.dprint(nfa1);
	
	return nfa1;
}
Alice.Str2Nfa.prototype._d=function(nfa){
	var low_str="",high_str="",low,high;
	while(true){
		var c=this.cur_t.value;
		if(c<'0' || c>'9')
			break;
		low_str+=c;
		this.read_token();
	}
	if(this.cur_t.value!==','){
		if(this.cur_t.tag===Alice.RegTag['}']){
			if(low_str=="")
				throw "_d 0";
			low=Number(low_str);
			return Alice.NFA.createNumberNFA(nfa,low);
		}
		else
			throw "_d 1";
	}
	this.read_token();
	while(true){
		var c=this.cur_t.value;
		if(c<'0' || c>'9')
			break;
		high_str+=c;
		this.read_token();
	}
	low=(low_str==""?null:Number(low_str));
	high=(high_str==""?null:Number(high_str));
	return Alice.NFA.createBoundNFA(nfa,low,high);
}
Alice.Str2Nfa.prototype._s = function() {
	var nfa;
	switch(this.cur_t.tag){
	case Alice.RegTag['(']:
		//$.dprint('(');
		this.read_token();
		nfa=this._r();
		if(this.cur_t.tag!==Alice.RegTag[')'])
			throw "_s 0";
		this.read_token();
		break;
	case Alice.RegTag['[']:
		this.read_token();
		nfa=this._h();
		if(this.cur_t.tag!==Alice.RegTag[']'])
			throw "_s 1";
		this.read_token();
		break;
	case Alice.RegTag.SPECIAL:
		nfa = Alice.RegSpecial[this.cur_t.value].nfa.copy();
		this.read_token();
		break;
	case Alice.RegTag.CHAR:
		nfa = Alice.NFA.createSingleNFA(this.cur_t.value);
		//$.dprint(this.cur_t.value);
		//$.dprint(nfa);
		
		this.read_token();
		break;
	default:
		throw "_s 2";
	}
	return nfa;
}
/*
 * 解析[^a-z0-9]一类的正则子串,^排除暂时没有实现
 */
Alice.Str2Nfa.prototype._h = function(){
	var not=false;
	// if(this.cur_t.tag===Alice.RegTag['^']){
		// not=true;
		// this.read_token();
	// }
	var chrs=[];
	while(this.cur_t.tag!==Alice.RegTag[']']){
		var c_from,c_to;
		c_from=this.cur_t.value;
		if(this.cur_t.tag===Alice.RegTag.SPECIAL){
			Alice._arrPush(chrs,Alice.RegSpecial[c_from].array);
			this.read_token();
			continue;
		}
		this.read_token();
		if(this.cur_t.value!=='-'){
			chrs.push(c_from);
		}else{
			this.read_token();
			if(this.cur_t.tag===Alice.RegTag[']']){
				chrs.push(c_from);
				chrs.push('-');
				break;
			}
			c_to=this.cur_t.value;
			if(c_to>=c_from){
				this._h_add(c_from,c_to,chrs);
			}else
				throw "_h 0";
			this.read_token();
		}
	}
	return this._h_nfa(chrs,not);
}
/**
 * _h辅助函数，将from到to区间的字符加入到arr中。
 */
Alice.Str2Nfa.prototype._h_add=function(from,to,arr){
	var f=from.charCodeAt(0),t=to.charCodeAt(0);
	for(var i=f;i<=t;i++){
		arr.push(String.fromCharCode(i));
	}
}
/*
 * _h解析的辅助函数，通过chrs数组中的字符构建nfa。
 * not参数指明是否是排除chrs数组中的字符的剩下字符。
 */
Alice.Str2Nfa.prototype._h_nfa=function(chrs,not){
	var rtn,tmp;
	var len=chrs.length;
	if(len===0)
		return Alice.NFA.createSingleNFA(Alice.e);
	rtn = Alice.NFA.createMultiNFA(chrs);
	return rtn;
}
Alice.Str2Nfa.prototype.run = function(str) {
	this.str = str;
	this.idx = 0;
	this.len = str.length;
	this.nfa = null;
	//try{
		this.read_token();
		this.nfa=this._r();
	//}catch(e){
	//	$.dprint("wrong!"+e);
	//}
	return this.nfa;
}



