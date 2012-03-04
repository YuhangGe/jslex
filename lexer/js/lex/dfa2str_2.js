if( typeof Alice === 'undefined')
	Alice = {};

if( typeof Alice.Lex === 'undefined')
	Alice.Lex = {};

Alice.Lex.Dfa2Str_2 = {
	template : {},
	output : "",
	act_hash : {},
	lex_name : "JSLexer",
	parse : function(dfa_obj, template) {
		if(template === "editor") {
			if(this.template.editor == null)
				this.template.editor = jQuery.ajax("js/template/editor_tpl.txt", {
					async : false
				}).responseText;
			this.output = this.template.editor;
			this.lex_name = "JS";
		} else {
			if(this.template.lex == null)
				this.template.lex = jQuery.ajax("js/template/lex_tpl.txt", {
					async : false
				}).responseText;
			this.output = this.template.lex
		}

		
		var H = Alice.Help;
		this.output = this.output
			.replace(/\$\$_BASE_LEN_\$\$/g,dfa_obj.table_base.length)
			.replace(/\$\$_BASE_STR_\$\$/g,H.arr_to_str(dfa_obj.table_base))
			.replace(/\$\$_DEFAULT_LEN_\$\$/g,dfa_obj.table_default.length)
			.replace(/\$\$_DEFAULT_STR_\$\$/g,H.arr_to_str(dfa_obj.table_default))
			.replace(/\$\$_CHECK_LEN_\$\$/g,dfa_obj.table_check.length)
			.replace(/\$\$_CHECK_STR_\$\$/g,H.arr_to_str(dfa_obj.table_check))
			.replace(/\$\$_NEXT_LEN_\$\$/g,dfa_obj.table_next.length)
			.replace(/\$\$_NEXT_STR_\$\$/g,H.arr_to_str(dfa_obj.table_next))
			.replace(/\$\$_ACTION_LEN_\$\$/g,dfa_obj.table_action.length)
			.replace(/\$\$_ACTION_STR_\$\$/g,H.arr_to_str(dfa_obj.table_action))
			.replace(/\$\$_EQC_LEN_\$\$/g,dfa_obj.table_eqc.length)
			.replace(/\$\$_EQC_STR_\$\$/g,H.arr_to_str(dfa_obj.table_eqc))
			.replace(/\$\$_INIT_STATE_\$\$/g,dfa_obj.table_init_state)
			.replace(/\$\$_LEX_STATES_\$\$/g,this.parseState(dfa_obj))
			.replace("$$_ACTION_TABLE_$$",this.parseTable(dfa_obj))
			.replace(/\$\$_LEX_NAME_\$\$/g, this.lex_name);
		
		
		return this.output;

	},
	parseState : function(dfa_obj){
		var s_str = "", i = 0;
		for(var j = 0; j < dfa_obj.dfa_array.length; j++) {
			var dfa = dfa_obj.dfa_array[j];
			s_str += dfa.state_name+" = "+dfa.start.id;
			if(j!==dfa_obj.dfa_array.length-1)
				s_str+=", ";
		}
		return s_str;
	},
	parseTable : function(dfa_obj) {
		var table_str = "";
		for(var j = 0; j < dfa_obj.dfa_array.length; j++) {
			var dfa = dfa_obj.dfa_array[j];
			for(var i = 0; i < dfa.states.length; i++) {
				var s = dfa.states[i];
				if(s.isAccept) {
					if(this.act_hash[s.action.id] == null) {
						table_str += "case " + s.action.id + ":\n" + s.action.func + "\nbreak;\n"
						this.act_hash[s.action.id] = "";
					}
				}
			}
		}

		return table_str;
	}
}