/*

 JetPlurk-dash
 http://sites.google.com/site/jetplurk/dash
 
 This project is licensed under cc: BY-NC-SA 3.0 Taiwan 
 http://creativecommons.org/licenses/by-nc-sa/3.0/tw/
 Source: http://github.com/irvin/JetPlurk-dash 

 Irvin (irvinfly@gmail.com)

*/

//
// Function: load()
// Called by HTML body element's onload event when the widget is ready to start
//
function load()
{
    //dashcode.setupParts();
}

//
// Function: remove()
// Called when the widget has been removed from the Dashboard
//
function remove()
{
    // Stop any timers to prevent CPU usage
    // Remove any preferences as needed
    // widget.setPreferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
}

//
// Function: hide()
// Called when the widget has been hidden
//
function hide()
{
    // Stop any timers to prevent CPU usage
}

//
// Function: show()
// Called when the widget has been shown
//
function show()
{
    // Restart any timers that were stopped on hide
	initialPro();
}

//
// Function: sync()
// Called when the widget has been synchronized with .Mac
//
function sync()
{
    // Retrieve any preference values that you need to be synchronized here
    // Use this for an instance key's value:
    // instancePreferenceValue = widget.preferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
    //
    // Or this for global key's value:
    // globalPreferenceValue = widget.preferenceForKey(null, "your-key");
}

//
// Function: showBack(event)
// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button
//
function showBack(event)
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToBack");
    }

	// Get username & password from preference & fill into text input
	var strUsername = widget.preferenceForKey(widget.identifier + "-" + "strUsername");
	var strPassword = widget.preferenceForKey(widget.identifier + "-" + "strPassword");
	if (strUsername != null){
		$(back).find("#txtUsername").attr('value', strUsername);
		$(back).find("#txtPassword").attr('value', strPassword);
	}

    front.style.display = "none";
    back.style.display = "block";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}

//
// Function: showFront(event)
// Called when the done button is clicked from the back of the widget
//
// event: onClick event from the done button
//
function showFront(event)
{

	// Get Username & Password
	var strUsername = $("#txtUsername").val();
	var strPassword = $("#txtPassword").val();
	if (strUsername != "") {	//Save it		
		widget.setPreferenceForKey(strUsername, widget.identifier + "-" + "strUsername");
		widget.setPreferenceForKey(strPassword, widget.identifier + "-" + "strPassword");
	}
		
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToFront");
    }

    front.style.display="block";
    back.style.display="none";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
	
	initialPro();
}

if (window.widget) {
    widget.onremove = remove;
    widget.onhide = hide;
    widget.onshow = show;
    widget.onsync = sync;
}



//-------------------------



var loginStr = {
	username: '',
	password: '',
};

var userData = {
	nick_name: '',
};

var NewOffset = Date.parse(new Date()); // To remember latest refresh time
var JetPlurkVer = '0.11';
var ReadOffset = Date.parse("January 1, 1975 00:00:00"); // Latest read plurk post time
var OldOffset = Date.parse(new Date()); // Oldest loaded plurk timestamp
var user_displayname = null;


function initialPro()
{
	console.log('JetPlurk ' + JetPlurkVer + ' Start: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);

	// Get username & password from preference
	var strUsername = widget.preferenceForKey(widget.identifier + "-" + "strUsername");
	var strPassword = widget.preferenceForKey(widget.identifier + "-" + "strPassword");	

	// IF not get Username & Password, flip to back for setting
	if (strUsername == null){
		showBack();
	} else{
		loginStr.username=strUsername;
		loginStr.password=strPassword;
	}
	// console.log("GetUsername "+strUsername+" GetPassword "+strPassword)
	
	// Show version of JetPlurk
	var content = "<div id='jetplurkmeta'>" + JetPlurkVer + "</div>";
	$('div#jetplurkmeta').replaceWith(content);				
										
	reFreshPlurk();
	
	// Add click event listener on loadmore button
	$('#loadmore').click(function(event) {
		loadMorePlurk();
		event.preventDefault();
		event.stopPropagation(); // Stop event bubble			
	})

	// Add click event listener on "Plurk" button for send plurk		
	$("input#send_button").click(function(event) {
		sendPlurk();
		event.preventDefault();
		event.stopPropagation(); // Stop event bubble
	})

	// Force JetPlurk icon link open in browser
	/*
	$("#banner a").click(function(e) {	
		if (this.href) {
			console.log(this.href);
			//widget.openURL(this.href);
		}
		e.stopPropagation();
		e.preventDefault();
	});
	*/

}

function reFreshPlurk() {
	// When reFreshPlurk, preform login and get newest plurk
	
	API.call('/Users/login', {                                            
			username:   loginStr.username,                     
			password:   loginStr.password,                    
			ssl:        true,                                         
		},                                                            
		function(jsObject) {	
			// Success

			// Wipe out old msg
			$('#msgs').fadeOut('medium', function() {
				$('#msgs').remove();
				var content = "<div id='msgs'></div>";
				$('div#sendPlurk').after(content);
				ShowNewPlurk(jsObject);
			});
			NewOffset = Date.parse(new Date()); // Remember refresh time
			console.log('JetPlurk refresh: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);
			
			// Show user meta
			var avatarurl = '';
			user_displayname = jsObject.user_info.display_name;
			userData.nick_name=jsObject.user_info.nick_name;
			if ((jsObject.user_info.has_profile_image == 1) && (jsObject.user_info.avatar == null)) {
				avatarurl = 'http://avatars.plurk.com/' + jsObject.user_info.uid + '-medium.gif';
			}
			else if ((jsObject.user_info.has_profile_image == 1) &&
			(jsObject.user_info.avatar != null)) {
				avatarurl = 'http://avatars.plurk.com/' + jsObject.user_info.uid + '-medium' + jsObject.user_info.avatar + '.gif';
			}
			else if (jsObject.user_info.has_profile_image == 0) {
				avatarurl = 'http://www.plurk.com/static/default_medium.gif';
			}
			
			var content = "<div id='usermeta'><img class='useravatar' src='" + avatarurl + "' /><span class='displayname'>" + user_displayname + "</span> <span class='karma'>Karma:" + jsObject.user_info.karma + "</span></div>";
			$("#usermeta").replaceWith(content);

		},                                
		function(xhr, textStatus, errorThrown) {
			// Login error
			console.log('Login error: ' + xhr.status + ' ' + xhr.responseText);
		}                                    
	);
};


function sendPlurk() {
	// when click sendplurk form submit button, check textarea, and submit plurk	
	var sendFormObj = $('form#sendform');
	var response_txt = $(sendFormObj).find("#text_area").val();
	if (response_txt != "") {
		API.call('/Timeline/plurkAdd', {                                            
				content:	response_txt,
				qualifier:	':',
			},                                                            
			function() {	
				// Success
				// Display new response
				reFreshPlurk();					
				$(sendFormObj).find("#text_area").attr('value', null);
			},                                
			function(xhr, textStatus, errorThrown) {
				// Login error
				console.log('Login error: ' + xhr.status + ' ' + xhr.responseText);
			}                                    
		);		
	}
}

function ISODateString(d) {
	// ISO 8601 formatted dates example
	// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Date
	function pad(n) {
		return n < 10 ? '0' + n : n
	}
	return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds())
}

function postTime(d) {
	// Return str post time until now ()
	var timediff = ((Date.parse(new Date()) - Date.parse(d)) / 1000 / 60); // 1min
	if (timediff < 1) {
		return 'just posted';
	}
	else if (timediff < 60) {
		return (parseInt(timediff) + ' mins ago');
	}
	else if (timediff < 120) {
		return '1 hour ago';
	}
	else if (timediff < 1440) {
		return (parseInt(timediff / 60) + ' hours ago');
	}
	else if (timediff < 2880) {
		return '1 day ago';
	}
	else if (timediff < 10080) {
		return (parseInt(timediff / 1440) + ' days ago');
	}
	else if (timediff < 20160) {
		return '1 week ago';
	}
	else {
		return (parseInt(timediff / 10080) + ' weeks ago');
	}
	
}

function loadMorePlurk() {
	// When loadMorePlurk, get old plurks from OldOffset	
	API.call('/Timeline/getPlurks', {
			offset: ISODateString(new Date(OldOffset)),
		},
		function(jsObject) {	// Success
			// Throw the loaded plurk to show plurk function
			// var jsObject = JSON.parse(json);
			// correct plurk api bugs
			jsObject.plurks_users = jsObject.plurk_users;
			// console.log(json)
			ShowNewPlurk(jsObject);
			console.log('JetPlurk Load More: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);
		},                                
		function(xhr, textStatus, errorThrown) {
			// Login error
			console.log('Login error: ' + xhr.status + ' ' + xhr.responseText);
		}
	);
};

function ShowNewPlurk(jsObject) {
	// Display each plurk
	
	$(jsObject.plurks).each(function(i) {
		var owner_id = jsObject.plurks[i].owner_id;
		if (jsObject.plurks_users[owner_id].display_name != null) {
			var owner_display_name = jsObject.plurks_users[owner_id].display_name;
		}
		else {
			var owner_display_name = jsObject.plurks_users[owner_id].nick_name
		}
		if (jsObject.plurks[i].qualifier_translated != null) {
			// English qualifier
			var qualifier = jsObject.plurks[i].qualifier_translated;
		}
		else {
			var qualifier = jsObject.plurks[i].qualifier;
		}
		var premalink = jsObject.plurks[i].plurk_id.toString(36);
		var read = jsObject.plurks[i].is_unread;
		var response_count = jsObject.plurks[i].response_count;
		var responses_seen = jsObject.plurks[i].responses_seen;
		var postedtime = jsObject.plurks[i].posted;
		var timestr = postTime(jsObject.plurks[i].posted);
		var content = "<msg id='" + jsObject.plurks[i].plurk_id + "' postime='" + postedtime + "'";
		
		if ((read == 1) || ((ReadOffset < Date.parse(postedtime)) && (response_count == 0))) {
			// If message is unread
			content += " class='unread'>";
		}
		else if (responses_seen < response_count) {
			// If message response num. higher than seen-responses number
			content += " class='unreadresponse'>";
		}
		else {
			// Message is read
			content += ">";
		}
		
		content += "<content>" + owner_display_name + " ";
		
		if (qualifier != '') {
			content += "[" + qualifier + "] ";
		}
		
		content += jsObject.plurks[i].content + "</content><span class='meta'><timestr>" + timestr + "</timestr> <a class='permalink' href='http://www.plurk.com/p/" + premalink + "' target='_blank'>link</a>";
		if (response_count > 0) { // If has response
			content += "<responseNum>" + response_count + "</responseNum>";
		}
		content += "</span></msg>";
		console.log('read ' + read + ' response_count ' + response_count + ' responses_seen ' + responses_seen + ' ' + content);
		$('#msgs').append(content);
		OldOffset = Date.parse(postedtime); // Remember oldest loaded plurk time
		
		refreshScrollArea();
	});
		
	// Add hover event listener on each msg
	$("msg").hover(function() {
		var hoverMsg = $(this);
		var selectPlurkID = parseInt(hoverMsg.attr("id"));
		var selectPlurkRead = hoverMsg.attr("class");
		var selectPlurkTimestamp = hoverMsg.attr("postime");
		console.log('Hover: ' + selectPlurkID + ' Read [' + selectPlurkRead + '] Plurk time: ' + selectPlurkTimestamp + Date.parse(selectPlurkTimestamp) + ' ReadOffset ' + ReadOffset);
		
		if ((selectPlurkRead == 'unread') || (selectPlurkRead == 'unreadresponse')) {
			// if unread or unreadresponse, set to read when hover
			var boTrue = new Boolean(true);
						
			API.call('/Timeline/markAsRead', {
					ids: JSON.stringify([selectPlurkID]),
					note_position: true
				},
				function(jsObject) {	// Success
				// console.log('Set read: ' + json);
					$(hoverMsg).removeClass("unread").removeClass("unreadresponse");
					if (Date.parse(selectPlurkTimestamp) > ReadOffset) {
						ReadOffset = Date.parse(selectPlurkTimestamp);
						// console.log('myStorage.ReadOffset update: ' + myStorage.ReadOffset);
					}			
				},                                
				function(xhr, textStatus, errorThrown) {
					// Login error
					console.log('Login error: ' + xhr.status + ' ' + xhr.responseText);
				}
			);
		}
	}, function() {
		// console.log("unHOVER!");
	});
	
	
	// Force all link open in browser
	$("msg").find('a').click(function(e) {
		// Function: clickOnLink() from Dashcode template "RSS" 
		// Called from onClick to open a link in the browser instead of in the widget.
		if (window.widget) {
			widget.openURL(this.href);
			//console.log(e);
			//if (e) {
				e.stopPropagation();
				e.preventDefault();
			//}
			//return false;
		}
	});
	
	
	// Add click event listener on each msg
	$("msg").click(function() {
		var clickMsg = $(this);
		var selectPlurkID = parseInt(clickMsg.attr("id"));
		var selectPlurkResponseNum = clickMsg.find("responseNum").text();
		// console.log('Click: ' + selectPlurkID + ' responseNum ' + selectPlurkResponseNum);
		
		// If click msg has not showing response form, showing now
		if ($(clickMsg).find("responses").html() == null) {
		
			$(clickMsg).append('<responses></responses>');
			// Show response form
			var content = "<form id='responseform' class='" + selectPlurkID + "'><textarea name='content' rows='1'></textarea>" + "<input id='response_button' type='submit' value='Reponse' /></form>";
			
			$(clickMsg).find("responses").append(content);
			// Add click event to response form, stop click to hide responses event
			$(clickMsg).find("form#responseform").click(function(event) {
				event.preventDefault();
				event.stopPropagation(); // Stop event bubble
			});
			
			$(clickMsg).find(":submit").click(function(event) {
				// when click response form submit button, check textarea, and submit response
				var response_txt = $(clickMsg).find("textarea").val();
				if (response_txt != "") {
					API.call('/Responses/responseAdd', {
							plurk_id: selectPlurkID,
							content: response_txt,
							qualifier: ':'
						},
						function(reObject) {	// Success
							console.log('Responsed: ' + reObject);
							// Display new response
							
							var responser_id = reObject.user_id;
							responser_display_name = user_displayname;
							
							var postedtime = reObject.posted;
							var timestr = postTime(reObject.posted);
							if (reObject.qualifier_translated != null) {
								// English qualifier
								var qualifier = reObject.qualifier_translated;
							}
							else {
								var qualifier = reObject.qualifier;
							}
							var content = "<response>" + responser_display_name + " ";
							if (qualifier != '') {
								content += "[" + qualifier + "] ";
							}
							content += reObject.content + " <span class='meta'><timestr>" + timestr + "</timestr></span></response>";
							console.log(content);
							$(clickMsg).find("form#responseform").before(content);
							$(clickMsg).find("form#responseform").get(0).reset();
		
						},                                
						function(xhr, textStatus, errorThrown) {
							// Login error
							console.log('Login error: ' + xhr.status + ' ' + xhr.responseText);
						}
					);
					
				}
				event.preventDefault();
				event.stopPropagation(); // Stop event bubble
			});
			
			if (selectPlurkResponseNum != "") {
				// If click msg has response & not showing now, get response
				API.call('/Responses/get', {
						plurk_id: selectPlurkID,
						from_response: 0
					},
					function(jsObject) {	// Success
						// console.log('Get response: ' + json);
						
						// Display each response
						$(jsObject.responses).each(function(i) {
							var responser_id = jsObject.responses[i].user_id;
							if (jsObject.friends[responser_id].display_name != '') {
								var responser_display_name = jsObject.friends[responser_id].display_name;
							}
							else {
								var responser_display_name = jsObject.friends[responser_id].nick_name;
							}
							var postedtime = jsObject.responses[i].posted;
							var timestr = postTime(jsObject.responses[i].posted);
							if (jsObject.responses[i].qualifier_translated != null) {
								// English qualifier
								var qualifier = jsObject.responses[i].qualifier_translated;
							}
							else {
								var qualifier = jsObject.responses[i].qualifier;
							}
							var content = "<response>" + responser_display_name + " ";
							if (qualifier != '') {
								content += "[" + qualifier + "] ";
							}
							content += jsObject.responses[i].content + " <span class='meta'><timestr>" + timestr + "</timestr></span></response>";
							// console.log(content);
							$(clickMsg).find("form#responseform").before(content);
						});
						// console.log($(clickMsg).html());
		
					},                                
					function(xhr, textStatus, errorThrown) {
						// Login error
						console.log('Login error: ' + xhr.status + ' ' + xhr.responseText);
					}
				);

			}
			
		}
		else {
			// If showing <responses> now, remove it
			$(clickMsg).find("responses").fadeOut('fast', function() {
				$(clickMsg).find("responses").remove();
			});
		}
		
	});
	

}




function refreshScrollArea() {
	// Refresh ScrollArea when content change to adjust scrollbar 
    var contentarea = document.getElementById("scrollArea");
    if (contentarea) {
		console.log("");
		contentarea.object.refresh();
	}
}

function openPersonalPlurk(event)
{
	widget.openURL('http://www.plurk.com/'+userData.nick_name);
}
