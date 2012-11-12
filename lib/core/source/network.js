/*
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
    var showMsgObj={'msgEl':null,'errorMsg':'默认错误信息','successMsg':'默认成功信息'};
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
