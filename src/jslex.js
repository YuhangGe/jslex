var Lexer = require('./core/lexer.js');
var Dfa2Src = require('./dfa/dfa2src/js');

module.exports = {
  parse : function(lex_src, template) {
      Dfa2Src.template = template;
      var lex = Lexer.parse(lex_src);
      return Dfa2Src.parse(lex.dfa_obj, lex.routine);
  }
};







