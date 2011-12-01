$(function(){
	IM = new Alice.InputManager(256);
	IM.addInput("abcefg");
	//IM.addInput([99,101,104]);
	$.dprint(IM.toString());
});
