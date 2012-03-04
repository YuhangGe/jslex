/**
 * 将lex规则转换成dfa
 * 注意标志符目前暂时不支持数字。即可以 
 * NUM \d+ 但不能  NUM_1 \d+
 * 同时，如果由已经定义的规则再组合规则，则需要用{}引用。
 * 比如  
 * FLOAT {NUM}\.{NUM}
 * 但是如果是 FLOAT NUM\.NUM则是把NUM当作直接的字符串。
 */
if(typeof Alice ==='undefined')
	Alice={};

Alice.Lex={};

Alice.Lex.Parser= {
	src : null,
	idx : 0,
	cur_t : null,
	define : {},
	define_used : {},
	rule : {"DEFAULT":[]},
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
				//$.dprint(this.cur_t);
			this._d_line();
			//$.aprint(Alice.CharTable.char_table);
			//$.aprint(Alice.CharTable.eq_class);
			this.read_word();
		}
		this.read_word();
	}
	P._d_line = function(){
		var lbl = this.cur_t;
		var exp = this.read_word();
		
		var r = Alice.Regular.Str2Nfa.parse(exp);
		r.finish.isAccept=false;
		//$.dprint(lbl);
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
		var lbl = this.cur_t,state="DEFAULT";
		if(this.cur_t==="<"){
			state = this.read_word();
			if(state==="Daisy"){
				throw "不能使用Daisy作为状态标识。"
			}
			//$.dprint(state);
			this.idx--;

			if(this.read_word()!==">")
				throw "error! state must be closed by '>'."
			lbl = this.read_word();
		}
		//$.dprint("state: %s, lbl: %s",state,lbl);
		var expNfa = this.define[lbl];
		if(expNfa == null)
			throw "没有定义的标识@_r_line 0:"+lbl;
		if(this.define_used[lbl]===true){
			/**
			 * 如果在define块定义的标识已经被某个状态集使用过，则必须使用它的拷贝来生成一个rule
			 */
			expNfa = expNfa.copy();
		}else{
			this.define_used[lbl]=true;
		}
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
		
		if(this.rule[state]==null){
			this.rule[state]=[];
		}
		this.rule[state].push(expNfa);
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
		if(c==="<" || c===">")
			return this.cur_t = c;
		
		var w="";
		var quote=null;
		if(c==='[')
			quote = ']';
		while(c!==null){
			if(quote===null && (this.isSpace(c)||c===">"))
				break;
			w+=c;
			 
			if(c==="\\"){
				c=this.read_ch();
				if(c!==null)
					w+=c
			}else if(c==='\"' || c==='\''){
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
		
		
		
		var dfa_arr=[],default_dfa=null,states={};
		//$.dprint(lexNFA);
		for(var s in this.rule){
			var rs = this.rule[s];
			var lexNFA = new Alice.NFA();
			var lexStart = new Alice.NFAState();
			lexNFA.start=lexStart;
			lexNFA.addState(lexStart);
			for(var i=0;i<rs.length;i++){
				var nfaExp = rs[i];
				lexStart.addMove(Alice.e,nfaExp.start);
				lexNFA.addState(nfaExp.states);
			}
			//$.dprint(lexNFA);
			var dfa = Alice.Nfa2Dfa.parse(lexNFA);
			//$.dprint(dfa);
			var m_dfa = Alice.DfaMinimize.parse(dfa);
			//$.dprint(m_dfa);
			m_dfa.state_name = s;
			dfa_arr.push(m_dfa);
			if(s==="DEFAULT")
				default_dfa = m_dfa;
			
		}
		//$.dprint(dfa_arr);
		
		var dfa_obj = {
			dfa_array : dfa_arr,
			default_dfa : default_dfa,
		}
		
		Alice.Dfa2Table_2.parse(dfa_obj);
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
			dfa_obj : dfa_obj,
			code : this.routine
		}
		
		
	}
	P.isSpace = function(chr){
		return chr===' '||chr==='\n' || chr==='\t' ||chr ==='\r';
	}
})();


