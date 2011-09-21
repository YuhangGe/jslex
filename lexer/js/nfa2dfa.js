if(typeof Alice ==='undefined')
	Alice={};

union_set=function(set1,set2){
	var tmp=new Array();
	for(var i=0;i<set2.length;i++){
		var e=set2[i];
		if(e.Equals(Symbol.NULL))
			continue;
		var _in=false;
		for(var j=0;j<set1.length;j++){
			if(set1[j].Equals(e)){
				_in=true;
				break;
			}
		}
		if(_in===false)
			tmp.push(e);
	}
	if(tmp.length>0){
		for(var i=0;i<tmp.length;i++)
			set1.push(tmp[i]);
		return true;
	}else
		return false;
	
		
}

is_accept=false;
e_closure=function(T){
	return move(T,Alice.e,true);
}
move=function(T,input,empty){
	var stack=[];
	var e_c=[];
	is_accept=false;
	for(var i=0;i<T.length;i++){
		stack.push(T[i]);
		if(empty===true)
			e_c.push(T[i]);
		if(T[i].isAccept===true)
			is_accept=true;
	}
	while(stack.length>0){
		var t=stack.pop();
		
		var u=t.getMove(input);
		for(var i=0;i<u.length;i++){
			if(!Alice._inArray(e_c,u[i])){
				e_c.push(u[i]);
				if(empty===true)
					stack.push(u[i]);
				if(u[i].isAccept===true)
					is_accept=true;
			}
		}
	}
	return e_c;
}

dstates=[];


get_untag_state=function(){
	for(var i=0;i<dstates.length;i++)
		if(dstates[i].tag!==true)
			return dstates[i];
	return null;
}
get_exist=function(set){
	//$.dprint('get---')
	//$.dprint(set);
	for(var i=0;i<dstates.length;i++){
		//if(set.length==7)
			//$.dprint(dstates[i].nfaset);
		if(Alice._setEqual(dstates[i].nfaset,set)===true){
			//$.dprint('got');
			return dstates[i];
		}
			
	}
	return null;
}

_n={
	i:-1,
	names:"abcdefghigklmnopqrstuvwxyz".split(''),
	get:function(){
		this.i++;
		var len=this.names.length;
		var a=this.i%len;
		var b=Math.floor(this.i/len)+1;
		var rtn="";
		for(var j=0;j<b;j++)
			rtn+=this.names[a];
		return rtn;
	}
}

nfa2dfa=function(nfa){
	dstates.length=0;
	
	inputs=nfa.inputs;
	var s0=new Alice.DFAState(_n.get());
	s0.nfaset=e_closure([nfa.start]);
	s0.isAccept=is_accept;
	dstates.push(s0);
	
	var T;
	while((T=get_untag_state())!==null){
		T.tag=true;
		//$.dprint("untag:"+T.id);
		//$.dprint(T);
		for(var i=0;i<inputs.length;i++){
			//$.dprint('move');
			//$.dprint(T.nfaset);
			var tmp_m=move(T.nfaset,inputs[i]);
			if(tmp_m.length===0)
				continue;
			//$.dprint(tmp_m);
			var tmp_s=e_closure(tmp_m);
			//$.dprint("e_closure");
			//$.dprint(tmp_s);
		
			var U=get_exist(tmp_s);
			if(U===null){
				U=new Alice.DFAState(is_accept,_n.get());
				U.nfaset=tmp_s;
				//$.dprint("push "+U.id);
				//$.dprint(U.nfaset);
				dstates.push(U);
			}
			//$.dprint("add "+T.id+" "+inputs[i]+","+U.id);
			T.addMove(inputs[i],U);
		}
	}
	//console.log(dstates);
	var dfa=new Alice.DFA(dstates[0],dstates[dstates.length-1]);
	dfa.addState(dstates);
	
	return dfa;
}

