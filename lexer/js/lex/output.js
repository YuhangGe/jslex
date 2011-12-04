Daisy = {};
Daisy.__id__ = 0;
Daisy.State = function(acc) {
	this.accept = acc;
	this.input = [];
	this.next = [];
	this.id = Daisy.__id__++;
}

Daisy.State.prototype.move = function(input) {
	var eqc = Alice.CharTable.getEqc(input);
	if(eqc){
		var i = this.input.indexOf(eqc);
		if(i < 0)
			return false;
		else
			return this.next[i];
	}else
		return false;
}


Daisy.Lexer = function(source) {
	this.src = source;
	if(this.src)
		this.end = this.src.length;
	this.idx = 0;
	this.chr = null;
	//初始状态，init_state，恒为状态表中的第一个起始状态。
	this.i_s = Daisy.StartState;
	//当前状态，current_state
	this.c_s = this.i_s;
	/*
	 * 下一个状态，next_state. 如果当前状态，this.c_s，是可接受的，
	 * 则查看是否有下一个状态。
	 */
	this.n_s = null;
	//记录上一次可接受状态。last_state
	this.l_s = [0, 0, "", false];

	this.token = [];
	this.r = undefined;
}
Daisy.Lexer.prototype.setSource = function(source) {
	this.src = source;
	this.end = this.src.length;
	this.idx = 0;
	this.c_s = this.i_s;
	this.n_s = null;
	this.l_s[3] = false;
	this.token.length = 0;
	this.r = undefined;
}
Daisy.Lexer.prototype.init_s = function() {
	this.c_s = this.i_s;
	this.token.length = 0;
	this.l_s[3] = false;
}

Daisy.Lexer.prototype.read_ch = function() {
	if(this.idx >= this.end) {
		this.idx++;
		return this.chr = -1;
	} else
		return this.chr = this.src.charCodeAt(this.idx++);
}
Daisy.Lexer.prototype.back_ch = function() {
	this.idx--;
}
Daisy.Lexer.prototype.scan = function() {
	var eof = false;
	while(true) {
		if(this.n_s) {
			this.c_s = this.n_s;
			this.n_s = false;
		} else {
			this.read_ch();
			this.c_s = this.c_s.move(this.chr);
		}
		this.token.push(this.chr);
		if(!this.c_s) {
			if(this.l_s[3]) {
				//$.dprint("back history action");
				this.r = this.l_s[3].action(this.l_s[1], this.l_s[2]);
				this.init_s();
				this.idx = this.l_s[0] + this.l_s[1];
				break;
			} else if(this.read_ch()>=0){
				//$.dprint("not match at %d, len: %d, txt:%s. skip.", this.idx - 1, this.len, this.txt);
				this.back_ch();
				this.init_s();
				continue;
			} else{
				eof = true;
				//$.dprint("finish not match at %d, len:%d, txt: %s", this.idx - 1, this.len, this.txt);
				break;
			}
			
		}
		if(this.c_s.accept) {
			if(this.n_s = this.c_s.move(this.read_ch())) {
				this.l_s = [this.idx - this.token.length - 1, this.token.length, String.fromCharCode.apply(this,this.token), this.c_s];
			} else {
				this.r = this.c_s.action(this.token.length, String.fromCharCode.apply(this,this.token));
				this.init_s();
				this.back_ch();
				break;
			}
		}
	}
	if(eof)
		throw 0;
	return this.r;
}

Daisy.lex = function(source) {
	if(typeof Daisy.Init === 'function')
		Daisy.Init();
	var l = new Daisy.Lexer(source);
	while(true){
		try{
			l.scan();
		}catch(e){
			break;
		}
	}
	if(typeof Daisy.Wrap === 'function')
		Daisy.Wrap();
}
Daisy.S = [];
Daisy.F = [];


Daisy.F = [
function(len, txt) {
$.dprint("match M2 abb, len: %d, txt: %s",len,txt);
},
function(len, txt) {
$.dprint("match M3 a*b+, len: %d, txt: %s",len,txt);
},
function(len, txt) {
$.dprint("match M1 a, len: %d, txt: %s",len,txt);
},

];
(function() {
var S = Daisy.S;
var F = Daisy.F;
for(var i = 0; i < 6; i++)
	S.push(new Daisy.State(false));
S[0].accept = true;
S[0].action = F[0];
S[0].input.push(2);
S[0].next.push(S[1]);
S[1].accept = true;
S[1].action = F[1];
S[1].input.push(2);
S[1].next.push(S[1]);
S[2].accept = true;
S[2].action = F[1];
S[2].input.push(2);
S[2].next.push(S[0]);
S[3].accept = true;
S[3].action = F[2];
S[3].input.push(1,2);
S[3].next.push(S[4],S[2]);
S[4].input.push(1,2);
S[4].next.push(S[4],S[1]);
S[5].input.push(1,2);
S[5].next.push(S[3],S[1]);

Daisy.StartState = S[5];

})();



		
		
