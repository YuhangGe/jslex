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
	'"':14,
	'\'':15,
	'.':16,
	CHAR:17,
	DIGIT:18,
	NOTDIGIT:22,
	SPACE:19,
	WORD: 20,
	NOTWORD:21
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

Alice.Escape={
	't':'\t',
	'b':'\b',
	'n':'\n',
	'f':'\f',
	'r':'\r',
	'v':'\v'
}
Alice.DefToken={
	'd':Alice.RegToken.DIGIT,
	'D':Alice.RegToken.NOTDIGIT,
	's':Alice.RegToken.SPACE,
	'S':Alice.RegToken.NOTSPACE,
	'w':Alice.RegToken.WORD,
	'W':Alice.RegToken.NOTWORD,
}
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
		if(Alice.Escape[c]!=null)
			this.cur_t = new Alice.RegToken(Alice.RegTag.CHAR,Alice.Escape[c]);
		else if(Alice.DefToken[c]!=null){
			this.cur_t = Alice.DefToken[c];
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
	case '\"':
	case '\'':
	case '.':
		this.cur_t = new Alice.RegToken(Alice.RegTag[c],c);
		break;
	default:
		this.cur_t = new Alice.RegToken(Alice.RegTag.CHAR,c);
		break;
	}
	return this.cur_t;
}
/* 以下是正则文法的推理。
 * R->R|E
 * R->E
 * E->ET
 * E->T
 * T->S*
 * T->S
 * S->(R)
 * S->char
 * ---------------
 * R->ER'
 * R'->|ER' | e
 * E->TE'
 * E'->TE'|e
 * T->SO
 * T->S
 * O->*|+|?|N
 * N->{D}
 * D->digit,D2
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
		if(this.cur_t.tag===Alice.RegTag.CHAR){
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
	if(this.cur_t.tag===Alice.RegTag['*']){
		//$.dprint('*');
		nfa1=Alice.NFA.createStarNFA(nfa1);
		this.read_token();
		//$.dprint(nfa1);
	}
	
	//$.dprint(nfa1);
	
	return nfa1;
}
Alice.Str2Nfa.prototype._s = function() {
	var nfa;
	if(this.cur_t.tag===Alice.RegTag['(']){
		//$.dprint('(');
		this.read_token();
		nfa=this._r();
		if(this.cur_t.tag!==Alice.RegTag[')'])
			throw 0;
		this.read_token();
		//$.dprint(nfa);
		//$.dprint(')')
		return nfa;
	}else if(this.cur_t.tag===Alice.RegTag.CHAR){
		nfa = Alice.NFA.createSingleNFA(this.cur_t.value);
		//$.dprint(this.cur_t.value);
		//$.dprint(nfa);
		
		this.read_token();
		return nfa;
	}else
		throw "wrong at _s";
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
