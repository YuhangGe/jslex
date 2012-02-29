(function(window) {
	var str_to_array = function(str, arr) {
		var t = str.charCodeAt(0),len=str.length,c=0;
		for(var i=1;i<len;i++){
			if(t===0)
				arr[i-1] = str.charCodeAt(i) - 1;
			else{
				var n = str.charCodeAt(i) - 1 ,v = str.charCodeAt(i+1) -1;
				for(var j=0;j<n;j++){
					arr[c]= v;
					c++;
				}
				i++;
			}
		}
	}
	var table_base = new Int32Array(6), table_base_str = "\0\1\1\2\4\6\10";
	str_to_array(table_base_str, table_base);

	var table_default = new Int32Array(6), table_default_str = "\0\0\1\2\2\2\2";
	str_to_array(table_default_str, table_default);

	var table_next = new Int32Array(10), table_next_str = "\0\0\0\2\1\5\3\5\2\4\2";
	str_to_array(table_next_str,table_next);

	var table_check = new Int32Array(10), table_check_str = "\0\0\0\1\3\4\4\5\5\6\6";
	str_to_array(table_check_str,table_check);

	var table_eqc = new Int16Array(256), table_eqc_str = "\1\x61\0\1\1\1\2\x9d\0";
	str_to_array(table_eqc_str, table_eqc);

	var table_action = new Int16Array(6), table_accept_str = "";
	str_to_array(table_accept_str,table_accept);
	
	
	
	var NO_ACTION = -1, UNKNOWN_CHAR = -2,UNMATCH_CHAR = -3,FINISH_NOT_MATCH=-4;
	
	var Daisy = function() {
		this.src = null;
		this.end = 0;
		this.idx = 0;
		this.chr = -1;
		//初始状态，init_state，恒为状态表中的第一个起始状态。
		this.i_s = -1//Daisy.StartState;
		
	}
	Daisy.prototype = {
		setSource : function(source) {
			this.src = source;
			this.end = this.src.length;
			this.idx = 0;
			this.chr = -1;
		},
		read_ch : function() {
			if(this.idx >= this.end) {
				return this.chr = -1;
			} else
				return this.chr = this.src.charCodeAt(this.idx++);
		},
		do_lex : function() {
			var go_on = true;

			while(go_on) {
				var yylen = 0,yytxt="";
				var state = this.i_s,action = NO_ACTION;
				var pre_idx = this.idx,
					pre_action = NO_ACTION,pre_act_len = 0;
				
				while(true) {
					if(this.read_ch() < 0) {
						if(pre_action >= 0) {
							action = pre_action;
							yylen = pre_act_len;
							this.idx = pre_idx+pre_act_len;
						}else if(pre_idx<this.end){
							action = UNMATCH_CHAR;
							this.idx = pre_idx + 1;
						}
						if(pre_idx>=this.end){
							go_on = false;
						}
						break;
					}else{
						yylen++;
					}
					var eqc = table_eqc[this.chr];
					if(eqc === undefined) {
						action = UNKNOW_CHAR;
						break;
					}
					var offset, next = -1, s = state;

					while(s >= 0) {
						offset = table_base[s] + eqc;
						if(table_check[offset] === s) {
							next = table_next[offset];
							break;
						} else {
							s = table_default[s];
						}
					}

					if(next < 0) {
						if(pre_action >= 0) {
							action = pre_action;
							yylen = pre_act_len;
							this.idx = pre_idx + pre_act_len;
						}else{
							action = UNMATCH_CHAR;
							this.idx = pre_idx + 1;
						}
						//跳出内层while，执行对应的action动作
						break;
					} else {
						state = next;
						action = table_action[next];
						if(action >= 0) {
							/**
							 * 如果action>=0，说明该状态为accept状态。
							 */
							pre_action = action;
							pre_act_len = yylen;
						}
					}
				}
				yytxt = this.src.substr(pre_idx,yylen);
				switch(action) {
					case UNKNOW_CHAR:
						$.dprint("unknow char");
						break;
					case UNMATCH_CHAR:
						$.dprint("unmath char");
						break;
					case 0:
						$.dprint("got %s. len: %d", yytxt, yylen);
						break;
					default :
						// do nothing...
						break;
				}
			}
		},
		lex : function(source) {
			if(source)
				this.setSource(source);
			this.do_lex();
		}
	}

	window.JSLexer = new Daisy();
})(window);
