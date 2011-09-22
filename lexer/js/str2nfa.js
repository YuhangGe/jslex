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
	ALPHA:0,
	'(':1,
	')':2,
	'*':5,
	'|':6
}
Alice.RegToken=function(tag,value){
	this.tag=tag;
	this.value=value;
}
Alice.RegToken.EOF=new Alice.RegToken(Alice.RegTag.EOF,null);

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
/* 以下是正则文法的推理
 * R->R|E
 * R->E
 * E->ET
 * E->T
 * T->S*
 * T->S
 * S->(R)
 * S->alpha
 * ---------------
 * R->ER'
 * R'->|ER' | e
 * E->TE'
 * E'->TE'|e
 * T->S*
 * T->S
 * S->(R)
 * S->alpha
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
		if(this.cur_t.tag===Alice.RegTag.ALPHA){
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
	}else if(this.cur_t.tag===Alice.RegTag.ALPHA){
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
		else
			this.cur_t = new Alice.RegToken(Alice.RegTag.ALPHA,c);
		break;
	case '*':
	case '(':
	case ')':
	case '|':
		this.cur_t = new Alice.RegToken(Alice.RegTag[c],c);
		break;
	default:
		this.cur_t = new Alice.RegToken(Alice.RegTag.ALPHA,c);
		break;
	}
	return this.cur_t;
}