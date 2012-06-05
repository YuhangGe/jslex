(function(window) {

	var DEFAULT = 4, IFS = 3;

	var Daisy = function() {
		this.src = null;
		this.end = 0;
		this.idx = 0;
		this.chr = -1;
		//初始状态，init_state，恒为状态表中的第一个起始状态。
		this.i_s = 4;
		
		this.TABLE = {
			_base : (window.Int32Array?new Int32Array(5):new Array(5)),
			_default : (window.Int32Array?new Int32Array(5):new Array(5)),
			_check : (window.Int32Array?new Int32Array(4):new Array(4)),
			_next : (window.Int32Array?new Int32Array(4):new Array(4)),
			_action : (window.Int32Array?new Int32Array(5):new Array(5)),
			_eqc : (window.Int32Array?new Int32Array(256):new Array(256))
		};


		this._str_to_arr(["\0\1\1\1\1\2", "\1\6\0", "\0\0\4\5\5","\0\0\3\2\1", "\0\1\3\2\0\0", "\1\12\1\5\2\24\1\2\2\x49\1\2\3\x97\1"], [this.TABLE._base, this.TABLE._default, this.TABLE._check, this.TABLE._next, this.TABLE._action, this.TABLE._eqc]);
		
		
	}
	Daisy.ACT_TYPE = {
		NO_ACTION : -1,
		UNKNOW_CHAR : -2,
		UNMATCH_CHAR : -3
	}
	Daisy.prototype = {
		_str_to_arr : function(strs, arrs) {
			for(var j = 0; j < strs.length; j++) {
				var str = strs[j], arr = arrs[j], t = str.charCodeAt(0), len = str.length, c = 0;
				for(var i = 1; i < len; i++) {
					if(t === 0)
						arr[i - 1] = str.charCodeAt(i) - 1;
					else {
						var n = str.charCodeAt(i) - 1, v = str.charCodeAt(i + 1) - 1;
						for(var k = 0; k < n; k++) {
							arr[c] = v;
							c++;
						}
						i++;
					}
				}
			}
		},
		setSource : function(source) {
			this.src = source;
			this.end = this.src.length;
			this.idx = 0;
			this.chr = -1;
		},
		read_ch : function() {
			if(this.idx >= this.end)
				return this.chr = -1;
			else{
				 
				return this.chr = this.src[this.idx++].charCodeAt(0);
				/* 
				this.chr = this.src[this.idx++].charCodeAt(0);
				if(this.chr>=65&&this.chr<=90)
					this.chr += 32;
				return this.chr;
				*/ 
			}
		},
		do_lex : function() {
			var go_on = true;
			this.idx = 0;
			while(go_on) {
				var yylen = 0, yytxt = "";
				var state = this.i_s, action = Daisy.ACT_TYPE.NO_ACTION;
				var pre_idx = this.idx, pre_action = Daisy.ACT_TYPE.NO_ACTION, pre_act_len = 0;

				while(true) {
					if(this.read_ch() < 0) {
						if(pre_action >= 0) {
							action = pre_action;
							yylen = pre_act_len;
							this.idx = pre_idx + pre_act_len;
						} else if(pre_idx < this.end) {
							action = Daisy.ACT_TYPE.UNMATCH_CHAR;
							this.idx = pre_idx + 1;
						}
						if(pre_idx >= this.end) {
							go_on = false;
						}
						break;
					} else {
						yylen++;
					}
					var eqc = this.TABLE._eqc[this.chr];
					if(eqc === undefined) {
						if(pre_action >= 0) {
							action = pre_action;
							yylen = pre_act_len;
							this.idx = pre_idx + pre_act_len;
						}else
							action = Daisy.ACT_TYPE.UNKNOW_CHAR;
						break;
					}
					var offset, next = -1, s = state;

					while(s >= 0) {
						offset = this.TABLE._base[s] + eqc;
						if(this.TABLE._check[offset] === s) {
							next = this.TABLE._next[offset];
							break;
						} else {
							s = this.TABLE._default[s];
						}
					}

					if(next < 0) {
						if(pre_action >= 0) {
							action = pre_action;
							yylen = pre_act_len;
							this.idx = pre_idx + pre_act_len;
						} else {
							action = Daisy.ACT_TYPE.UNMATCH_CHAR;
							this.idx = pre_idx + 1;
						}
						//跳出内层while，执行对应的action动作
						break;
					} else {
						state = next;
						action = this.TABLE._action[next];
						if(action >= 0) {
							/**
							 * 如果action>=0，说明该状态为accept状态。
							 */
							pre_action = action;
							pre_act_len = yylen;
						}
					}
				}
				yytxt = this.src.substr(pre_idx, yylen);
				switch(action) {
					case Daisy.ACT_TYPE.UNKNOW_CHAR:
						this._log("unknow char %d(%c)",this.chr,this.chr);
						break;
					case Daisy.ACT_TYPE.UNMATCH_CHAR:
						this._log("unmath char %d(%c)",this.chr,this.chr);
						break;
						
					case 0:
this.yygoto(IFS);}
break;
case 2:
console.log("b");
break;
case 1:
console.log('hi');
break;

					
					default :
						// do nothing...
						break;
				}
			}
		},
		_log : function(msg){
			if(typeof jQuery !== 'undefined' && typeof jQuery.log !== 'undefined'){
				jQuery.log.apply(this,arguments);
			}else if(typeof console !== 'undefined')
				console.log(msg);
		},
		yygoto: function(state){
			this.i_s = state;
		},
		lex_start : function(){
			
		},
		lex_finish : function(){
			
		},
		
		lex : function(source) {
			if(source)
				this.setSource(source);
			this.i_s = 4;
			this.lex_start();
			this.do_lex();
			this.lex_finish();
		}
	}

	window.JSLexer = Daisy;
})(window);
