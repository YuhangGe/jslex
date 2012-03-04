if(typeof Alice ==='undefined')
	Alice={};

if(typeof Alice.Lex === 'undefined')
	Alice.Lex={};

Alice.Lex.Dfa2Str_2={
	template: {},
	output : "",
	act_hash : {},
	lex_name : "JSLexer",
	parse:function(dfa,template){
		if(template === "editor"){
			if(this.template.editor==null)
				this.template.editor = jQuery.ajax("js/template/editor_tpl.txt",{async:false}).responseText;
			this.output = this.template.editor;
			this.lex_name = "JS";
		}
		else {
			if(this.template.lex == null)
				this.template.lex = jQuery.ajax("js/template/lex_tpl.txt",{async:false}).responseText;
			this.output = this.template.lex
		}
		
		var H = Alice.Help;
		this.output = this.output
			.replace(/\$\$_BASE_LEN_\$\$/g,dfa.table_base.length)
			.replace(/\$\$_BASE_STR_\$\$/g,H.arr_to_str(dfa.table_base))
			.replace(/\$\$_DEFAULT_LEN_\$\$/g,dfa.table_default.length)
			.replace(/\$\$_DEFAULT_STR_\$\$/g,H.arr_to_str(dfa.table_default))
			.replace(/\$\$_CHECK_LEN_\$\$/g,dfa.table_check.length)
			.replace(/\$\$_CHECK_STR_\$\$/g,H.arr_to_str(dfa.table_check))
			.replace(/\$\$_NEXT_LEN_\$\$/g,dfa.table_next.length)
			.replace(/\$\$_NEXT_STR_\$\$/g,H.arr_to_str(dfa.table_next))
			.replace(/\$\$_ACTION_LEN_\$\$/g,dfa.table_action.length)
			.replace(/\$\$_ACTION_STR_\$\$/g,H.arr_to_str(dfa.table_action))
			.replace(/\$\$_EQC_LEN_\$\$/g,dfa.table_eqc.length)
			.replace(/\$\$_EQC_STR_\$\$/g,H.arr_to_str(dfa.table_eqc))
			.replace(/\$\$_INIT_STATE_\$\$/g,dfa.table_init_state)
			.replace("$$_ACTION_TABLE_$$",this.parseTable(dfa))
			.replace(/\$\$_LEX_NAME_\$\$/g, this.lex_name);
		
		return this.output;
			
	},
	parseTable:function(dfa){
		var table_str = "";

		for(var i=0;i<dfa.states.length;i++){
			var s = dfa.states[i];
			if(s.isAccept){
				if(this.act_hash[s.action.id]==null){
					table_str += "case " + s.action.id +":\n" + s.action.func +"\nbreak;\n"
					this.act_hash[s.action.id] = "";
				}
			}
		}
		return table_str;
	}
}
