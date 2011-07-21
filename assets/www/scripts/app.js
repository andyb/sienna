var Sienna = function() {
	//public interface
	var cc = {
		takePhoto : function() {			
			navigator.camera.getPicture(onTakePhotoSuccess, onTakePhotoFail, { quality: 49,allowEdit : true }); 
		},
		addMoment : function() {							
			if($("#tbMomentDescription").val() == "") {				
				alert("Please enter a description for your moment");
				return false;
			}
			
			var imageData = $("#takenPic").attr("src");
			if(capturedImageData && capturedImageData != "") {					
				postImage(); 
			}	
			else {
				postMoment("");
			}						
				
		},		
		children : null,	
		selectedChild : null,
		loadChildren : function() {
			if(!utils.checkConnection() || cc.children != null) {
				return;
			}
			
			utils.startLoading();	
			var request =   {
	                url: utils.getRequestUrl("children?" + new Date().getTime()),
	                success: function(data, textStatus, jqXHR) {	
	                	cc.children = data;
	                	var list = $('#childList');
	                	$('#childList li').remove();	
	                	$.each(cc.children, function(index,child) {	
	                		addChildToChildList(child)
	                			    
	                	});
	                	utils.stopLoading();
	                	list.listview('destroy').listview();	
	                },
	                error: function (jqXHR, textStatus, errorThrown) {	                	
	                	utils.stopLoading();	                	  
	                	utils.checkErrorForSessionEnded(errorThrown);
                      }	                    
	                };

			$.ajax(request);
		},
		loadMoments : function() {
			if(!utils.checkConnection()) {
				return;
			}
			
			utils.startLoading();	
			var request =   {
	                url: utils.getRequestUrl(String.format("moments/{0}?{1}",cc.selectedChild._id,new Date().getTime())),
	                success: function(data, textStatus, jqXHR) {		                	
	                	var list = $('#momentList');
	                	$('#momentList li').remove();	
	                	$.each(data, function(index,moment) {	
	                		addMomentToMomentList(moment);	                		
	                	});	                	
	                	list.listview('destroy').listview();	
	                	utils.stopLoading();	                	
	                },
	                error: function (jqXHR, textStatus, errorThrown) {	                	
	                	utils.stopLoading();	                	  
	                	utils.checkErrorForSessionEnded(errorThrown);
                      }	                    
	                };
			
			//request.headers = { Cookie: sc.getCookie() };
			$.ajax(request);
		},
		addChild : function() {
			var child = {
				firstName: HtmlEncode($.trim($("#childFirstName").val()))
				,middleName: HtmlEncode($.trim($("#childMiddleName").val()))
				,lastName: HtmlEncode($.trim($("#childLastName").val()))
				,dob: ($("#childDOB").val())
			}
			
			var request =   {
	                url: utils.getRequestUrl("children/create"),
	                type: "POST",
	                data: JSON.stringify(child),
	                contentType: "application/json",
	                success: function(data, textStatus, jqXHR) {  	                	
	                	addChildToChildList(data);  
	                	$('#childList').listview('refresh').listview();	
	                },
	                error: function (jqXHR, textStatus, errorThrown) {	                	
	                	utils.stopLoading();	                	  
	                	utils.checkErrorForSessionEnded(errorThrown);
	                  }	                    
	                };
			
			$.ajax(request);
			clearAddChildForm();
		},
		attachPhoto : function() {			
			navigator.camera.getPicture(onTakePhotoSuccess, onTakePhotoFail, { quality: 50, sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM}); 
		}
	};	

	//private
	
	var capturedImageData;
	
	function addChildToChildList(child) {
		var list = $('#childList');
		var link = $(document.createElement('a'));	    	                		
		link.click(function() {
			setMomentList(child);
		})
		link.attr("href","#child");                			                		
		link.html(String.format("{0} {1} {2}",HtmlEncode(child.firstName),HtmlEncode(child.middleName),HtmlEncode(child.lastName)));
		var listItem = $(document.createElement('li'))
		listItem.html(link);	                			                		
		list.append(listItem);
	}
	
	function setMomentList(child) {		
		cc.selectedChild = child;	
		$(".childName").html(child.firstName);
		cc.loadMoments();
	}		
	
	function clearAddChildForm() {
		$("#childFirstName").val("");
		$("#childMiddleName").val("");
		$("#childLastName").val("");
		$("#childDOB").val("");		
	}

	function onTakePhotoSuccess(imageData) {			
		$("#takenPic").attr("src","data:image/jpeg;base64," + imageData);			
		capturedImageData = imageData;		
	}
	
	function onTakePhotoFail(message) {
		
	}
	
	function addMomentToMomentList(moment) {					
		$('#momentList').append(createMomentListItem(moment));
	}
	
	function createMomentListItem(moment) {
		var link = $(document.createElement('a'));
		link.attr("href","#moment");	
		link.click(function() {
			setMoment(moment);
		})
		var created = Date.parse(moment.createdAt);		
		var formattedDate = created.format("dd/mm/yyyy") + " @ " + created.format("isoTime");		
		link.html(String.format("<span class=\"momentTitleHome\">{0} on {1}</span><br /><span class=\"at\">Captured by {2}</span>", moment.description, formattedDate, moment.createdBy.name));
		var listItem = $(document.createElement('li'))
		listItem.html(link);	
		
		return listItem;
	}
	
	function postImage() {
		var request =   {
                url: utils.getRequestUrl("moment-image/create"),
                type: "POST",
                data: "{\"data\":\"" + capturedImageData +"\",\"cid\":\"" + cc.selectedChild._id +"\"}",
                contentType: "application/json",
                success: function(data, textStatus, jqXHR) {  	                	
            		postMoment(data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                	utils.checkErrorForSessionEnded(errorThrown);          	                	             
                  }	                    
                };
		
		$.ajax(request);	
	}
	
	function prependMomentToMomentList(moment) {		
		$('#momentList').prepend(createMomentListItem(moment));
	}
	
	function postMoment(imageID) {		
		var createdMoment = {
				childID : cc.selectedChild._id,
				imageID : imageID,
				createdAt: dateFormat(new Date($("#date").val()), 'isoUtcDateTime'),
				description : HtmlEncode($("#tbMomentDescription").val()),	
				name : Users.current.firstName + " " + Users.current.lastName, 
				uid : Users.current._id
		};
					
		
		if(!utils.checkConnection()) {
			return;
		}		
		
		utils.startLoading(); 	
		var request =   {
                url: utils.getRequestUrl("moments/create"),
                type: "POST",
                data: JSON.stringify(createdMoment),
                contentType: "application/json",
                success: function(data, textStatus, jqXHR) {  		                	
                	prependMomentToMomentList(data);	                	
                	$('#momentList').listview('refresh').listview();		
                	utils.stopLoading();
                		
                },
                error: function (jqXHR, textStatus, errorThrown) {                	
                	utils.stopLoading();	                	  
                	utils.checkErrorForSessionEnded(errorThrown);
                  }	                    
                };
		
		$.ajax(request);	
	}
	
	
	function setMoment(moment) {
		$(".momentDescription").html(moment.description)
		$("#momentHeader").html(cc.selectedChild.firstName);
		if(moment.imageID === "") {			
			$("#momentImage").hide();
			$("#momentDownload").hide();			
		}else {			
			$("#momentImage").show();
			$("#momentDownload").show();
			$("#momentDownload").attr("href", utils.getRequestUrl("moment-image/" + moment.imageID +"/download/" + utils.getAuthCookie()))			
			$("#momentImage").attr("src",utils.getRequestUrl("moment-image/" + moment.imageID))
		}
		
		var created = Date.parse(moment.createdAt);		
		var formattedDate = created.format("dd/mm/yyyy") + " @ " + created.format("isoTime");	
		$("#momentCreatedAt").html(formattedDate)
		$("#momentCreatedBy").html(moment.createdBy.name);
		
	}
	
	return cc;
	
};

var Users = {
		join : function() {
			utils.startLoading(); 	
			var createdUser = {
					firstname : HtmlEncode($.trim($("#signupFirstname").val())),
					lastname : HtmlEncode($.trim($("#signupLastname").val())),
					email : $.trim($("#signupEmail").val()),					
					password : $.trim($("#signupPassword").val())							
			}						
			
			var request = {
	                url: utils.getRequestUrl("users/create"),
	                type: "POST",
	                data: JSON.stringify(createdUser),
	                contentType: "application/json",
	                success: function(data, textStatus, jqXHR) {  	
	                		utils.stopLoading();
	                	    alert("You can now sign in");   
	                	    $.mobile.changePage($("#signin"));
	                },
	                error: function (jqXHR, textStatus, errorThrown) {
	                	utils.stopLoading();
	                	alert(errorThrown);	                	                	            
	                  }	                    
	                };
			
			$.ajax(request);	
		},
		signin : function() {
			utils.startLoading(); 	
			var signinUser = {					
					email : $.trim($("#signinEmail").val()),					
					password : $.trim($("#signinPassword").val())							
			}		
			
			var request = {
	                url: utils.getRequestUrl("user-session/create"),
	                type: "POST",
	                data: JSON.stringify(signinUser),
	                contentType: "application/json",
	                success: function(data, textStatus, jqXHR) {  	                			                		
	                		var cookieKV = jqXHR.getResponseHeader('set-cookie');
	                		var cookieVal = cookieKV.slice(cookieKV.indexOf("=")+1,cookieKV.indexOf(";"));	                			                		
	                		utils.saveAuthCookie(cookieVal);
	                		Users.current = data;
	                		window.localStorage.setItem("currentuser",JSON.stringify(data))
	                		$(".currentname").html(Users.current.firstName);
	                		cc.loadChildren();
	                		utils.stopLoading();	 
	                	    $.mobile.changePage($("#home"));
	                },
	                error: function (jqXHR, textStatus, errorThrown) {
	                	utils.stopLoading();
	                	alert(errorThrown);	                	                	            
	                  }	                    
	                };
			
			$.ajax(request);	
		},
		current : null,
		checkUserSignedIn : function() {
			var user = window.localStorage.getItem("currentuser")
			
			if(user) {
				cc.loadChildren();
				Users.current = JSON.parse(user);
				$(".currentname").html(Users.current.firstName);
			} else {
				$.mobile.changePage($("#signin"));	
			}			
		},
		signOut : function() {					
			var request = {
	                url: utils.getRequestUrl("user-session/end"),
	                type: "POST",
	                data: "",
	                contentType: "application/json",
	                success: function(data, textStatus, jqXHR) {  	                			                	
	                },
	                error: function (jqXHR, textStatus, errorThrown) {
	                	alert(errorThrown);	                	                	            
	                  }	                    
	                };
			
			$.ajax(request);			
			window.localStorage.removeItem("currentuser")
			window.localStorage.removeItem("authcookie");
			Users.current = null;
			cc.children = null;
			$.mobile.changePage($("#signin"));		
		},
		share: function() {
			var data = {
					email:$.trim($("#sharePopEmail").val()),
					childID:cc.selectedChild._id
			};
			
			var request = {
	                url: utils.getRequestUrl("children/add-access"),
	                type: "POST",
	                data: JSON.stringify(data),
	                contentType: "application/json",
	                success: function(data, textStatus, jqXHR) {  	  
	                	alert("You have succesfully shared with " + data.firstName + " " + data.lastName);
	                },
	                error: function (jqXHR, textStatus, errorThrown) {
	                	alert(errorThrown);	                	                	            
	                  }	                    
	                };
			
			$.ajax(request);
			
			$("#sharePopEmail").val("");
		}
}


var utils = {	
		checkErrorForSessionEnded: function (errorThrown) {
	        if (errorThrown == "Forbidden") {
	            navigator.notification.alert(
	            		            "You need to sign back in.", null, "Session ended.", "Ok"
	            		        );
	            Users.signOut();
	        }
	        else {
	        	alert(errorThrown);
	        }
	    },
		getRequestUrl : function(resource) {
			//var baseUrl = "http://192.168.2.29/";			
			var baseUrl = "http://sienna.cloudfoundry.com/";
			return baseUrl + resource;
		},
		checkConnection : function() {
			return true;
		},
		getTimeDiff : function (time)
		{			
			var now = new Date();
			var diff = now.getTime() - time.getTime();
		 
			var timeDiff = utils.getTimeDiffDescription(diff, 'day', 86400000);
			if (!timeDiff) {
				timeDiff = utils.getTimeDiffDescription(diff, 'hour', 3600000);
				if (!timeDiff) {
					timeDiff = utils.getTimeDiffDescription(diff, 'minute', 60000);
					if (!timeDiff) {
						timeDiff = 'moments ago';
					}
				}
			}
		 
			return timeDiff;
		 
		},
		 	
		getTimeDiffDescription: function (diff, unit, timeDivisor)
		{		 
			var unitAmount = (diff / timeDivisor).toFixed(0);
			if (unitAmount > 0) {
				return unitAmount + ' ' + unit + (unitAmount == 1 ? '': 's') + ' ago';			
			} else {
				return null;
			}
		 
		},
		startLoading: function() {			
			if(navigator.notification != null) {
				if(navigator.notification.loadingStart != null) {
					navigator.notification.loadingStart();
					return;
				}
				
				if(navigator.notification.activityStart != null) {
					PhoneGap.exec(null, null, "Notification", "activityStart", ["Loading","Please wait..."]);
					return;
				}
			}		
			
			$.mobile.pageLoading();		
		},
		stopLoading: function() {
			if(navigator.notification != null) {
				if(navigator.notification.loadingStop != null) {
					navigator.notification.loadingStop();
					return;
				}
				
				if(navigator.notification.activityStop != null) {
					navigator.notification.activityStop();
					return;
				}
			}
			 
			$.mobile.pageLoading(true);
		},
		saveAuthCookie: function(cookie) {
			window.localStorage.setItem("authcookie",cookie);
		},
		getAuthCookie: function() {
			return window.localStorage.getItem("authcookie");
		}
				
};

String.format = function() {		
	  var s = arguments[0];
	  for (var i = 0; i < arguments.length - 1; i++) {       
	    var reg = new RegExp("\\{" + i + "\\}", "gm");             
	    s = s.replace(reg, arguments[i + 1]);
	  }

	  return s;
	};
	
	
	/**
	 * Date.parse with progressive enhancement for ISO-8601, version 2
	 * © 2010 Colin Snover <http://zetafleet.com>
	 * Released under MIT license.
	 */
	(function () {
	    var origParse = Date.parse;
	    Date.parse = function (date) {
	        var timestamp = origParse(date), minutesOffset = 0, struct;
	        if (isNaN(timestamp) && (struct = /^(\d{4}|[+\-]\d{6})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?))?/.exec(date))) {
	            if (struct[8] !== 'Z') {
	                minutesOffset = +struct[10] * 60 + (+struct[11]);
	                
	                if (struct[9] === '+') {
	                    minutesOffset = 0 - minutesOffset;
	                }
	            }
	            
	            timestamp = Date.UTC(+struct[1], +struct[2] - 1, +struct[3], +struct[4], +struct[5] + minutesOffset, +struct[6], +struct[7].substr(0, 3));
	        }
	        
	        return new Date(timestamp);
	    };
	}());
	