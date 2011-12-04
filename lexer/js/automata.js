if(typeof Alice ==='undefined')
	Alice={};

Alice.AutoMata=function(dfa){
	this.dfa=dfa;
	this.str=null;
	this.idx=0;
	this.cur_ch=null;
	this.len=0;
	this.match_end=true;
}
Alice.AutoMata.prototype.check=function(str){
	this.str=str;
	this.len=str.length;
	this.idx=0;
	var pre_state;
	var state=this.dfa.start;
	
	while(true){
		this.read_ch();
		if(this.cur_ch<0)
			break;
		//$.dprint(this.cur_ch);
		pre_state=state;
		state=state.getMove(this.cur_ch);
		if(!state){
			$.dprint("not found next state!")
			$.dprint(this.cur_ch+" -) "+pre_state);
			return false;
		}
		else{
			if(state.isAccept===true){
				//$.dprint(this.cur_ch);
				if(this.match_end===true){
					if(this.idx===this.len)
						return true;
				}
				else
					return true;
				
			}
				
		}
		
	
	}
	console.log("not match");
	return false;
}
Alice.AutoMata.prototype.read_ch=function(){
	if(this.idx===this.len)
		this.cur_ch= -1;
	else{
		this.cur_ch=this.str.charCodeAt(this.idx);
		this.idx++;
	}
	return this.cur_ch;
}
