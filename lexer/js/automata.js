if(typeof Alice ==='undefined')
	Alice={};

Alice.AutoMata=function(dfa){
	this.dfa=dfa;
	this.str=null;
	this.idx=0;
	this.cur_ch=null;
	this.len=0;
}
Alice.AutoMata.prototype.check=function(str){
	this.str=str;
	this.len=str.length;
	this.idx=0;
	var state=this.dfa.start;
	var n_state=[];

	while(true){
		this.read_ch();
		if(this.cur_ch===null)
			break;
		n_state=state.getMove(this.cur_ch);
		if(n_state.length===0){
			$.dprint("not found next state!")
			return false;
		}
		else if(n_state.length!==1)
			throw "dfa has more than one out! please check!";
		else{
			state=n_state[0];
			if(state.isAccept===true)
				return true;
		}
		
	
	}
	console.log("not match");
	return false;
}
Alice.AutoMata.prototype.read_ch=function(){
	if(this.idx===this.len)
		this.cur_ch= null;
	else{
		this.cur_ch=this.str[this.idx];
		this.idx++;
	}
	return this.cur_ch;
}
