/**
 * jQuery面向对象插件，通过$.inherit(inheritObject, baseObject)函数绑定继承关系。
 * @author  Abraham
 * @email   Abraham1@163.com
 * @blog    http://www.yuhanghome.net
 * @address Software Institute, Nanjing University
 */
/**********************************example********************************
function Person(name,age){
	this.Name=name;
	this.Age=age;
}
Person.prototype.sayHi=function(msg){
	alert("Hi everyone! My name is "+this.Name+", I'm "+this.Age+" years old.\n"+msg);
}

function Student(name,age,school){
	this.base(name,age);
	this.School=school;
}
Student.prototype.sayHi=function(msg){
	this.callBase('sayHi',msg);
	alert("I'm a student of "+this.School);
}
$.inherit(Student,Person);

window.onload=function(){
	var xiaoming=new Student("MingXiao",20,"Nanjing University");
	xiaoming.sayHi("I'm happy to see everyone!");
}
************************************************************************************/
(function($){
	$.extend({
		/**
		 * 绑定继承关系，使用了javascript闭包性质，使得baseType可以使用
		 * @param {Object} inheritObject 继承类
		 * @param {Object} baseObject 父类
		 *
		 */
		inherit:function(inheritObject, baseObject){
			//首先把父类的prototype中的函数继承到子类中
			for (var pFunc in baseObject.prototype) {
				var sp = inheritObject.prototype[pFunc];
				//如果子类中没有这个函数，添加
				if (typeof sp === 'undefined') {
					inheritObject.prototype[pFunc] = baseObject.prototype[pFunc];
				}
				//如果子类已经有这个函数，则忽略。以后可使用下面的callBase函数调用父类的方法
				
			}
			
			/**
			 * 执行父类构造函数，相当于java中的this.super()
			 * 不使用super是因为super是ECMAScript保留关键字.
			 * @param {arguments} args 参数，可以不提供
			 */
			inheritObject.prototype.base = function(args){
				if(typeof args==="undefined" || args==null){
					baseObject.call(this);
				}else if (args instanceof Array === true ) {
					baseObject.apply(this, args);
				}else{
					var _args=new Array();
					for(var i=0;i<arguments.length;i++)
						_args.push(arguments[i]);
					baseObject.apply(this,_args);
				}
			}
			/**
			 * 给继承的子类添加调用父函数的方法
			 * @param {string} method 父类的函数的名称
			 * @param {arguments} args 参数，可以不提供
			 */
			inheritObject.prototype.callBase = function( method, args){
				var med = baseObject.prototype[method];
				if (typeof med === 'function') {
					if(typeof args==="undefined" || args==null){
						med.call(this);
					}else if (args instanceof Array === true) {
						med.apply(this,args);
					}else {
						var _args=new Array();
						//从位置1开始，因为第0位参数是method的名称
						for(var i=1;i<arguments.length;i++){
							_args.push(arguments[i]);
						}
						med.apply(this, _args);
					}
				}else{
					throw "There is no method:"+method+" in baseObject";
				}
			}
		}
	});
})(jQuery);





