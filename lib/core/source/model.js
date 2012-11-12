/**
*@class  ali.model
*@name ali.model
*@author   <a href="mailto:zhouquan.yezq@alibaba-inc.com">Zhouquan.yezq</a>
*@description  <p>ali.mode is the basic class for all the model,it inherit the ali.pubsub,
*              and also show up how to define the event, how to bind the class to the view<br>
*             Issue: load the model, should make sure the Dom render already, or the event could not attach correct.<p>
*/
ali.defineClass("ali.model",ali.pubsub,{

    /**
     *  @name ali.model#_init
     *  @description init method for the class, and also expose the hook method for developer: initHook
     */
    _init:function() {
      this.reuseModel=true;
      this.initialize.apply(this,arguments);
      this.initHook();
      this.pub('inited');
      this.sub('beforedoV',function(){
        this.closeAllServerError();
      }.bind(this));
    },
    /***
  *  @name ali.model#$el
     * @description the jQuery dom element we want the class to attach, so according the $el,
     * the class and DOM element will make the connection
     * @field
     */
    $el:null,
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
		this.jel?'':(this.jel=this.$el);
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
    initHook: function(){	
		if(jQuery.browser.msie && (jQuery.browser.version == "7.0" || jQuery.browser.version == "6.0") ){
		  this.$('.editEl').focus(function(e){
		      this.logger.info(this.$(e.target));
			  this.logger.info(this.$(e.target).html());
			  this.$(e.target).css("border","1px solid  #6482b9");
	      }.bind(this));

	      this.$('.editEl').blur(function(e){
		   this.$(e.target).css("border","1px solid #a0a0a0");
	      }.bind(this));
		}
      /*this.$('.readonly').blur(function(e){
           this.$(e.target).css({'border-color' : '#dedede'});
      }.bind(this));*/
    },
    render: function(){
	    
    },
    afterRender: function(){
	    
    },
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
            if(this.reuseModel && this.$(selector).length>0){  
               this.$el.delegate(selector, eventName, method);
            }else if(!this.reuseModel){
              this.$el.delegate(selector, eventName, method);
            }
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
    },
    /***
         *  @name ali.model#closeAllServerError
         * @function
         * @description some time, we have two type validtaion, one is the front-end validation, the other is
         * the backend validation . so before we do the client validation, we should close the back-end issue.
         <pre>
           how to do it?
           before doV, just call this.pub('beforedoV'), since we already sub this topic already in the init method
           by the way, we should use 'comp-ff-backend-error' class style, like 
            <div  class="comp-ff-backend-error" style="display:block;">
               <span class="error">$field.message</span>
            </div>
           </pre>
         * @return NULL
         */
    closeAllServerError: function(){
      this.$('.comp-ff-backend-error').css('display','none');
    }
    
});