if(typeof Alice ==='undefined')
	Alice={};

Alice.Lex={};

Alice.Lex.Parser= {
	src : null,
	idx : 0,
	cur_t : null,
	define : {},
	rule : [],
	routine : ""
};

(function(){
	var L = Alice.Lex;
	var T = Alice.Lex.Tag;
	var T = Alice.Lex.Token;
	var P = Alice.Lex.Parser;
	
	
	P._define=function(){
		if(this.cur_t==='${'){
			
			this.read_word();
		}
		
		while(this.cur_t !== '$$' && this.cur_t !=null){
			this._d_line();
			this.read_word();
		}
		this.read_word();
	}
	P._d_line = function(){
		var lbl = this.cur_t;
		var exp = this.read_word();
		var r = Alice.Regular.Str2Nfa.parse(exp);
		r.finish.isAccept=false;
		this.define[lbl]=r;
	}
	P._rule=function(){
		while(this.cur_t !== '$$' && this.cur_t !=null){
			this._r_line();	
			this.read_word();
		}
		this._routine();
	}
	P._r_line = function(){
		var lbl=this.cur_t;
		var expNfa = this.define[lbl];
		if(expNfa == null)
			throw "_r_line 0:"+lbl;
		
		var func_str="";
		var c = this.read_ch();
		var until = '\n';
		while(c!==null && this.isSpace(c) && c!==until)
			c = this.read_ch();
		if(c==='{'){
			until = '}';
			c = this.read_ch();
		}
		while(c!==null && c!==until){
			func_str+=c;
			c = this.read_ch();
		}
		//this.read_ch();
		
		expNfa.finish.isAccept = true;
		expNfa.finish.action = new Alice.Action(func_str);
		this.rule.push(lbl);
	}
	P._routine=function(){
		this.routine.length=0;
		var c = this.read_ch();
		while(c!==null){
			this.routine+=c;
			c = this.read_ch();
		}
	}
	P.read_ch = function(){
		if(this.idx === this.len) {
			return null;
		} else {
			return this.src[this.idx++];
		}
	}
	P.back_ch = function(){
		if(this.idx>0)
			this.idx--;
	}
	P.read_word = function(){
		var c = this.read_ch();
		while(c!==null && this.isSpace(c))
			c = this.read_ch();
		
		var w="";
		var quote=null;
		if(c==='[')
			quote = ']';
		while(c!==null){
			if(quote===null && this.isSpace(c))
				break;
			w+=c;
			if(c==='\"' || c==='\''){
				if(quote===c)
					quote=null;
				else if(quote===null)
					quote=c;
			}else if(c==='[' && quote === null){
				quote = ']';
			}else if(c===']' && quote !== null){
				quote = null;
			}
			c=this.read_ch();
		}
		//$.dprint("w:"+w);
		if(w.length===0)
			this.cur_t = null;
		else
			this.cur_t = w;
		return this.cur_t;
	}
	P.parse=function(source){
		//init
		this.src = source;
		this.idx = 0;
		this.len = source.length;
		//begin parse
		this.read_word();
		this._define();
		this._rule();
		this._routine();
		
		
		var lexNFA = new Alice.NFA();
		var lexStart = new Alice.NFAState();
		lexNFA.start=lexStart;
		lexNFA.addState(lexStart);
		
		for(var i=0;i<this.rule.length;i++){
			var nfaExp = this.define[this.rule[i]];
			lexStart.addMove(Alice.e,nfaExp.start);
			lexNFA.addState(nfaExp.states);
		}
		//$.dprint(lexNFA);
		var dfa = Alice.Nfa2Dfa.parse(lexNFA);
		//$.dprint(dfa);
		var m_dfa = Alice.DfaMinimize.parse(dfa);
		//$.dprint(m_dfa);
		Alice.Dfa2Table_2.parse(m_dfa);
		/*$.aprint(m_dfa.table_base);
		$.dprint(Alice.Help.array_to_str(m_dfa.table_base));
		$.aprint(m_dfa.table_default);
		$.dprint(Alice.Help.array_to_str(m_dfa.table_default));
		$.aprint(m_dfa.table_check);
		$.dprint(Alice.Help.array_to_str(m_dfa.table_check));
		$.aprint(m_dfa.table_next);
		$.dprint(Alice.Help.array_to_str(m_dfa.table_next));
		$.aprint(m_dfa.table_action);
		$.dprint(Alice.Help.array_to_str(m_dfa.table_action));
		$.dprint(Alice.Help.array_to_str(Alice.CharTable.char_table));
		*/
		return {
			dfa : m_dfa,
			code : this.routine
		}
		
		
	}
	P.isSpace = function(chr){
		return chr===' '||chr==='\n' || chr==='\t' ||chr ==='\r';
	}
})();


