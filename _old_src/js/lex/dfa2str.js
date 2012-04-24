if(typeof Alice ==='undefined')
	Alice={};

if(typeof Alice.Lex === 'undefined')
	Alice.Lex={};

Alice.Lex.Dfa2Str={
	
	table: [],
	func_str : "",
	func_id : 0,
	func_hash : {},
	appendFunc:function(func){
		this.func_str +="function(len, txt) {\n"+func+"\n},\n";
		return this.func_id ++;
	},
	append:function(value){
		this.table.push(value.toString());
		return this;
	},
	init : function(){
		this.table.length = 0;
		this.func_str = "";
		this.func_id = 0;
		this.func_hash = {};
	},
	parse:function(dfa){
		
		var len = dfa.states.length;
		
		if(len===0)
			return "";
		
		this.init();
		
		this.append("for(var i = 0; i < ").append(len).append("; i++)\n	S.push(new Daisy.State(false));\n");
		for(var i=0;i<len;i++){
			this.parseState(dfa.states[i]);
		}
		
		this.append("Daisy.StartState = S["+dfa.startIndex+"];\n");
		
		return {
			'table': "(function() {\nvar S = Daisy.S;\nvar F = Daisy.F;\n"+this.table.join("")+"\n})();\n",
			'func' : "Daisy.F = [\n"+this.func_str+"\n];\n"
		};
		
	},
	parseState:function(s){
		var s_id = "S["+s.id+"]";
		if(s.isAccept===true){
			this.append(s_id+".accept = true;\n");
			var fid = this.func_hash[s.action.id];
			if(!fid){
				fid = this.appendFunc(s.action.func);
				this.func_hash[s.action.id] = fid;
			}
			this.append(s_id+".action = F["+fid+"];\n");
		}
		
		if(s.input.length!==s.next.length)
			throw "dfa 状态的input 和next不对应，这个不应该出现。请联系开发人员";
			
		if(s.input.length<=0)
			return;
			
		var next_id = [];
		for(var i=0;i<s.next.length;i++){
			next_id.push("S["+s.next[i].id+"]");
		}
		this.append(s_id+".input.push("+s.input.join(",")+");\n");
		this.append(s_id+".next.push("+next_id.join(",")+");\n");
		
	}
}
