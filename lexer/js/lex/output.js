Daisy = {};

Daisy.State = function(acc) {
	this.accept = acc;
	this.dir = {};
	this.def = [];
	this.ept = [];
}

Daisy.State.prototype.move = function(input) {

	if(this.dir[input])
		return this.dir[input];

	var i;

	if(this.def.length > 0)
		for( i = 0; i < this.def.length; i++)
		if(this.test(this.def[i], input))
			return this.defN[i];

	var e, _in;

	if(this.ept.length > 0)
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

	return null;

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

		case 22:
			if(i !== '\n')
				return true;
			break;
	}
	return false;
}

Daisy.aalen = 0;
Daisy.aaval = "";

Daisy.lex = function(str) {

	var len = str.length, idx = 0, chr = null;
	var s = this.S[0], s2 = null;
	while(true) {
		if(s2 !== null) {
			s = s2;
			s2 = null;
		} else {
			if(idx === len) {
				$.dprint("finish");
				break;
			}
			chr = str[idx++];
			s = s.move(chr);
		}
		if(s === null) {
			$.dprint(idx + "," + len);
			continue;
		}
		this.aalen++;
		this.aaval += chr;
		if(s.accept) {
			if(idx === len) {
				s.action();
				this.aalen = 0;
				this.aaval = "";
			} else {
				chr = str[idx++];
				s2 = s.move(chr);
				if(s2 === null) {
					s.action();
					s = this.S[0];
					this.aalen = 0;
					this.aaval = "";
					idx--;
				}
			}
		}

	}
}

Daisy.F = [
function() {
	$.dprint("M0 :" + Daisy.aalen + ',' + Daisy.aaval);
},

function() {
	$.dprint("M1 :" + Daisy.aalen + ',' + Daisy.aaval);
},

function() {
	$.dprint("M2 :" + Daisy.aalen + ',' + Daisy.aaval);
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

$(function() {
	Daisy.lex("abaabbbb");
})