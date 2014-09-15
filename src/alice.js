if(typeof require === 'undefined') {
    //定义一个require的空函数，用来兼容浏览器端代码。这样不需要写两套代码。
    require = function() {
        //do nothing.
    }
}
/**
 * alice.js
 * 全局命名空间入口，定义了项目的命名空间和子命名空间。
 * 公共模块，包括各种辅助函数，辅助类
 */
JSLex = {
	__lex__ : null,
    __BASE_PATH__ : '',
    setTemplate : function(tpl) {
        Alice.Dfa.Dfa2Src.template = tpl;
    },
	parse : function(lex_src){
		this.__lex__ = Alice.Core.Lexer.parse(lex_src);
		return Alice.Dfa.Dfa2Src.parse(this.__lex__.dfa_obj, this.__lex__.routine);
	},
	Core : {
		/**
		 * Core 命名空间，包括核心逻辑的实现处理 
		 */
	},
	Nfa : {
		/*
		 * Nfa 命名空间，包括nfa相关类的定义，正则字符串到nfa的算法，nfa到dfa的算法，
		 */
	},
	Dfa : {
		/*
		 * Dfa 命名空间，包括dfa相关的类的定义，dfa的压缩算法
		 */
	},
	Table : {
		/**
		 * TableSpace 命名空间，包括输入符等价类划分，dfa转换成线性表（default,check,base,next）
		 */
	},
	Utility : {
        log : function(msg) {
            console.log(msg);
        },
		/**
		 *  UtilitySpace 命名空间，包括常用函数
		 */
		extend : function(src, ext) {
			for(var f in ext) {
				if(src[f] == null)
					src[f] = ext[f];
				else
					throw "extend error!"
			}
		},
        err : function() {
            if(arguments.length>0) {
                console.log.call(console, arguments);
            }
            console.trace();
            throw "err!";
        }
		
	}
};


