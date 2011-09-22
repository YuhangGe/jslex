/**
 * @author	YuhangGe
 * @email	abraham1@163.com
 * @address	software institute, nanjing university
 * @blog	http://yuhanghome.net
 */

/**
 * common.js
 * 公共模块，包括各种辅助函数，辅助类
 */
if(typeof Alice ==='undefined')
	Alice={};
/**
 * 辅助函数，判断元素elem是否在数组arr中。
 * 如果元素是NFAState或DFAState类，调用类的equals函数
 */
Alice._inArray=function(arr,elem){
	var a_t=(elem instanceof Alice.NFAState || elem instanceof Alice.DFAState);
	for(var i=0;i<arr.length;i++)
		if(a_t===true){
			if(arr[i].equals(elem))
				return true;
		}else{
			if(arr[i]==elem)
				return true;
		}
	return false;
}
/**
 * 比较两个集合是否一样，因为保证了是集合，所以算法相对简单。
 * 元素个数相同且第一个集合中每个元素都在第二个集合中就行了。
 */
Alice._setEqual=function(set1,set2){
	if(set1.length!==set2.length)
		return false;
	for(var i=0;i<set1.length;i++){
		if(!Alice._inArray(set2,set1[i]))
			return false;
	}
	return true;
}

/**
 * 得到实际串的不重复循环，主要用在生成DFA状态时状态的名称。
 * a,b,c,...,z,aa,bb,cc,...,zz,aaa,....
 */
Alice._n = {
	i : -1,
	names : "abcdefghigklmnopqrstuvwxyz".split(''),
	get : function() {
		this.i++;
		var len = this.names.length;
		var a = this.i % len;
		var b = Math.floor(this.i / len) + 1;
		var rtn = "";
		for(var j = 0; j < b; j++)
		rtn += this.names[a];
		return rtn;
	}
}
