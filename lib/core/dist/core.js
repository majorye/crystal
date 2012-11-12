/**
 * @preserve Copyright (c) 2012 Alibaba Inc. All rights reserved. Proprietary and confidential.
 */
/**
*@class  ali.defineClass  
*@name   ali.defineClass
*@author   <a href="mailto:zhouquan.yezq@alibaba-inc.com">Zhouquan.yezq</a>
*@description  * Defines a new class. If there is a super class other than <code>Object</code> pass this as the first parameter,
* followed by any number of mixins or other objects to inject into the class prototype.
* <pre>
* ali.defineClass('ali.uxcore.openpf.nav',MySuperclass, ali.PubSub, MyMixin, {
*
*   property: 1,
*
*   init: function() {
*     MyClass._super.init(this, arguments);
*   },
*
*   method: function() {
*     return this.property;
*   }
*
* });
* </pre>
* or below style, this style will support add the static method or prototype method, to support the complex application scenario
 * <pre>
 * ali.defineClass('ali.uxcore.openpf.nav',MySuperclass, ali.PubSub,function(KLASS,instance){
 *     KLASS.getName=function(){
 *         KLASS.logger.log('this is the static method');
 *     };
 *     instance.getName=function(){
 *        this.logger.log('this is the instance method');
 *     };
 * });
 * </pre>
or 
 * <pre>
 * ali.defineClass('ali.uxcore.openpf.nav',function(KLASS,instance){
 *     KLASS.getName=function(){
 *         KLASS.logger.log('this is the static method');
 *     };
 *     instance.getName=function(){
 *        this.logger.log('this is the instance method');
 *     };
 * });
 * </pre>
 <ul>
  <li>1: current , just support prototype property and method inherit, static method and prototype , 
 do not inherit .
 </li>
 </ul>
 */
if (!Function.prototype.bind)
  Function.prototype.bind = (function(){
    var _slice = Array.prototype.slice;
    return function(context) {
      var fn = this,
          args = _slice.call(arguments, 1);
      if (args.length) {
        return function() {
          return arguments.length
            ? fn.apply(context, args.concat(_slice.call(arguments)))
            : fn.apply(context, args);
        }
      }
      return function() {
        return arguments.length
          ? fn.apply(context, arguments)
          : fn.call(context);
      };
    }
  })();
(function($){
  $.namespace('ali');
  //to rewrite the namespace method in the runtime, since I need get the last item object , to attach the
  // the method from the inherit , mixsin or ,,,
  var s=function (){
    var q=arguments[0],u,s=0,r,t,p,f;
    u=window;
    p=q;
    if(p.indexOf(".")){
        t=p.split(".");
        t[0]=="window"?(f=t[1]):(f=t[0]);
        for(r=(t[0]=="window")?1:0;r<t.length;r++){
            u[t[r]]=u[t[r]]||{};
            u=u[t[r]]
            if(r==t.length-1)
              return u;
        }
    }else{
        u[p]=u[p]||{}
        return u[p];
    }
  };
  ali.defineClass = function() {

    var cls = function() {
      //var args=Array.prototype.slice.call(arguments);
      if (typeof(this.__init) == "function" && arguments[0] !== undefined)
        this.__init.apply(this, arguments);
    };
    var a = arguments;
    var sup = Object;
    //current, just support single inherit
    var objfun=[],staticFun;
    for (var i = 0; i < a.length; i++) {
      if (typeof(a[i]) == "function") {
        objfun.push(a[i]);
     }
   }
      if(objfun.length>=1){
          for (var i = 0; i < objfun.length; i++) {
            if(!!objfun[i]["logger"]){
              sup = objfun[i]; //first ali class is the super class
            }else{
              staticFun=objfun[i];
            }
          }
      }
   //  // support the static method and instance method adding at one time
    if (sup != Object){//copy from  Google Closure Compiler helpers
        function t() {};
        t.prototype = sup.prototype;
        cls.prototype = new t({});
        cls.prototype.constructor = cls;
        cls._super = sup.prototype;
    }
    //use the logger property to judge it is the simple function or ali class, fix the 
    //previous issue , if no super class, static class define will not work.
    //if(objfun[objfun.length-1]  ){
      //!objfun[objfun.length-1].logger?objfun[objfun.length-1](cls,cls.prototype):'';
   // }
    (typeof staticFun=='function')?staticFun(cls,cls.prototype):'';
    //we could get the class according the class instance.
    cls.prototype.aliClass = function() { return cls; };

    for (var i = 0; i < a.length; i++) {
      if (typeof(a[i]) == "object")
        $.extend(cls.prototype, a[i]);
      else {
      }
    }
    if (typeof(a[0]) == "string") {
        var arr=a[0].split('.');
        var la=arr.splice(-1,1);
		if(s(arr.join('.'))[la]){
		  var __t=s(arr.join('.'))[la];
		   s(arr.join('.'))[la]=cls;
		   $.extend(s(arr.join('.'))[la],__t);
		}else{
		  s(arr.join('.'))[la]=cls;
		}
    }
    cls.prototype.getClassName=function(){return a[0]};
    //add a default logger for every class instance
    cls.logger=cls.prototype.logger=jQuery.Logger(a[0]);
    return cls;
  };
 })(jQuery);;/**
*@class ali.pubsub
*@name   ali.pubsub
*@author   <a href="mailto:zhouquan.yezq@alibaba-inc.com">Zhouquan.yezq</a>
*@description borrow the backbone event code , and i think the on / off /trigger is very good, since it 
* not the real event , just simulate the event. but the it more close the publish/subscribe , like 
* observer pattern , so rename it. 
<pre>Todo : 
the min pub/sub just solve the problem of the object level, for the message communication between
component and component , it should have a global message bus . like : http://developer.tibco.com/pagebus/default.jsp

how to use it?
$.extend(Object,ali.pubsub);
var o=new Object();
o.sub('datachange',function(){
   alert('datachange');
}) 
o.pub('datachange');
o.sub('datachange');
o.pub('datachange');
</pre>
*/
(function($){
    $.namespace('ali.uxcore.util');
    ali.uxcore.util.pubsub={

       /***
              *  @name ali.pubsub#sub
              * @function
              * @description Subscribes to an event published by this object.
               * @param {string} types The event types.
               * @parsm  Object} [function] call back function 
               * @param {Object} [scope] The observer context. The observer function will be called in the context of this object, if provided. 
               */
      sub: function(types, fct, scope) {
          var ev;
          types = types.split(/\s+/);
          var calls = this._fcts || (this._fcts = {});
          while (ev = types.shift()) {
            // Create an immutable fct list, allowing traversal during
            // modification.  The tail is an empty object that will always be used
            // as the next node.
            var list  = calls[ev] || (calls[ev] = {});
            var tail = list.tail || (list.tail = list.next = {});
            tail.fct = fct;
            tail.scope = scope;
            list.tail = tail.next = {};
          }
          return this;
      },
       /***
              * @name ali.pubsub#unsub
              * @function
              * @description Remove one or many fcts. If `context` is null, removes all fcts
              * with that function. If `fct` is null, removes all fcts for the
              * event. If `ev` is null, removes all bound fcts for all events.
              */
      unsub: function(events, fct, context) {
          var ev, calls, node;
          if (!events) {
            delete this._fcts;
          } else if (calls = this._fcts) {
            events = events.split(/\s+/);
            while (ev = events.shift()) {
              node = calls[ev];
              delete calls[ev];
              if (!fct || !node) continue;
              // Create a new list, omitting the indicated event/context pairs.
              while ((node = node.next) && node.next) {
                if (node.fct === fct &&
                  (!context || node.context === context)) continue;
                this.pub(ev, node.fct, node.context);
              }
            }
          }
          return this;
        },
      /***
              * @name ali.pubsub#unsub
              * @function
              *@description Trigger an event, firing all bound fcts. fcts are passed the
              *  same arguments as `trigger` is, apart from the event name.
              *Listening for `"all"` passes the true event name as the first argument.
              */
       pub: function(events) {
          var event, node, calls, tail, args, all, rest;
          if (!(calls = this._fcts)) return this;
          all = calls['all'];
          (events = events.split(/\s+/)).push(null);
          // Save references to the current heads & tails.
          while (event = events.shift()) {
            if (all) events.push({next: all.next, tail: all.tail, event: event});
            if (!(node = calls[event])) continue;
            events.push({next: node.next, tail: node.tail});
          }
          // Traverse each list, stopping when the saved tail is reached.
          rest = Array.prototype.slice.call(arguments, 1);
          while (node = events.pop()) {
            tail = node.tail;
            args = node.event ? [node.event].concat(rest) : rest;
            while ((node = node.next) !== tail) {
              node.fct.apply(node.context || this, args);
            }
          }
          return this;
        }
    }
    //short cut for ali.uxcore.util.pubsub
    ali.pubsub=ali.uxcore.util.pubsub;
 })(jQuery);;/**
*@class jQuery.getLogger
*@name   jQuery.getLogger
*@author   <a href="mailto:zhouquan.yezq@alibaba-inc.com">Zhouquan.yezq</a>
*@description jQuery.getLogger will return a logger instance, and it already solve the console
*script issue on lower browser version like IE6. and for the IE6 or other lower version, we use the log
monitor to show the log .
 <h2>How to use?<h2>
<pre>
  var mylog=jQuery.Logger('com.company.project.moduleName');
  mylog.log('this is the log');
</pre>

TODO: add setting for time stampe 
*/
(function($){
   //the log constructor
   
   var log=function(){};
   log.level=-1; //default level, show all the log,if you want to close the log, just set log level as -1
   log.cacheSize=1000;
   log.policy=[]; // the filter policy center
   
   var methods = [ "error", "warn", "info", "debug", "log","time","timeEnd"];//0-4 level 
   //log level not very clear compare with back-end  --log4j
   
   $.extend(log.prototype, {
    /***
          *  @name jQuery.getLogger#enabled
          * @function
          */
     enabled: function(lev) {
       if(lev>log.level ) {
         return false;
       }
       return true;
     },
     /***
          *  @name jQuery.getLogger#doFilter
          *  @description  if just one filter, so it means just show the log which meet the filter, and if have filter call back ,do it
          *  if have more filters, from the console, it will show all the logs to the user, but it will do every filter call back for it's condiction
          * @function
          */
	 doFilter: function() {
	   if(!(log.policy.length==1)) return true;
	   var f=log.policy[0];
	   f=f['fi'];
	   if(f.test && !f.test(arguments[0][0]) && !f.test(this.name())) {
	     return false
	   }
	   return true;
	 },
     name: function() {
       return this._name;
     },
     /***
          *  @name jQuery.getLogger#log
          * @function
          */
     log: function() {
        this._log(4, arguments);
     },
     /***
          *  @name jQuery.getLogger#debug
          * @function
          */
     debug: function() {
        this._log(3, arguments);
     },
     /***
          *  @name jQuery.getLogger#info
          * @function
          */
     info: function() {
        this._log(2, arguments);
     },
    /***
          *  @name jQuery.getLogger#warn
          * @function
          */
     warn: function() {
        this._log(1, arguments);
     },
     /***
          *  @name jQuery.getLogger#error
          * @function
          */
     error: function() {
        this._log(0, arguments);
     },
     time: function(){
        this._log(5, arguments);
     },
     timeEnd: function(){
        this._log(6, arguments);
     },
     _handler: function(level, name, msg){
        var method=methods[level];
        msg=[[method,name+" |"].join(" | ")].concat(Array.prototype.slice.call(msg));
             if(!log.logPool){
               log.logPool=[];
             }
			 if(log.logPool.length===log.cacheSize){
			    //if the cache log more than cacheSize , then remove the  previous first one.
			    log.logPool=log.logPool.slice(1);
			 }
			 if(!(outputProcessor.turnOn || (this.monitor && this.monitor.trunOn))){
			    log.logPool.push(msg.join(''));
			 }
             if( this.monitor && this.monitor.trunOn ){ //$.browser.msie   Just IE or not
               this.monitor.appendMessage(msg.join(''));
             }else if(!this.monitor){
			   outputProcessor(msg.join(''));
			 }
       if(self.console && self.console.error) {
           if(console.log.apply) {//IE8 do not work on this way. undefined
              console[method].apply(console, msg);       
           }else {
              console[console[method]?method:'log'](msg);
           }
       }
     },
	 
    _log: function(level, msg) {
      if (this.enabled(level) && this.doFilter(msg)) {
         this._handler(level,this.name(),msg);
		 var me=this;
		 log.policy.length>0?$.each(log.policy,function(index,e) {  // do every filter and execute it's callback
		   var f=e['fi'];
		   if(f && f.test &&  (f.test(msg) || f.test(me.name()))) {// if have filter action , do it
		     e['cb']? e['cb'](msg,window.location.href,( new Date() ).getTime()):'';
		   }
		 }):'';
		 
      }
    }
     
   });
   
   var logs={};//logs container
   //extend this getLoggger method as jQuery method
   $.extend({
     Logger: function(name) {
       if (!logs[name]) {
          logs[name] = new log(name);
          logs[name]._name=name;
        }
        return logs[name];
     }
    });
    $.extend($.Logger,{
	// all the Logger configuratin will set under Logger 
	 setLogLevel: function(level) {
	   log.level=level;
	 },
	/**
	 *  @param filter should be RegExp pattern
	 *  @cb this is the call back function, it will pass the log message into
	 *    the cb parameter as the first parameter. so user could do some action to process the log message , like
	 *    send the message to the back-end or others.  etc: cb(message, winodw.location.href,( new Date() ).getTime())
	 *    so user could get the enough information for log
	 */
	 setLogFilter: function(filter,cb) {
	   var fool={
	     'fi':filter
	   };
	   cb?(fool['cb']=cb):'';
	   log.policy.push(fool);
	   //cb?(log.filterAction=cb):'';
	 },
	 
	/**
	 * setting the Monitor page url. Note: we should keep the target page and monior page  under same domain.
	 */
	 setMonitorPage: function(url) {
	   log.monitor?(log.monitor.MONITOR_PAGE)=url:'';
	 },
	 
	 gc: function() { //should parent level call it
	   log=null;
	 }
	 
   });
    
	function outputProcessor(msg){
		if($('#loggingContainer20120526').length==0){
		  var tpl=["<div id='myc'><div id='loggingContainer20120526' style='display:none;clear:left;position:absolute;font-size:11px;right:0px;top:0px;width:350px;",
	      "color:#000;font-family:Monaco, Courier, monospace;z-index:1;border:2px solid #444;'>",
		  "<div id='loggingheader20120526' style='width:100%;height:25px;line-height:25px;background-color:#000;cursor:pointer;text-align:left;color:#FFF;bold-weight:bold;'>",
		  "<span style='float:left;'>Application Log Monitor</span>",
		  "<span style='float:right;cursor:pointer;color:#FFF;margin-right:5px;'><strong  id='loggingclosebtn20120526'>X</strong></span>",
		  "<span style='float:right;width:10px;height:10px;line-height:25px;background-color:yellow;margin:8px 5px;' class='bgcolor' data-bgcolor='yellow'></span>",
		  "<span style='margin:8px 5px;float:right;width:10px;height:10px;line-height:25px;background-color:#FFF;' class='bgcolor' data-bgcolor='#FFF'></span>",
		  "<span style='margin:8px 5px;float:right;width:10px;height:10px;line-height:25px;background-color:pink;' class='bgcolor' data-bgcolor='pink'></span>",
		  "<span style='margin:8px 5px;float:right;width:10px;height:10px;line-height:25px;background-color:#fcf9a4;' class='bgcolor' data-bgcolor='#fcf9a4'></span>",
		  "<span style='margin:8px 5px;float:right;width:10px;height:10px;line-height:25px;background-color:#00bf00;' class='bgcolor' data-bgcolor='#00bf00''></span>",
		  "<span style='margin:8px 5px;float:right;width:10px;height:10px;line-height:25px;background-color:#b4d3f2;' class='bgcolor' data-bgcolor='#b4d3f2''></span>",
		  "<span style='margin:8px 5px;float:right;width:10px;height:10px;line-height:25px;background-color:#bfbfbf;' class='bgcolor' data-bgcolor='#bfbfbf'></span>",
		  "</div>",
	      "<div id='logging20120526' style='position:relative;background-color:#FFF;font-size:11px;color:#000000;",
	      "text-align:left;padding: 19px 4px 2px 4px;width:340px;height:400px;overflow-y:auto;overflow-x:auto;'>",
	      "</div></div></div>"].join('');
		    $(document.body).append(tpl);
			$('#loggingheader20120526').dblclick(function(){
			   var t=$('#logging20120526');
			   t.css('display')=='block'?t.hide():t.show();
			});
			$('#loggingheader20120526').delegate('.bgcolor','click',function(){
			  $('#logging20120526').css('background-color',$(this).data('bgcolor'));
			})
			$('#loggingclosebtn20120526').click(function(){
			  $('#loggingContainer20120526').hide();
			});
		    $(document).keydown(function(e) {
			    if (e.ctrlKey && e.altKey && e.keyCode == 76) { //ctrl+alt+l
				      $('#loggingContainer20120526').show();
					  outputProcessor.turnOn=true;
				      $.use('ui-core,ui-draggable,ui-dialog', function(){
		              var d = $('#loggingContainer20120526',"#myc");
					  d.dialog( {
					        modal: false,
					        shim: true,
							draggable:{
							  handle:'#loggingheader20120526'
							},
							 css: {
						        left: e.clientX?(e.clientX +100):600,
		                        top: e.clientY? (e.clientY+100):100
						    }
							});
		             });

			    }
		    });
		}
	     $.each(log.logPool,function(index,e){
		   appendMessage(e);
		 });
		 log.logPool=[];
		 appendMessage(msg);
	};
	
	function appendMessage(strMessage){
        var logLevel=strMessage.split('|')[0];
        //var methods = [ "error", "warn", "info", "debug", "log"];
        var color="";
        switch (logLevel)
        {
          case 'error ':
            color='color:#990000;';
            break;
          case 'warn ':
            color='color:#996600;';
            break;
          case 'info ':
            color='color:#000000;';
            break;
          case 'debug ':
           color='color:#444444;';
           break;
          case 'log ':
           color='color:#888888;';
           break; 
        }
        this._hasappendedmsg = true;
		//TODO add object parse processor, right now all the thing, just treat it as text.
         $('#logging20120526').append('<pre style="'+color+' ">'+strMessage+'</pre>');
	};
   //jQuery(function($) {
   //  outputProcessor('');
   //});
})(jQuery);

;/**
*@class  ali.model
*@name ali.model
*@author   <a href="mailto:zhouquan.yezq@alibaba-inc.com">Zhouquan.yezq</a>
*@description  <p>ali.mode is the basic class for all the model,it inherit the ali.pubsub,
*              and also show up how to define the event, how to bind the class to the view<br>
*             Issue: load the model, should make sure the Dom render already, or the event could not attach correct.<p>
*/
ali.defineClass("ali.model",ali.pubsub,{

    /**
     *  @name ali.model#__init
     *  @description init method for the class, and also expose the hook method for developer: initHook
     */
    __init:function() {
	  //11/12 2012 the model should not be reuse, if want to reuse, it could use inherit way
      //this.reuseModel=true;  
      this.initialize.apply(this,arguments);
      this.initHook();
	  this.$el.data("controller",this); //cache the class instance in the jquery dom
	  this.initData();
	  this.afterRender();
      this.pub('inited');
    },
    /***
  *  @name ali.model#$el
     * @description the jQuery dom element we want the class to attach, so according the $el,
     * the class and DOM element will make the connection
     * @field
     */
    $el:null,
   /***
     *  @name ali.model#jel
     * @description same as the $el, since the webx vm could not use $, so use jel to instead of it
     * @field
     */
	jel:null, 
     /***
     *  @name ali.model#events
     * @description list all the event we want to attach ,and also target which we want attach, also the call back
     * @field
     */
    events:{
    },
    routes:{
    },
    initData: function() {
      this.logger.warn("please rewrite initData method in your class.");
    },
	afterRender: function(){
	  this.logger.warn("please rewrite afterRender method in your class.");
	},
     /***
     *  @name ali.model#initialize
     * @function
     * @description the initialize method for every class
     * @param {JSON} auxObj
     * @return NULL
     */
    initialize: function(auxObj) {
        for (var key in auxObj) {
            this[key] = auxObj[key];
        }
		this.$el?(this.jel=this.$el):'';
		this.jel?(this.$el=this.jel):'';
        this.delegateEvents();
        try{
        this._bindRoutes();
        }catch(ex){
		  
        }
    },
     /***
     *  @name ali.model#initHook
      * @function
     * @description the hook method for init, so if user want do some hook during the init, just rewrite the initHook
     *  method, and right now the initHook method will do the form element border color effect by default.
     * @return NULL
     */
    initHook: function(){},
    render: function(){},
    afterRender: function(){},
    /***
     *  @name ali.model#$
      * @function
     * @description this.$ function is the optimize method for jQuery dom element query, it do not query from the whole
     * document, just starting from  the $el element . and some time , since the this point context change, we need use
     * the bind method to bind the current context to the target function
     * @return NULL
     */
    $: function(selector) {
	  this.jel?(this.$el=this.jel):'';
      return this.$el.find(selector);
    },
	find: function(selector) {
	 this.jel?(this.$el=this.jel):'';
      return this.$el.find(selector);
	},
     /***
     * @name ali.model#delegateEvents
     * @function
     * @description this method will delegate all the event to the target element according the events JSON we defined,
     * if the selector element do not find, the event will not be delegate to the target element
     * @return NULL
     */
    delegateEvents: function() {
        // Cached regex to split keys for `delegate`.
        var eventSplitter = /^(\S+)\s*(.*)$/;
        var events = this.events;
        for (var key in events) {
            var method = events[key];
            if (!jQuery.isFunction(method)) method = this[events[key]];
            if (!method) throw new Error('Event "' + events[key] + '" does not exist');
            method = method.bind(this);
            var match = key.match(eventSplitter);
            var eventName = match[1], selector = match[2];
            //todo need think if no validate, the match of el position should be change
			this.jel?(this.$el=this.jel):'';
            this.$el.delegate(selector, eventName, method);

        }
    },
    _bindRoutes: function() {
      if (!this.routes) return;
      //this.initHistory();
      var routes = [];
      for (var route in this.routes) {
        routes.unshift([route, this.routes[route]]);
      }
      for (var i = 0, l = routes.length; i < l; i++) {
        this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
      }
    },
    initHistory: function(){
      //setup hasher
      var me=this;
      function parseHash(newHash, oldHash){
        if(me.getHashPrex && (me.getHashPrex()==newHash.split('/')[0])){
          crossroads.parse(newHash);
        }
        return;
      }
      hasher.prependHash = '!'; //default value is "/"
      hasher.initialized.add(parseHash); // parse initial hash
      hasher.changed.add(parseHash); //parse hash changes
      hasher.init(); //start listening for history change
    },
	
    route: function(route,name,callback) {
      if(!this.handlers) this.handlers=[];
      crossroads.addRoute(route,callback.bind(this));
    },
    
    getHashPrex: function(){
      return 'g';
    },
    /***
         *  @name ali.model#doV
         * @function
         * @description this is the empty for validation, the user will rewrite this method, and use the fd4 web-valid to do
         * the validation
         * @return NULL
         */
    // do validation,please rewrite it, use
    doV: function() {
    //todo
    }
    
});;/**
*@class ali.system
*@name   ali.system
*@author   <a href="mailto:zhouquan.yezq@alibaba-inc.com">Zhouquan.yezq</a>
*@description the system class will charge the system level setting and information,
* like running mode(static/living) , global message timeout etc. so in the feature , if we 
* want change and setting , we just modify one place, not the developer code.
*/
(function($){
    $.namespace('ali.uxcore.util');
    ali.uxcore.util.system={
       /***
              * @name ali.system#STATICMODE
              *@field
              *@description the system will running in the static mode, send request just get the dummy data, not real data.
              */
      STATICMODE:0,
      /***
              * @name ali.system#LIVEMODE
              *@field
              *@description the system will running in the living mode, send request get real data.
              */
      LIVEMODE:1,
      mode:1,
      systempath:'',
      dummydataPath:'',
       /***
              * @name ali.system#globalmsgtimeout
              *@field
              */
      globalmsgtimeout:3000,
      setMode: function(mode) {
        this.mode=mode;
      },
      needLogMonitor: false,
      openLogMemory:false //global setting for log memory flag
    };
    //short cut for ali.uxcore.util.pubsub
    ali.system=ali.uxcore.util.system;

  /**Log Monitor ***/

  $.namespace('ali.monitor');
  var KLASS = ali.monitor;
  KLASS.MONITOR_PAGE = "monitor.html"; //this html file ,you should put together with your project file.   
  KLASS.getName = function() {
    return "iLogger"
  };
  ali.monitor.trunOn = false;
  window.childOpen = false;
  if(ali.system.needLogMonitor){
    $(document).keydown(function(e) {
      if (e.ctrlKey && e.altKey && e.keyCode == 76) { //ctrl+alt+l
        ali.monitor.trunOn = true;
        KLASS._openWindow();
      }
    });
  }
  KLASS._openWindow = function() {
    var url = window.location.href;
    url = url.replace(window.location.pathname, '/' + KLASS.MONITOR_PAGE);
    KLASS._window = window.open(url, "Monitor_", "directories=no," + "location=no," + "menubar=no," + "status=yes," + "personalbar=no," + "titlebar=yes," + "toolbar=no," + "resizable=yes," + "scrollbars=no," + "width=500," + "height=400");
    window.childOpen = true;
    if (this._window) {
      window.focus();
    }
    window.onunload = this.UpdateChild;
  };

  KLASS.UpdateChild = function() {
    //Only if child window is still open, set the parentOpen property
    if (window.childOpen == true) {
      this._window.opener=null;
      this._window.parentOpen = false
      KLASS._window.close();
    }
  };
  KLASS.onHotKey = function() {
    if (this._window == null || this._window.closed) this._openWindow();
  };
  KLASS.appendMessage = function(msg) {
    var w = this._window;
    if (!w || !window.childOpen) {
      this._openWindow();
      w = this._window;
    }
    if (w && w.appendMessage) {
      if (w.isFirstTime()) {
        var memory = ali.logger.logPool;
        for (var i = 0; i < memory.length; i++) {
          w.appendMessage(memory[i]);
        }
      }
      w.appendMessage(msg);
    }
  };

 })(jQuery);;/*
 * jQuery JSONP Core Plugin 2.4.0 (2012-08-21)
 *
 * https://github.com/jaubourg/jquery-jsonp
 *
 * Copyright (c) 2012 Julian Aubourg
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 */
( function( $ ) {

	// ###################### UTILITIES ##

	// Noop
	function noop() {
	}

	// Generic callback
	function genericCallback( data ) {
		lastValue = [ data ];
	}

	// Call if defined
	function callIfDefined( method , object , parameters ) {
		return method && method.apply( object.context || object , parameters );
	}

	// Give joining character given url
	function qMarkOrAmp( url ) {
		return /\?/ .test( url ) ? "&" : "?";
	}

	var // String constants (for better minification)
		STR_ASYNC = "async",
		STR_CHARSET = "charset",
		STR_EMPTY = "",
		STR_ERROR = "error",
		STR_INSERT_BEFORE = "insertBefore",
		STR_JQUERY_JSONP = "_jqjsp",
		STR_ON = "on",
		STR_ON_CLICK = STR_ON + "click",
		STR_ON_ERROR = STR_ON + STR_ERROR,
		STR_ON_LOAD = STR_ON + "load",
		STR_ON_READY_STATE_CHANGE = STR_ON + "readystatechange",
		STR_READY_STATE = "readyState",
		STR_REMOVE_CHILD = "removeChild",
		STR_SCRIPT_TAG = "<script>",
		STR_SUCCESS = "success",
		STR_TIMEOUT = "timeout",

		// Window
		win = window,
		// Deferred
		Deferred = $.Deferred,
		// Head element
		head = $( "head" )[ 0 ] || document.documentElement,
		// Page cache
		pageCache = {},
		// Counter
		count = 0,
		// Last returned value
		lastValue,

		// ###################### DEFAULT OPTIONS ##
		xOptionsDefaults = {
			//beforeSend: undefined,
			//cache: false,
			callback: STR_JQUERY_JSONP,
			//callbackParameter: undefined,
			//charset: undefined,
			//complete: undefined,
			//context: undefined,
			//data: "",
			//dataFilter: undefined,
			//error: undefined,
			//pageCache: false,
			//success: undefined,
			//timeout: 0,
			//traditional: false,
			url: location.href
		},

		// opera demands sniffing :/
		opera = win.opera,

		// IE < 10
		oldIE = !!$( "<div>" ).html( "<!--[if IE]><i><![endif]-->" ).find("i").length;

	// ###################### MAIN FUNCTION ##
	function jsonp( xOptions ) {
		// Build data with default
		xOptions = $.extend( {} , xOptionsDefaults , xOptions );

		// References to xOptions members (for better minification)
		var successCallback = xOptions.success,
			errorCallback = xOptions.error,
			completeCallback = xOptions.complete,
			dataFilter = xOptions.dataFilter,
			callbackParameter = xOptions.callbackParameter,
			successCallbackName = xOptions.callback,
			cacheFlag = xOptions.cache,
			pageCacheFlag = xOptions.pageCache,
			charset = xOptions.charset,
			url = xOptions.url,
			data = xOptions.data,
			timeout = xOptions.timeout,
			pageCached,

			// Abort/done flag
			done = 0,

			// Life-cycle functions
			cleanUp = noop,

			// Support vars
			supportOnload,
			supportOnreadystatechange,

			// Request execution vars
			firstChild,
			script,
			scriptAfter,
			timeoutTimer;

		// If we have Deferreds:
		// - substitute callbacks
		// - promote xOptions to a promise
		Deferred && Deferred(function( defer ) {
			defer.done( successCallback ).fail( errorCallback );
			successCallback = defer.resolve;
			errorCallback = defer.reject;
		}).promise( xOptions );

		// Create the abort method
		xOptions.abort = function() {
			!( done++ ) && cleanUp();
		};

		// Call beforeSend if provided (early abort if false returned)
		if ( callIfDefined( xOptions.beforeSend , xOptions , [ xOptions ] ) === !1 || done ) {
			return xOptions;
		}

		// Control entries
		url = url || STR_EMPTY;
		data = data ? ( (typeof data) == "string" ? data : $.param( data , xOptions.traditional ) ) : STR_EMPTY;

		// Build final url
		url += data ? ( qMarkOrAmp( url ) + data ) : STR_EMPTY;

		// Add callback parameter if provided as option
		callbackParameter && ( url += qMarkOrAmp( url ) + encodeURIComponent( callbackParameter ) + "=?" );

		// Add anticache parameter if needed
		!cacheFlag && !pageCacheFlag && ( url += qMarkOrAmp( url ) + "_" + ( new Date() ).getTime() + "=" );

		// Replace last ? by callback parameter
		url = url.replace( /=\?(&|$)/ , "=" + successCallbackName + "$1" );

		// Success notifier
		function notifySuccess( json ) {
			if ( !( done++ ) ) {

				cleanUp();
				// Pagecache if needed
				pageCacheFlag && ( pageCache [ url ] = { s: [ json ] } );
				// Apply the data filter if provided
				dataFilter && ( json = dataFilter.apply( xOptions , [ json ] ) );
				// Call success then complete
				callIfDefined( successCallback , xOptions , [ json , STR_SUCCESS, xOptions ] );
				callIfDefined( completeCallback , xOptions , [ xOptions , STR_SUCCESS ] );

			}
		}

		// Error notifier
		function notifyError( type ) {
			if ( !( done++ ) ) {

				// Clean up
				cleanUp();
				// If pure error (not timeout), cache if needed
				pageCacheFlag && type != STR_TIMEOUT && ( pageCache[ url ] = type );
				// Call error then complete
				callIfDefined( errorCallback , xOptions , [ xOptions , type ] );
				callIfDefined( completeCallback , xOptions , [ xOptions , type ] );

			}
		}

		// Check page cache
		if ( pageCacheFlag && ( pageCached = pageCache[ url ] ) ) {

			pageCached.s ? notifySuccess( pageCached.s[ 0 ] ) : notifyError( pageCached );

		} else {

			// Install the generic callback
			// (BEWARE: global namespace pollution ahoy)
			win[ successCallbackName ] = genericCallback;

			// Create the script tag
			script = $( STR_SCRIPT_TAG )[ 0 ];
			script.id = STR_JQUERY_JSONP + count++;

			// Set charset if provided
			if ( charset ) {
				script[ STR_CHARSET ] = charset;
			}

			opera && opera.version() < 11.60 ?
				// onerror is not supported: do not set as async and assume in-order execution.
				// Add a trailing script to emulate the event
				( ( scriptAfter = $( STR_SCRIPT_TAG )[ 0 ] ).text = "document.getElementById('" + script.id + "')." + STR_ON_ERROR + "()" )
			:
				// onerror is supported: set the script as async to avoid requests blocking each others
				( script[ STR_ASYNC ] = STR_ASYNC )

			;

			// Internet Explorer: event/htmlFor trick
			if ( oldIE ) {
				script.htmlFor = script.id;
				script.event = STR_ON_CLICK;
			}

			// Attached event handlers
			script[ STR_ON_LOAD ] = script[ STR_ON_ERROR ] = script[ STR_ON_READY_STATE_CHANGE ] = function ( result ) {
				// Test readyState if it exists
				if ( !script[ STR_READY_STATE ] || !/i/.test( script[ STR_READY_STATE ] ) ) {

					try {

						script[ STR_ON_CLICK ] && script[ STR_ON_CLICK ]();

					} catch( _ ) {}

					result = lastValue;
					lastValue = 0;
					result ? notifySuccess( result[ 0 ] ) : notifyError( STR_ERROR );

				}
			};

			// Set source
			script.src = url;

			// Re-declare cleanUp function
			cleanUp = function( i ) {
				timeoutTimer && clearTimeout( timeoutTimer );
				script[ STR_ON_READY_STATE_CHANGE ] = script[ STR_ON_LOAD ] = script[ STR_ON_ERROR ] = null;
				head[ STR_REMOVE_CHILD ]( script );
				scriptAfter && head[ STR_REMOVE_CHILD ]( scriptAfter );
			};

			// Append main script
			head[ STR_INSERT_BEFORE ]( script , ( firstChild = head.firstChild ) );

			// Append trailing script if needed
			scriptAfter && head[ STR_INSERT_BEFORE ]( scriptAfter , firstChild );

			// If a timeout is needed, install it
			timeoutTimer = timeout > 0 && setTimeout( function() {
				notifyError( STR_TIMEOUT );
			} , timeout );

		}

		return xOptions;
	}

	// ###################### SETUP FUNCTION ##
	jsonp.setup = function( xOptions ) {
		$.extend( xOptionsDefaults , xOptions );
	};

	// ###################### INSTALL in jQuery ##
	$.jsonp = jsonp;

} )( jQuery );

/**
*@class  ali.network
*@name ali.network
*@author   <a href="mailto:zhouquan.yezq@alibaba-inc.com">Zhouquan.yezq</a>
* @description ali.network is the network class service for the project, include the ali.network.ajax
* etc. this class is the wrap for jQuery ajax , so we could do more thing , like extend the ajax, error
* message handler, success message show up etc. also the cache mechanism, this will be implement in the
* next stage .
*
*/
(function($){
    $.namespace('ali.uxcore.util');
    var sys=ali.system;
    var showMsgObj={'msgEl':null,'errorMsg':'Ĭ�ϴ�����Ϣ','successMsg':'Ĭ�ϳɹ���Ϣ'};
    var mylog=$.Logger("ali.network");
    ali.uxcore.util.network={
   /**
     *  @name ali.network#ajax
      * @function
      *@description this method is the same as jQuery.ajax , we just wrap it , and do some extend for it .
      * how to use it?
      * 1: for the message hanlde , you should pass showMsgObj to the ajax parameter, this object is
      * the json type, var showMsgObj={msgEl:jQuery("selector"),errorMsg:'',successMsg:''}, and for the
      * msgEl, this is the jQuery dom element, and we should add .comp-ff-info class for info message,
      * add .comp-ff-error for error message, .comp-ff-warn for warn message, .comp-ff-error for error message
      *.comp-ff-success for success message . the ali.network will be auto add them . so developer will
      *just focus on logic , not view style . for time out example , please see timeoutTest.html.
      * <pre>
      * ali.network.ajax({
      *         url:'timeout.php',
      *         showMsgObj:{
      *            msgEl: $("#errorshow"),
      *            isBigIcon:false,
      *            errorMsg:'Error Message',
      *            successMsg:'Success Message'
      *         },success:function(data){
      *           console.info(data);
      *         },error:function(){
      *
      *        }
      *   })
      * </pre>
      *
      */
      ajax: function() {
        var objAux=arguments[0]
        var n=objAux.methodName;
        var scope=objAux.scope;
        showMsgObj=objAux.showMsgObj?objAux.showMsgObj:showMsgObj;
        var suc=objAux.success?objAux.success:function(){};
        var err=objAux.error?objAux.error:function(){};
        // so if load html fragement or js , we need moduleName parameter
        //this place we could do some work for some module plugalbe project.
        if(objAux.dataType=='html') {
            //objAux.url=[sys.systempath,'/modules/',objAux.moduleName,'/view.html'].join('');
        }else if(objAux.dataType=='script') {
           // objAux.url=[sys.systempath,'/modules/',objAux.moduleName,'/model.js'].join('');
        }else if(objAux.dataType=='json' && sys.mode==sys.STATICMODE) {
            // ifcall a method to get json data , we should attach methodName as parameter
             //$.getJSON([sys.dummydataPath,'/',n,'.json'].join(''),suc);
             //return;
        }
        var args={
            url:objAux.url,
            dataType:objAux.dataType,
            success:suc,
            error:function(xhr,status,error){//we should wrap the error method, expose some useful case to developer
              mylog.log('status:'+xhr.status);
              if(status!=="error"){// "timeout", "abort", and "parsererror"
                err.apply(null,arguments);// at least should process timeout
              }
              if(xhr.readyState==4){//error 404,500 tec  xhr.status
                err.apply(null,arguments); // at least should process 500 error
              }else{// some other case
                mylog.log(xhr.readyState);
              }
            },
            timeout: objAux.jsonptimeout?objAux.jsonptimeout:5000,
            method:objAux.method,
            type:objAux.type?objAux.type:'get',
            data:objAux.data?objAux.data:'',
            beforeSend:objAux.beforeSend?objAux.beforeSend:'',
            complete:objAux.complete?objAux.complete:'',
            cache:objAux.cache == undefined ? true : objAux.cache,
            jsonp:objAux.jsonp?objAux.jsonp:'callback',
            jsonpCallback:objAux.jsonpCallback?objAux.jsonpCallback:'?'

        };
        return jQuery.ajax(args).done(this.onSuccess).fail(this.onError).always(this.onComplete);
      },
	  easyJsonp: function(url,jdata){
	  	  var me=this;
		  if(!jdata['loginEmplId'] || jdata['loginEmplId']==""){
			  //App.gotoLogin(); //if no emplid cooke , so go to the login page 
			}
	  	  var dtd = jQuery.Deferred();
	  	  jdata['loginEmplId']=App.getEmplId();
	  	  jdata.jsonptimeout?'':jdata.jsonptimeout=5000;
		  jdata.callback=(App.mode==App.STATIC_MODE)?'jcb':'jcb'+jQuery.now();
		  jQuery.jsonp({
				url: url,
				data:jdata,
				timeout:jdata.jsonptimeout,
				callback: (App.mode==App.STATIC_MODE)?'jcb':'jcb'+jQuery.now(),
				success : function(data) {
					  if(data.httpStatus=='200'){
					    var __data=data.content;
						if (typeof(__data) == "string" || __data==null) {
						  __data= {
						    'content': __data?__data:'',
							'errorCode': data?data.errorCode:'',
							'metadata':data?data.metadata:''
						  };
						}else if(toString.call(__data) == '[object Array]'){
						  __data={
						    'content': __data,
							'errorCode': data?data.errorCode:'',
							'metadata':data?data.metadata:''
						  }
						}
						else{
						__data.errorCode=data && data.errorCode?data.errorCode:'';
						__data.metadata=data.metadata?data.metadata:'';
						}
					    data.content?dtd.resolve(__data):dtd.resolve(data);
					  }else{
					  	PageBus.publish("ais.global.error.500",{'data':data});
					    dtd.reject({status:data.httpStatus,errorcode:data.errorCode,content:data.content});
					  }
					}.bind(this),
				error: function(xhr, status, errorMsg){
					me.onError(xhr, status, errorMsg);
				   dtd.reject({status:'fail',errorcode:status});
				}.bind(this)
			});
			return dtd.promise(); 
	  },
      onSuccess: function(data) {
         mylog.log("++++ onsuccess+++");
         if(data.httpStatus && data.httpStatus==500){
           PageBus.publish("ais.global.error.500",{'data':data});
         }
      },
      onError: function(xhr, textStatus,errorThrown) {//data.content[0].msg
        mylog.log("+++timout ++++");
        mylog.info(textStatus);
		var data={
		  content:[{
		    msg:'server have issue, please contact the server amdin.'
		  }]
		};
        switch (textStatus)
        {
           case "timeout":
			   data={
				  content:[{
				    msg:'tiem out, please contact the server amdin.'
				  }]
				};
               //alert('tiem out, please contact the server amdin.');
               break;
           case "abort":
		       data={
				  content:[{
				    msg:'request be aborted'
				  }]
				};
               break;
           default:
		       data={
				  content:[{
				    msg:'Server have error,please contact the server amdin.'
				  }]
				};
                break;
        }
		PageBus.publish("ais.global.error.500",{'data':data});
      },
      onComplete: function() {
        mylog.log("+++onComplete ++++");
      },
      getScript: function() {
        var objAux=arguments[0]
        objAux.dataType="script";
        ali.network.ajax(objAux);
      },
      getHTML: function(){
        var objAux=arguments[0]
        objAux.dataType="html";
        ali.network.ajax(objAux);
      },
      getJSON: function(){
        var objAux=arguments[0]
        objAux.dataType="json";
        ali.network.ajax(objAux);
      }
    };
    //short cut for ali.uxcore.util.pubsub
    ali.network=ali.uxcore.util.network;
 })(jQuery);
