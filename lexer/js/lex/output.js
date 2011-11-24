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
		case 16:
			if(i >='a' && i <= 'z' || i>='A' && i<='Z')
				return true;
			break;
		case 22:
			if(i !== '\n')
				return true;
			break;
	}
	return false;
}

Daisy.lex = function(str) {
	
	var end = str.length, idx = 0, chr = null;
	var s = this.S[0], s2 = null;
	var his = [0, 0, "", null], len = 0, val = "";
	while(true) {
		if(s2) {
			s = s2;
			s2 = null;
		} else {
			if(idx >= end) {
				$.dprint("finish not match");
				$.dprint("at:" + (idx - 1) + "," + len + "," + val);
				break;
			}
			//$.dprint("idx:" + idx);
			s = s.move( chr = str[idx++]);
		}
		if(s === null) {

			if(his[3]) {
				$.dprint("back history action");
				his[3].action(his[1], his[2]);
				idx = his[0] + his[1];
				//$.dprint(his);
				len = 0;
				val = "";
				his[3] = null;
			} else {
				//$.dprint((idx-1) + "," + len + "," + val);
				idx++;
			}
			s = Daisy.S[0];
			continue;
		}
		len++;
		val += chr;
		if(s.accept) {
			if(idx === end) {
				s.action(len, val);
				$.dprint("finish yes");
				if(typeof Daisy.wrap === 'function')
					Daisy.wrap();
				break;
			}
			s2 = s.move( chr = str[idx++]);
			if(s2 === null) {

				s.action(len, val);
				s = this.S[0];
				len = 0;
				val = "";
				his[3] = null;
				idx--;
				//$.dprint("action 1:" + idx);
			} else {
				his[0] = idx - len - 1;
				his[1] = len;
				his[2] = val;
				his[3] = s;
				//$.dprint(his);
			}

		}

	}
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