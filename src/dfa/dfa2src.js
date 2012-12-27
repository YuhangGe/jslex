(function(A, C, N, D, T, U) {
	/**
	 * @author	Yuhang Ge
	 * @email	abraham1@163.com
	 * @address	software institute, nanjing university
	 * @blog	http://xiaoge.me
	 */

	/**
	 * 将经过nfa转换，压缩最后生成的dfa输出为js源代码。
	 * 输出时会使用模板生成相应格式的源代码。
	 *
	 */
	D.Dfa2Src = {
		template : "lex",
		template_hash : {},
		act_hash : {},
		lex_name : "JSLexer",
        lex_arguments : {},
		case_ignore : false,
		getTemplate : function(){
			if(Alice.__RUNTIME__ && Alice.__RUNTIME__==='node'){
				var tn = "node_"+this.template;
				if(this.template_hash[tn]==null){
					var fs = require("fs");
					this.template_hash[tn] = fs.readFileSync("../src/template/"+tn+"_tpl.txt",'utf8');
				}
				return this.template_hash[tn];
			}else{
				var tn = this.template;
				if(this.template_hash[tn]==null){
					this.template_hash[tn] = jQuery.ajax("../src/template/"+tn+"_tpl.txt?r=" + Math.random(), {
						async : false
					}).responseText;
				}
				return this.template_hash[tn];
			}
		},
		parse : function(dfa_obj, routine) {
		
			var output = this.getTemplate();
			
			output = output.replace(/\$\$_BASE_LEN_\$\$/g, dfa_obj.table_base.length)
				.replace(/\$\$_BASE_STR_\$\$/g, U.arr_to_str(dfa_obj.table_base))
				.replace(/\$\$_DEFAULT_LEN_\$\$/g, dfa_obj.table_default.length)
				.replace(/\$\$_DEFAULT_STR_\$\$/g, U.arr_to_str(dfa_obj.table_default))
				.replace(/\$\$_CHECK_LEN_\$\$/g, dfa_obj.table_check.length)
				.replace(/\$\$_CHECK_STR_\$\$/g, U.arr_to_str(dfa_obj.table_check))
				.replace(/\$\$_NEXT_LEN_\$\$/g, dfa_obj.table_next.length)
				.replace(/\$\$_NEXT_STR_\$\$/g, U.arr_to_str(dfa_obj.table_next))
				.replace(/\$\$_ACTION_LEN_\$\$/g, dfa_obj.table_action.length)
				.replace(/\$\$_ACTION_STR_\$\$/g, U.arr_to_str(dfa_obj.table_action))
				.replace(/\$\$_EQC_LEN_\$\$/g, dfa_obj.table_eqc.length)
				.replace(/\$\$_EQC_STR_\$\$/g, U.arr_to_str(dfa_obj.table_eqc))
				.replace(/\$\$_INIT_STATE_\$\$/g, dfa_obj.table_init_state)
				.replace(/\$\$_LEX_STATES_\$\$/g, this.parseState(dfa_obj))
				.replace("$$_ACTION_TABLE_$$", this.parseTable(dfa_obj))
				.replace(/\$\$_LEX_NAME_\$\$/g, this.lex_name)
				.replace("$$_IGNORE_CASE_BEGIN_$$", this.case_ignore ? "" : "/*")
				.replace("$$_IGNORE_CASE_END_$$", this.case_ignore ? "" : "*/")
				.replace("##_CONSTRUCT_##", routine['construct'])
				.replace("##_START_##", routine['start'])
				.replace("##_FINISH_##", routine['finish']);
            output = output.replace(/\$\$_ARGUMENT\[(\s*[^\]]+\s*)\]_\$\$/g, function(m, c) {
                return D.Dfa2Src.lex_arguments[c];
            });
			return output;

		},
		parseState : function(dfa_obj) {
			var s_str = "", i = 0;
			for(var j = 0; j < dfa_obj.dfa_array.length; j++) {
				var dfa = dfa_obj.dfa_array[j];
				s_str += dfa.state_name + " = " + dfa.start.id;
				if(j !== dfa_obj.dfa_array.length - 1)
					s_str += ", ";
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
	};
})(Alice, Alice.Core, Alice.Nfa, Alice.Dfa, Alice.Table, Alice.Utility); 