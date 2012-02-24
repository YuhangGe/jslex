(function(window) {
	var str_to_array = function(str, arr) {
		var t = str.charCodeAt(0), len = str.length, c = 0;
		for(var i = 1; i < len; i++) {
			if(t === 0)
				arr[i - 1] = str.charCodeAt(i);
			else {
				var n = str.charCodeAt(i), v = str.charCodeAt(i + 1);
				for(var j = 0; j < n; j++) {
					arr[c] = v;
					c++;
				}
				i++;
			}
		}
	}
	var table_base = new Int32Array(3), table_base_str = "\2\0\1\3";
	str_to_array(table_base_str, table_base);

	var table_default = new Int32Array(3), table_default_str = "";
	str_to_array(table_default_str, table_default);

	var table_next = new Int32Array(5), table_next_str = "";
	str_to_array();

	var table_check = new Int32Array(5), table_check_str = "";
	str_to_array();

	var table_eqc = new Int16Array(256), table_eqc_str = "";
	str_to_array(table_eqc_str, table_eqc);
	
	var table_accept = new Int16Array(), table_accept_str = "";
	str_to_array();

	var Daisy = function() {
		this.src = null;
		this.end = 0;
		this.idx = 0;
		this.chr = -1;
		//初始状态，init_state，恒为状态表中的第一个起始状态。
		this.i_s = -1//Daisy.StartState;
		//当前状态，current_state
		this.c_s = this.i_s;
		/*
		 * 下一个状态，next_state. 如果当前状态，this.c_s，是可接受的，
		 * 则查看是否有下一个状态。
		 */
		this.n_s = -1;
		//记录上一次可接受状态。last_state
		this.l_s = [0, 0, "", false];

		this.token = [];
		this.r = undefined;
	}
	Daisy.prototype = {
		setSource : function(source) {
			this.src = source;
			this.end = this.src.length;
			this.idx = 0;
			this.c_s = this.i_s;
			this.n_s = null;
			this.l_s[3] = false;
			this.token.length = 0;
			this.r = undefined;
		},
		init_s : function() {
			this.c_s = this.i_s;
			this.token.length = 0;
			this.l_s[3] = false;
		},
		read_ch : function() {
			if(this.idx >= this.end) {
				this.idx++;
				return this.chr = -1;
			} else
				return this.chr = this.src.charCodeAt(this.idx++);
		},
		back_ch : function() {
			this.idx--;
		},
		scan : function() {
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
					} else if(this.read_ch() >= 0) {
						//$.dprint("not match at %d, len: %d, txt:%s. skip.", this.idx - 1, this.len, this.txt);
						this.back_ch();
						this.init_s();
						continue;
					} else {
						eof = true;
						//$.dprint("finish not match at %d, len:%d, txt: %s", this.idx - 1, this.len, this.txt);
						break;
					}

				}
				if(this.c_s.accept) {
					if(this.n_s = this.c_s.move(this.read_ch())) {
						this.l_s = [this.idx - this.token.length - 1, this.token.length, String.fromCharCode.apply(this, this.token), this.c_s];
					} else {
						this.r = this.c_s.action(this.token.length, String.fromCharCode.apply(this, this.token));
						this.init_s();
						this.back_ch();
						break;
					}
				}
			}
			if(eof)
				throw 0;
			return this.r;
		},
		lex : function(source) {
			if(source)
				this.setSource(source);
			if( typeof Daisy.Init === 'function')
				Daisy.Init();

			if( typeof Daisy.Wrap === 'function')
				Daisy.Wrap();
		}
	}
	
	window.JSLexer = new Daisy();
})(window);
