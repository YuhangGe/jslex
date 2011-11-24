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
		this.func_str +="function(len, val) {\n"+func+"\n},\n";
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
		
		
		return {
			'table': "(function() {\nvar S = Daisy.S;\nvar F = Daisy.F;\n"+this.table.join("")+"\n})();\n",
			'func' : "Daisy.F = [\n"+this.func_str+"\n];\n"
		};
		
	},
	parseState:function(s){
		var s_id = "S["+s.id+"]";
		if(s.isAccept===true && s.nfaset.length>0 ){
			this.append(s_id+".accept = true;\n");
			//查找dfa状态关联的nfa状态中，最先声明的action
			var min_fid = 99999;
			var min_i = -1;
			for(var i=0;i<s.nfaset.length;i++){
				if(s.nfaset[i].isAccept && min_fid>s.nfaset[i].action.id){
					min_fid= s.nfaset[i].action.id;
					min_i = i;
				}
					
			}
			var fid = this.func_hash[min_fid];
			if(!fid){
				fid = this.appendFunc(s.nfaset[min_i].action.func);
				this.func_hash[min_fid] = fid;
			}
				 
			this.append(s_id+".action = F["+fid+"];\n");
		}
		
		var dir = s.moves.directed;
		var dir_str = "";
		for(var d in dir) {
			var _d = Alice.Help._d[d]?Alice.Help._d[d]:d;
			dir_str += "'"+ _d + "' : S["+dir[d].id + "],\n";
		}
		if(dir_str.length!==0)
			this.append(s_id+".dir = {\n"+dir_str+"}\n");
		
		var def = s.moves.defined;
		var defN = s.moves.definedNext;
		var dl = def.length;
		if(dl > 0){
			$.dprint(def);
			var defN_str="";
			this.append(s_id+".def = ["+def.join(",")+"];\n");
			for(var i=0;i<dl;i++)
				defN_str += "S["+defN[i].id+"], ";
			this.append(s_id+".defN = [" + defN_str +"];\n");
		}
		 
		// var ept = s.moves.excepted;
		// var ept_str = "", ept_next_str = "";
		// for(var i = 0; i < ept.length; i++) {
		 	// ept_str += ept[i] +","
		// }
	
	}
}
