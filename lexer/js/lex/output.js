Daisy = {};

Daisy.State = function(acc) {
	this.accept = acc;
	this.dir = {};
	this.def = [];
	this.ept = [];
}

Daisy.State.prototype.move = function(input) {
	if(!input)
		return false;
	if(this.dir[input])
		return this.dir[input];

	var i;

	for( i = 0; i < this.def.length; i++)
	if(this.test(this.def[i], input))
		return this.defN[i];

	var e, _in;

	for( i = 0; i < this.ept.length; i++) {
		e = this.ept[i];
		_in = false;
		for(var j = 0; j < e.length; j++) {
			if(this.test(e[j], input) || e[j] === input) {
				_in = true;
				break;
			}
		}
		if(_in === false)
			return this.eptN[i];
	}

	return false;

}
Daisy.State.prototype.test = function(c, i) {
	switch(c) {
		case 10:
			if(i >= '0' && i <= '9')
				return true;
			break;
		case 11:
			if(i < '0' || i > '9')
				return true;
			break;
		case 12:
			if(i === ' ' || i === '\n' || i === '\t' || i === '\v' || i === '\f' || i === '\r')
				return true;
			break;
		case 13:
			break;
		case 14:
			if(i >= 'a' && i <= 'z' || i >= 'A' && i <= 'Z' || i >= '0' && i <= '9' || i === '_')
				return true;
			break;
		case 15:
			break;
		case 16:
			if(i >= 'a' && i <= 'z' || i >= 'A' && i <= 'Z')
				return true;
			break;
		case 22:
			if(i !== '\n')
				return true;
			break;
	}
	return false;
}

Daisy.Lexer = function(source) {
	this.src = source;
	if(this.src)
		this.end = this.src.length;
	this.idx = 0;
	this.chr = null;
	//初始状态，init_state，恒为状态表中的第一个起始状态。
	this.i_s = Daisy.S[0];
	//当前状态，current_state
	this.c_s = this.i_s;
	/*
	 * 下一个状态，next_state. 如果当前状态，this.c_s，是可接受的，
	 * 则查看是否有下一个状态。
	 */
	this.n_s = null;
	//记录上一次可接受状态。last_state
	this.l_s = [0, 0, "", false];

	this.len = 0;
	this.txt = "";
	this.r = undefined;
}
Daisy.Lexer.prototype.setSource = function(source) {
	this.src = source;
	this.end = this.src.length;
	this.idx = 0;
	this.c_s = this.i_s;
	this.n_s = null;
	this.l_s[3] = false;
	this.len = 0;
	this.txt = "";
	this.r = undefined;
}
Daisy.Lexer.prototype.init_s = function() {
	this.c_s = this.i_s;
	this.len = 0;
	this.txt = "";
	this.l_s[3] = false;
}

Daisy.Lexer.prototype.read_ch = function() {
	if(this.idx >= this.end) {
		this.idx++;
		return this.chr = false;
	} else
		return this.chr = this.src[this.idx++];
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
			this.c_s = this.c_s.move(this.read_ch())
		}
		this.len++;
		this.txt += this.chr;
		if(!this.c_s) {
			if(this.l_s[3]) {
				//$.dprint("back history action");
				this.r = this.l_s[3].action(this.l_s[1], this.l_s[2]);
				this.init_s();
				this.idx = this.l_s[0] + this.l_s[1];
				break;
			} else if(this.read_ch()){
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
				this.l_s = [this.idx - this.len - 1, this.len, this.txt, this.c_s];
			} else {
				this.r = this.c_s.action(this.len, this.txt);
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
/*
 Daisy.F = [
 function(len, val) {
 $.dprint("M0 :" + len + ',' + val);
 },

 function(len, val) {
 $.dprint("M1 :" + len + ',' + val);
 },

 function(len, val) {
 $.dprint("M2 :" + len + ',' + val);
 }];

 Daisy.S = []; (function() {

 var S = Daisy.S;
 var F = Daisy.F;
 for(var i = 0; i < 6; i++)
 S.push(new Daisy.State(false));

 S[0].dir = {
 'a' : S[1],
 'b' : S[2]
 }
 S[1].dir = {
 'a' : S[3],
 'b' : S[5]
 }
 S[1].accept = true;
 S[1].action = F[0];

 S[2].dir = {
 'b' : S[2]
 }
 S[2].accept = true;
 S[2].action = F[2];

 S[3].dir = {
 'a' : S[3],
 'b' : S[2]
 }
 S[4].dir = {
 'b' : S[2]
 }
 S[4].accept = true;
 S[4].action = F[1];

 S[5].dir = {
 'b' : S[4]
 }
 S[5].accept = true;
 S[5].action = F[2];
 })();
 */
/*
 Daisy.F = [
 function(len, val) {
 $.dprint("M0 : "+len+","+val);
 $.dprint("love you, daisy");
 },
 function(len, val) {
 $.dprint("M1 : "+len+","+val);
 },
 function(len, val) {
 $.dprint("M2 : "+len+","+val);
 },

 ];

 (function() {
 var S = Daisy.S;
 var F = Daisy.F;
 for(var i = 0; i < 7; i++)
 S.push(new Daisy.State(false));
 S[0].dir = {
 'a' : S[1],
 'b' : S[2],
 }
 S[1].accept = true;
 S[1].action = F[0];
 S[1].dir = {
 'a' : S[3],
 'b' : S[4],
 }
 S[2].accept = true;
 S[2].action = F[1];
 S[2].dir = {
 'b' : S[5],
 }
 S[3].dir = {
 'a' : S[3],
 'b' : S[2],
 }
 S[4].accept = true;
 S[4].action = F[1];
 S[4].dir = {
 'b' : S[6],
 }
 S[5].accept = true;
 S[5].action = F[1];
 S[5].dir = {
 'b' : S[5],
 }
 S[6].accept = true;
 S[6].action = F[2];
 S[6].dir = {
 'b' : S[5],
 }

 })();

 $(function() {
 var str = "aabbaaabbabbaaac";
 $.dprint(str);
 Daisy.lex(str);
 })
 */
