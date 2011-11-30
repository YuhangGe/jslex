$(function(){
	IM = new Alice.InputManager(10);
	IM.addInput([0],[1,2]);
	IM.output();
	IM.addInput([0,1]);
	IM.output();
});
