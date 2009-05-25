/*
* jQuery SFBrowser
*
* Version: 3.0.3
*
* Copyright (c) 2008 Ron Valstar http://www.sjeiti.com/
*
* Dual licensed under the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*
* description
*   - A file browsing and upload plugin. Returns a list of objects with additional information on the selected files.
*
* requires
*   - jQuery 1.2+
*   - PHP5 (or any other server side script if you care to write the connectors)
*
* features
*   - ajax file upload
*	- optional as3 swf upload (queued multiple uploads, upload progress, upload canceling, selection filtering, size filtering)
*   - localisation (English, Dutch or Spanish)
*	- server side script connector
*	- plugin environment (with filetree and imageresize plugin)
*	- data caching (minimal server communication)
*   - sortable file table
*   - file filtering
*   - file renameing
*   - file duplication
*   - file download
*   - file/folder context menu
*   - file preview (image, audio, video, text/ascii and swf)
*	- folder creation
*   - multiple files selection (not in IE for now)
*	- inline or overlay window
*	- window dragging and resizing
*	- cookie for size, position and path
*	- keyboard shortcuts
*	- key file selection
*
* how it works
*   - sfbrowser returns a list of file objects.
*	  A file object contains:
*		 - file(String):		The file including its path
*		 - mime(String):		The filetype
*		 - rsize(int):			The size in bytes
*		 - size(String):		The size formatted to B, kB, MB, GB etc..
*		 - time(int):			The time in seconds from Unix Epoch
*		 - date(String):		The time formatted in "j-n-Y H:i"
*		 - width(int):			If image, the width in px
*		 - height(int):			If image, the height in px
*
* aknowlegdments
*   - ajax file upload scripts from http://www.phpletter.com/Demo/AjaxFileUpload-Demo/
*	- Spanish translation: Juan Razeto
*
* todo:
*	- sort uploading files on top
*	- correct error handling (opposed to the current silent json break php fail)
*	- multiple file deletion (recursive folder deletion)
*   - new: general filetype filter
*   - fix: IE swf upload
*   - new: folder information such as number of files (possibly add to filetree)
*	- oSettings.file to work with multiple files
*	o table
*		- possibly replace table for http://code.google.com/p/flexigrid/, or do it myself and fix the scrolling, structure follows function
*		- IE: fix IE and Safari scrolling (table header moves probably due to absolute positioning of parents), or simply don't do xhtml (make two tables)
*		- add: drag and drop files to folders
*		- maybe: thumbnail view
*		- fix: since resizing is possible abbreviating long filenames does not cut it (...)
*		o multiple file selection
*			- add: make text selection in table into multiple file selection
*			- FF: multiple file selection: disable table cell highlighting (border)
*			- IE: fix multiple file selection
*	o preview
*		- new: make preview an option
*		- add: image preview: no-scaling on smaller images
*		- add: show zip and rar file contents in preview
*   - new: add mime instead of extension (for mac)
*   - new: create/edit ascii file (plugin)
*	- add: style option: new or custom css files
*	- fix: Opera sucks (or let Opera fix itself)
*	- code: check what timeout code in upload code really does
*	- fix: figure out IE slowness by disabling half transparent bg (replace with gif)
*
* in this update:
*		- added: debug mode message
*		- added: auto scrol lto selection
*		- added: audio and video preview
*		- added: keyboard first character selection
*		- added: highlight current selection (file) on open
*		- added: "j-n-Y H:i" filetime now in config
*		- removed: array prototype functions / added single function
*		- fixed: overwrite file uploade shows duplicate file
*		- added: alert when uploading same file
*		- added: swf preview
*		- changed: preview/download icon
*		- implemented as3 swf upload enabeling:
*			- queued multiple uploads
*			- upload progress
*			- upload canceling
*			- selection filtering
*			- size filtering
*
*/
;(function($) {
	// private variables
	var oSettings = {};
	var aSort = [];
	var iSort = 0;
	var bHasImgs = false;
	//
	var aPath = [];
	var oTree = {};
	//
	var bOverlay = false;
	//
	var sFolder;
	var sReturnPath;
	//
	var mTrLoading;
	//
	var iBrW;// = $(window).width();
	var iBrH;// = $(window).height();
	var iWinMaxW = 331;
	var iWinMaxH = 275;
	//
	// display
	var mWin;
	var mTbB;
	//
	// default settings
	$.sfbrowser = {
		 id: "SFBrowser"
		,version: "3.0.3"
//		,tree: oTree // $$temp
//		,path: aPath // $$temp
		,defaults: {
			 title:		""						// the title
			,select:	function(a){trace(a)}	// calback function on choose
			,file:		""						// selected file
			,folder:	""						// subfolder (relative to base), all returned files are relative to base
			,dirs:		true					// allow visibility and creation/deletion of subdirectories
			,upload:	true					// allow upload of files
			,swfupload:	false					// use swf uploader instead of form hack
			,allow:		[]						// allowed file extensions
			,resize:	null					// resize images after upload: array(width,height) or null
			,inline:	"body"					// a JQuery selector for inline browser
			,fixed:		false					// keep the browser open after selection (only works when inline is not "body")
			,cookie:	false					// use a cookie to remeber path, x, y, w, h
			,x:			null					// x position, centered if left null
			,y:			null					// y position, centered if left null
			,w:			640						// width
			,h:			480						// height
			// basic control (normally no need to change)
			,img:		["gif","jpg","jpeg","png"]
			,ascii:		["txt","xml","html","htm","eml","ffcmd","js","as","php","css","java","cpp","pl","log"]
			,movie:		["mp3","mp4","m4v","m4a","3gp","mov","flv","f4v"]
			// set from init, explicitly setting these from js can lead to unexpected results.
			,sfbpath:	"sfbrowser/"			// path of sfbrowser (relative to the page it is run from)
			,base:		"../data/"				// upload folder (relative to sfbpath)
			,deny:		[]						// not allowed file extensions
			,icons:		[]						// list of existing file icons
			,preview:	600						// amount of bytes for ascii preview
			,connector:	"php"					// connector file type (php)
			,lang:		{}						// language object
			,plugins:	[]						// plugins
			,maxsize:	2097152					// upload_max_filesize in bytes
			,debug:		false					// debug (allows trace to console)
		}
		// add language on the fly
		,addLang: function(oLang) {
			for (var sId in oLang) $.sfbrowser.defaults.lang[sId] = oLang[sId];
		}
		// swf upload functions (ExternalInterface) 446
		,swfInit: function() {trace("swfInit");}
		,ufileSelected: function(s) {
			var bPrcd = true;
			if (getPath().contents[s]!==undefined&&!confirm(oSettings.lang.fileExistsOverwrite)) bPrcd = false;
			if (bPrcd) $("#swfUploader").get(0).doUpload(s);
			else $("#swfUploader").get(0).cancelUpload(s);
		}
		,ufileTooBig: function(s) {
			alert(oSettings.lang.fileTooBig.replace("#1",s).replace("#2",format_size(oSettings.maxsize,0)));
		}
		,ufileOpen: function(s) {
			var oExists = getPath().contents[s];
			if (oExists) oExists.tr.remove(); // $$overwriting existing files and canceling while uploading will cause the old file to disappear from view
			var mTr = listAdd({file:s,mime:"upload",rsize:0,size:"",time:0,date:"",width:0,height:0}).addClass("uploading");
		}
		,ufileProgress: function(f,s) {
			var oExists = getPath().contents[s];
			var mPrg = oExists.tr.find(".progress");
			var sPerc = Math.round(f*100)+"%";
			mPrg.find("span").text(sPerc);
			mPrg.find("div").css({width:sPerc});
		}
		,ufileCompleteD: function(o) {
			getPath().contents[o.data.file].tr.remove();
			listAdd(o.data).trigger('click');
		}
		,getPath: function() {
			$("#swfUploader").get(0).setPath(aPath.join(""));
		}
		//,tree: oTree // $$temp for debug
		//,path: aPath // $$temp for debug
	};
	// init
	$(function() {
		trace("SFBrowser init",true);
	});
	// call
	$.fn.extend({
		sfbrowser: function(_settings) {
			oSettings = $.extend({}, $.sfbrowser.defaults, _settings);
			oSettings.conn = oSettings.sfbpath+"connectors/"+oSettings.connector+"/sfbrowser."+oSettings.connector;
			//
			//////////////////////////// cookies
			var oCookie;
			var bCookie = false;
			if (oSettings.cookie) {
				var sCookie = readCookie($.sfbrowser.id);
				if (sCookie) {
					try {
						oCookie = eval("("+sCookie+")");
						oSettings.x = oCookie.x;
						oSettings.y = oCookie.y;
						oSettings.w = oCookie.w;
						oSettings.h = oCookie.h;
						if (oCookie.path.length>0) bCookie = true;
					} catch (e) {
						trace("sfb cookie error: "+sCookie);
						eraseCookie($.sfbrowser.id);
					}
				}
			} else {
				eraseCookie($.sfbrowser.id);
			}
			//////////////////////////// (clear) start vars
			iBrW = $(window).width();
			iBrH = $(window).height();
			aSort = [];
			bHasImgs = oSettings.allow.length===0||unique(copy(oSettings.img).concat(oSettings.allow)).length<(oSettings.allow.length+oSettings.img.length);
			aPath = [];
			sFolder = oSettings.base+oSettings.folder;
			bOverlay = oSettings.inline=="body";
			if (bOverlay) oSettings.fixed = false;
			//
			// path vs cookie
			if (oSettings.cookie&&bCookie) {
				if (sFolder==oCookie.path[0]) {
					aPath = oCookie.path;
					sFolder = aPath.pop();
				}
			}
			//
			// fix path and base to relative
			var aFxSfbpath =	oSettings.sfbpath.split("/");
			var aFxBase =		oSettings.base.split("/");
			var iFxLen = Math.min(aFxBase.length,aFxSfbpath.length);
			var iDel = 0;
			for (var i=0;i<iFxLen;i++) {
				var sFxFolder = aFxBase[i];
				if (sFxFolder==".."&&aFxSfbpath.length>0) {
					while (true) {
						var sRem = aFxSfbpath.pop();
						if (sRem!="") {
							iDel++;
							break;
						}
					}
				} else if (sFxFolder!="") {
					aFxBase = aFxBase.splice(iDel);
					break;
				}
			}
			sReturnPath = (aFxSfbpath.join("/")+"//"+aFxBase.join("/")).replace(/(\/+)/,"/").replace(/(^\/+)/,"");
			//
			//////////////////////////// file browser
			mSfb = $(oSettings.browser);
			mWin = mSfb.find("#fbwin");
			mTbB = mSfb.find("#fbtable>table>tbody");
			// top menu
			mSfb.find("div.sfbheader>h3").html((oSettings.title==""?oSettings.lang.sfb:oSettings.title)+(oSettings.debug?" <span>debug mode</span>":""));
			mSfb.find("div#loadbar>span").text(oSettings.lang.loading);
			mSfb.find("#fileToUpload").change(fileUpload);
			var mTopA = mSfb.find("ul#sfbtopmenu>li>a");
			if (oSettings.dirs)		mTopA.filter(".newfolder").click(addFolder).attr("title",oSettings.lang.newfolder).find("span").text(oSettings.lang.newfolder);
			else					mTopA.filter(".newfolder").parent().remove();
			if (oSettings.upload)	mTopA.filter(".upload").attr("title",oSettings.lang.upload).find("span").text(oSettings.lang.upload);
			else					mTopA.filter(".upload").parent().remove();
			if (!oSettings.fixed)	mTopA.filter(".cancelfb").click(closeSFB).attr("title",oSettings.lang.cancel).find("span").text(oSettings.lang.cancel);
			else					mTopA.filter(".cancelfb").parent().remove();
			// table headers
			var mTh = mSfb.find("table#filesDetails>thead>tr>th");
			mTh.eq(0).text(oSettings.lang.name);
			mTh.eq(1).text(oSettings.lang.type);
			mTh.eq(2).text(oSettings.lang.size);
			mTh.eq(3).text(oSettings.lang.date);
			mTh.eq(4).text(oSettings.lang.dimensions);
			if (!bHasImgs) mTh.eq(4).remove();
			mTh.filter(":not(:last)").each(function(i,o){
				$(this).click(function(){sortFbTable(i)});
			}).append("<span>&nbsp;</span>");
			// big buttons
			mSfb.find("div.choose").click(chooseFile).text(oSettings.lang.choose);
			mSfb.find("div.cancelfb").click(closeSFB).text(oSettings.lang.cancel);
			mSfb.find("div#sfbfooter").prepend("SFBrowser "+$.sfbrowser.version+" ");
			// loading msg
			mTrLoading = mTbB.find("tr").clone();
			//
			//
			$("#sfbrowser").remove();
			mSfb.appendTo(oSettings.inline);
			//
			//
			// context menu
			addContextItem("choose",		oSettings.lang.choose,		function(){chooseFile()});
			addContextItem("rename",		oSettings.lang.rename,		function(){renameSelected()});
			addContextItem("duplicate",		oSettings.lang.duplicate,	function(){duplicateFile()});
			addContextItem("preview",		oSettings.lang.view,		function(){mTbB.find("tr.selected:first a.preview").trigger("click")});
			addContextItem("filedelete",	oSettings.lang.del,			function(){mTbB.find("tr.selected:first a.filedelete").trigger("click")});
			mSfb.click(function(){
				$("#sfbcontext").slideUp("fast");
			});
			//
			//////////////////////////// window positioning and sizing
			if (bOverlay) { // resize and move window
				$(window).bind("resize", resizeBrowser);
				mSfb.find("h3").attr("title",oSettings.lang.dragMe).mousedown(moveWindowDown);
				mSfb.find("div#resizer").attr("title",oSettings.lang.dragMe).mousedown(resizeWindowDown);
				if (oSettings.x==null) oSettings.x = Math.round($(window).width()/2-mWin.width()/2);
				if (oSettings.y==null) oSettings.y = Math.round($(window).height()/2-mWin.height()/2);
				mWin.css({ top:oSettings.y, left:oSettings.x, width:oSettings.w, height:oSettings.h });
			} else { // static inline window
				trace("sfb inline");
				mSfb.find("#fbbg").remove();
				mSfb.find("div#resizer").remove();
				mSfb.find("div.cancelfb").remove();
				mSfb.css({position:"relative",width:"auto",heigth:"auto"});
				mWin.css({position:"relative",border:"0px"});
				var mPrn = $(oSettings.inline);
				resizeWindow(0,mPrn.width(),mPrn.height());
			}
			//
			//////////////////////////// keys
			// ESC		27		close filebrowser
			// (F1		-		help)				#impossible: F1 browser help
			// F2		113		rename
			// F4		115		edit				#unimplemented
			// (F5		-		copy)				#impossible: F5 browser reloads
			// (F6		-		move)				
			// (F7		-		create directory)	
			// F8		119		delete				#unimplemented
			// F9		120		properties			#unimplemented
			// (F10		-		quit)				
			// F11		122							#impossible: F5 browser fullscreen
			// F12		123							
			// 13		RETURN	choose file
			// 32		SPACE	select file			#unimplemented
			// SHIFT	65		multiple selection	#unimplemented
			// CTRL		17		multiple selection
			// CTRL-A	65+17	select all
			// CTRL-Q	65+81	close filebrowser
			// CTRL-F	65+70	open filebrowser	$$ only after first run
			// left		37
			// up		38
			// right	39
			// down		40
			oSettings.keys = [];
			$(window).keydown(function(e){
				oSettings.keys[e.keyCode] = true;
				//
				var iNumDown = 0;
				$.each(oSettings.keys,function(i,o){if(o)iNumDown++});
				//
				// selection by char a:65 z:90
				if (iNumDown==1&&!checkRename()&&e.keyCode>=65&&e.keyCode<=90) {
					var sChar = ("abcdefghijklmnopqrstuvwxyz").substr(e.keyCode-65,1);
					var mSel = mTbB.find("tr.selected:first");
					var aTbr = mTbB.find("tr");
					var iInd = aTbr.index(mSel);
					if (iInd==-1) iInd = 0;
					var iTbr = aTbr.length;
					for (var i=1;i<iTbr;i++) {
						var mChk = $(aTbr[(i+iInd)%iTbr]);
						if (mChk.attr("id").substr(0,1).toLowerCase()==sChar) {
							mChk.mouseup(clickTr).mouseup();
							return false;
						}
					}
				}
				// single key functions
				switch (e.keyCode) {
					case 13: chooseFile(); break;
				}
				// CTRL functions
				if (oSettings.keys[17]) {
					var bReturn = false;
					switch (e.keyCode) {
						case 81: closeSFB(); break;
						case 65: mTbB.find("tr").each(function(){$(this).addClass("selected")}); break;
						case 70: if ($("#sfbrowser").length==0) $.sfb(oSettings); break;
						default: bReturn = true;
					}
					if (!bReturn) return false;
				}
				//if (e.keyCode==70&&oSettings.keys[17]) {
				//	if ($("#sfbrowser").length==0) $.sfb();
				//}
			});
			$(window).keyup(function(e){
				//trace("key: "+e.keyCode+" ")
				if (oSettings.keys[113])	renameSelected();
				if (oSettings.keys[27])		closeSFB();
				oSettings.keys[e.keyCode] = false;
				return false;
			});
			//
			//////////////////////////// plugins
			var oThis = {
				// functions
				 trace:				trace
				,openDir:			openDir
				,closeSFB:			closeSFB
				,addContextItem:	addContextItem
				,file:				file
				,lang:				lang
				,resizeWindowDown:	resizeWindowDown
				,moveWindowDown:	moveWindowDown
				,resizeWindow:		resizeWindow
				// variables
				,aPath:		aPath
				,bOverlay:	bOverlay
				,oSettings:	oSettings
				,oTree:		oTree
				,mSfb:		mSfb
			};
			$.each( oSettings.plugins, function(i,sPlugin) { $.sfbrowser[sPlugin](oThis) });
			//
			// swf uploader (timeout to ensure width and height are set)
			$("<br/>").animate({"foo":1},{
				"duration":1
				,"complete":function(){
					if (oSettings.swfupload) {
						mSfb.find("#fileio").remove();
						var mAup = mSfb.find("#sfbtopmenu a.upload");
						mAup.append("<div id=\"swfUploader\"></div>");
						swfobject.embedSWF(
							 oSettings.sfbpath+"uploader.swf"
							,"swfUploader"
							,(mAup.width()+10)+"px" // +10 accounts for padding
							,mAup.height()+"px"
							,"9.0.0",""
							,{ // flashvars
								 debug:		oSettings.debug
								,maxsize:	oSettings.maxsize
								,uploadUri:	"../"+oSettings.conn
								,action:	"sfu"
								,folder:	aPath.join("")
								,allow:		oSettings.allow.join("|")
								,deny:		oSettings.deny.join("|")
								,resize:	oSettings.resize
							},{menu:"false",wmode:"transparent"}
						);
					}
				}
			});
			//
			//////////////////////////// start
			//
			openDir(sFolder);
			openSFB();
			if (oSettings.cookie&&!bCookie) setSfbCookie();
			trace("SFBrowser open ("+oSettings.plugins+")",true);
		}
	});
	
	///////////////////////////////////////////////////////////////////////////////// private functions
	//
	// open
	function openSFB() {
		trace("sfb open");
		// animation
		mSfb.find("#fbbg").slideDown();
		mWin.slideDown("normal",resizeWindow);
		//mSfb.show();
		//mWin.show();
		//resizeWindow();
	}
	//
	// close
	function closeSFB() {
		trace("sfb close");
		// $$ remove all pending uploads
		// $$
		$("#sfbrowser #fbbg").fadeOut();
		mWin.slideUp("normal",function(){mSfb.remove();});
	}
	// sortFbTable
	function sortFbTable(nr) {
		if (nr!==null) {
			iSort = nr;
			aSort[iSort] = aSort[iSort]=="asc"?"desc":"asc";
		} else {
			if (!aSort[iSort]) aSort[iSort] = "asc";
		}
		mTbB.find("tr.folder").tsort("td:eq(0)[abbr]",{attr:"abbr",order:aSort[iSort]});
		mTbB.find("tr:not(.folder)").tsort("td:eq("+iSort+")[abbr]",{attr:"abbr",order:aSort[iSort]});
		mSfb.find("thead>tr>th>span").each(function(i,o){$(this).css({backgroundPosition:(i==iSort?5:-9)+"px "+(aSort[iSort]=="asc"?4:-96)+"px"})});
	}
	// fill list
	function fillList(contents) {
		trace("sfb fillList "+aPath);
		mTbB.children().remove();
		$("#fbpreview").html("");
		aSort = [];
		//
		var oCTree = getPath();
		oCTree.filled = true;
		//
		//
		if (oSettings.file!="") { // find selected file // #@@##@!$#@! bloody figure out why file not has ../ and base has!!!!!!!!!
			// make path class to ease the following:
			// find size of oSettings.sfbpath to pre-pop from oSettings.base (../) and substract that from oSettings.file
			var iSfbLn = 0;
			var aSfbP = oSettings.sfbpath.split("/");
			$.each(aSfbP,function(i,s){if(s!="")iSfbLn++});
			var sPth = "";
			$.each(aPath,function(i,sPath){sPth+=sPath+"///"});
			sPth = sPth.replace(/(\/+)/g,"/");
			aSPth = sPth.split("/");
			sRpth = "";
			$.each(aSPth,function(i,sPath){if(i>=iSfbLn)sRpth+=sPath+"/"});
			sRpth = sRpth.replace(/(\/+)/g,"/");
			var sSelFileName = oSettings.file.replace(sRpth,"");
			var aSeF = oSettings.file.split("/");
			var iDff = aSeF.length-aPath.length-1;
		}
		//
		$.each( contents, function(i,oFile) {
			// todo: logical operators could be better
			var bDir = (oFile.mime=="folder"||oFile.mime=="folderup");
			if ((oSettings.allow.indexOf(oFile.mime)!=-1||oSettings.allow.length===0)&&oSettings.deny.indexOf(oFile.mime)==-1||bDir) {
				if ((bDir&&oSettings.dirs)||!bDir) {
					var mTr = listAdd(oFile);
					// find selected file
					if (oSettings.file!=""&&sSelFileName==oFile.file) {
						mTr.animate({"foo":1},{ // select by timeout to prevent error
							"duration":1
							,"complete":function(){
								mTr.mouseup(clickTr).mouseup();
								oSettings.file = "";
							}
						});
					}
				}
			}
		});
		//
		if (aPath.length>1&&!oCTree.contents[".."]) listAdd({file:"..",mime:"folderup",rsize:0,size:"-",time:0,date:""});
		$("#sfbrowser thead>tr>th:eq(0)").trigger("click");
		//
		// plugin
		$.each( oSettings.plugins, function(i,sPlugin) {
			if ($.sfbrowser[sPlugin].fillList) $.sfbrowser[sPlugin].fillList(contents);
		});
		//
		if (oSettings.file!=""&&iDff>0) openDir(aSeF[aPath.length]);
	}
	// add item to list
	function listAdd(obj) {
		getPath().contents[obj.file] = obj;
		//
		var bUpload = obj.mime=="upload";
		var bFolder = obj.mime=="folder";
		var bUFolder = obj.mime=="folderup";
		var sMime = bFolder||bUFolder?oSettings.lang.folder:obj.mime;
		var sTr = "<tr id=\""+obj.file+"\" class=\""+(bFolder||bUFolder?"folder":"file")+"\">";
		sTr += "<td abbr=\""+obj.file+"\" title=\""+obj.file+"\" class=\"icon\" style=\"background-image:url("+oSettings.sfbpath+"icons/"+(oSettings.icons.indexOf(obj.mime)!=-1?obj.mime:"default")+".gif);\">"+obj.file+"</td>";
		if (bUpload) {
			sTr += "<td abbr=\"upload progress\" colspan=\"4\"><div class=\"progress\"><div></div><span>0%</span><div></td>";
			sTr += "<td><a class=\"sfbbutton cancel\" title=\""+oSettings.lang.fileUploadCancel+"\"><span>"+oSettings.lang.fileUploadCancel+"</span></a></td>";
		} else {
			sTr += "<td abbr=\""+obj.mime+"\">"+sMime+"</td>";
			sTr += "<td abbr=\""+obj.rsize+"\">"+obj.size+"</td>";
			sTr += "<td abbr=\""+obj.time+"\" title=\""+obj.date+"\">"+obj.date.split(" ")[0]+"</td>";
			var bVImg = (obj.width*obj.height)>0;
			sTr += (bHasImgs?("<td"+(bVImg?(" abbr=\""+(obj.width*obj.height)+"\""):"")+">"+(bVImg?(obj.width+"x"+obj.height+"px"):"")+"</td>"):"");
			sTr += "<td>";
			if (!(bFolder||bUFolder||bUpload)) sTr += "	<a onclick=\"\" class=\"sfbbutton preview\" title=\""+oSettings.lang.view+"\">&nbsp;<span>"+oSettings.lang.view+"</span></a>";
			if (!(bUFolder||bUpload)) sTr += "	<a onclick=\"\" class=\"sfbbutton filedelete\" title=\""+oSettings.lang.del+"\">&nbsp;<span>"+oSettings.lang.del+"</span></a>";
			sTr += "</td>";
		}
		sTr += "</tr>";
		// 
		var mTr = $(sTr).prependTo(mTbB);
		//
		//mTr.find("td").wrapInner("<div></div>");
		//$("#sfbrowser thead>tr").remove();
		//
		obj.tr = mTr;
		mTr.find("a.filedelete").click(deleteFile);
		mTr.find("a.preview").click(showFile);
		mTr.find("a.cancel").click(function(e){
				$("#swfUploader").get(0).cancelUpload($(this).parent().parent().attr("id"));
				mTr.remove();
			});
		//mTr.find("td:last").css({textAlign:"right"}); // IE fix
		mTr.folder = bFolder||bUFolder;
		if (!bUpload) {
			mTr.mouseover( function() {
				mTr.addClass("over");
			}).mouseout( function() {
				mTr.removeClass("over");
			}).mousedown( function(e) {
				mTr.mouseup( clickTr );
			}).dblclick( function(e) {
				chooseFile($(this));
			})
		}
		mTr[0].oncontextmenu = function() {
			return false;
		};
		// plugin
		$.each( oSettings.plugins, function(i,sPlugin) {
			if ($.sfbrowser[sPlugin].listAdd) $.sfbrowser[sPlugin].listAdd(obj);
		});
		return mTr;
	}
	// clickTr: left- or rightclick table row
	function clickTr(e) {
		trace("clickTr "+" "+e);
		var mTr = $(this);
		mTr.unbind("mouseup");
		var oFile = file(mTr);
		var bFolder = oFile.mime=="folder";
		var bUFolder = oFile.mime=="folderup";
		var sFile = oFile.file;
		var bRight = e.button==2;
		var mCntx = $("#sfbcontext");
		if (mTr.hasClass("uploading")) return false;
		//
		if (bRight) { // show context menu
			mCntx.slideUp("fast",function(){
				mCntx.css({left:e.clientX+1,top:e.clientY+1});
				// check context contents
				mCntx.children().css({display:"block"});
				if (bFolder||bUFolder) {
					mCntx.find("li:has(a.preview)").css({display:"none"});
					mCntx.find("li:has(a.duplicate)").css({display:"none"});
				}
				if (bUFolder) {
					mCntx.find("li:has(a.rename)").css({display:"none"});
					mCntx.find("li:has(a.filedelete)").css({display:"none"});
				}
				if (!oFile.width||!oFile.height) mCntx.find("li:has(a.resize)").css({display:"none"});
				//
				mCntx.slideDown("fast");
			});
		} else { // hide context menu
			mCntx.slideUp("fast");
		}
		//
		//if (!oSettings.keys[16]) trace("todo: shift selection");
		if (!oSettings.keys[17]) mTbB.find("tr").each(function(){if (mTr[0]!=$(this)[0]) $(this).removeClass("selected")});
		//
		// check if something is being renamed: if (no other file is being renamed & the table row is selected & file is not an up-folder & shift is not pressed & the first table cell is targeted)
		if (checkRename()[0]!=mTr[0]&&!bRight&&mTr.hasClass("selected")&&!bUFolder&&!oSettings.keys[17]&&mTr.find("td:eq(0)")[0]==e.target) {
			setTimeout(renameSelected,500,mTr); // rename with timeout to enable doubleclick (input field stops propagation)
		} else {
			if (oSettings.keys[17]&&!bRight) mTr.toggleClass("selected");
			else mTr.addClass("selected");
		}
		// selection must be in fov
		// table: Chrome, IE, Safari, Opera
		// tbody: FF
		// oSettings.file causes error for mTr.position() when not used with timout
		var mTbl = $("#fbtable");
		var iHTbl = mTbl.height();
		var iTrY = mTr.position().top;
		//trace("ehr: "+mTbB.height()+">"+iHTbl+" || "+mTbB.get(0).scrollHeight+"!="+iHTbl+"   "+iTrY);
		if (mTbB.height()>iHTbl||mTbB.get(0).scrollHeight!=iHTbl) { // body>table
			trace("jQuery.browser.mozilla: "+jQuery.browser.mozilla);
			var mScroll = jQuery.browser.mozilla?mTbB:mTbl; // scroll table or body?
			if (iTrY>iHTbl||iTrY<0) {
				var iDff = iTrY>iHTbl?(iTrY-iHTbl):(iTrY-2*mTr.height());
				mScroll.scrollTop(mScroll.scrollTop()+iDff);
				//trace("mScroll.scrollTop "+mScroll.scrollTop()+" -> "+(mScroll.scrollTop()-iDff));
			}
		}
		//
		// preview image
		if ($("#fbpreview").attr("class")!=oFile.file) {
			$("#fbpreview").html("");
			var iWprv = $("#fbpreview").width();
			var iHprv = $("#fbpreview").height();
			if (oSettings.img.indexOf(oFile.mime)!=-1) {// preview Image
				var sFuri = oSettings.sfbpath+aPath.join("")+sFile; // todo: cleanup img path
				$("<img src=\""+sFuri+"\" />").appendTo("#fbpreview").click(function(){$(this).parent().toggleClass("auto")});
			} else if (oSettings.ascii.indexOf(oFile.mime)!=-1) {// preview ascii
				if (oFile.preview) {
					$("#fbpreview").html(oFile.preview);
				} else {
					$("#fbpreview").html(oSettings.lang.previewText);
					$.ajax({type:"POST", url:oSettings.conn, data:"a=mizu&folder="+aPath.join("")+"&file="+sFile, dataType:"json", success:function(data, status){
							if (typeof(data.error)!="undefined") {
							if (data.error!="") {
								trace("sfb error: "+lang(data.error));
								alert(lang(data.error));
							} else {
								trace(lang(data.msg));
								oFile.preview = "<pre><div>"+oSettings.lang.previewPart.replace("#1",oSettings.preview)+"</div>\n"+data.data.text.replace(/\>/g,"&gt;").replace(/\</g,"&lt;")+"</pre>";
								$("#fbpreview").html(oFile.preview);
							}
						}
					}});
				}
			} else if (oFile.mime=="swf"||oFile.mime=="fla") {// preview flash
				$("#fbpreview").html("<div id=\"previewFlash\"></div>");
				swfobject.embedSWF(
					 oSettings.sfbpath+aPath.join("")+sFile
					,"previewFlash"
					,iWprv+"px"
					,iHprv+"px"
					,"9.0.0","",{},{menu:"false"}
				);
			} else if (oSettings.movie.indexOf(oFile.mime)!=-1) {// preview movie
				$("#fbpreview").html("<div id=\"previewMovie\"></div>");
				var sFuri = oSettings.sfbpath+aPath.join("")+sFile; // todo: cleanup img path
				var sMdPt = oFile.mime=="mp3"?"":"../../"; // todo: extract path from sfbpath
				swfobject.embedSWF(
					 oSettings.sfbpath+"css/splayer.swf"
					,"previewMovie"
					,iWprv+"px"
					,iHprv+"px"
					,"9.0.0"
					,""
					,{ //flashvars
						 file:		sMdPt+sFuri
						,width:		iWprv
						,height:	iHprv
						,gui:		"playpause,scrubbar"
						,guiOver:	true
						,colors:	'{"bg":"0xFFDEDEDE","bg1":"0xFFBBBBBB","fg":"0xFF666666","fg1":"0xFFD13A3A"}'
					},{ // params
						 menu:	"false"
					}
				);
			}
			$("#fbpreview").attr("class",$("#fbpreview").html()==""?"":oFile.file);
		}

		//
		return false;
	}
	// chooseFile
	function chooseFile(el) {
		var a = 0;
		var aSelected = mTbB.find("tr.selected");
		var aSelect = [];
		// find selected trs and possible parsed element
		aSelected.each(function(){aSelect.push(file(this))});
		if (el&&el.find) aSelect.push(file(el));
		// check if selection contains directory
		for (var i=0;i<aSelect.length;i++) {
			var oFile = aSelect[i];
			if (oFile.mime=="folder") {
				openDir(oFile.file);
				return false;
			} else if (oFile.mime=="folderup") {
				openDir();
				return false;
			}
		}
		aSelect = unique(aSelect);
		// return clones, not the objects
		for (var i=0;i<aSelect.length;i++) {
			var oFile = aSelect[i];
			var oDupl = new Object();
			for (var p in oFile) oDupl[p] = oFile[p];
			aSelect[i] = oDupl;
		}
		// return
		if (aSelect.length==0) {
			alert(oSettings.lang.fileNotselected);
		} else {
			if (oSettings.cookie) setSfbCookie();
			$.each(aSelect,function(i,oFile){oFile.file = sReturnPath+aPath.join("").replace(oSettings.base,"")+oFile.file;});// todo: correct path
			oSettings.select(aSelect);
			if (bOverlay) closeSFB();
		}
	}
	///////////////////////////////////////////////////////////////////////////////// actions
	//
	// open directory
	function openDir(dir) {
		trace("sfb openDir "+dir+" to "+oSettings.conn);
		if (dir) dir = String(dir+"/").replace(/(\/+)/gi,"/");
		if (!dir||aPath[aPath.length-1]!=dir) {
			if (dir)	aPath.push(dir);
			else		aPath.pop();
			//
			var oCTree = getPath();
			if (oCTree.filled) { // open cached directory
				fillList(oCTree.contents);
			} else { // open directory with php callback
				mTbB.html(mTrLoading);
				$.ajax({type:"POST", url:oSettings.conn, data:"a=chi&folder="+aPath.join(""), dataType:"json", success:function(data, status){
					if (typeof(data.error)!="undefined") {
						if (data.error!="") {
							trace(lang(data.error));
							alert(lang(data.error));
						} else {
							trace(lang(data.msg));
							fillList(data.data);
						}
					}
				}});
			}
			// plugin
			$.each( oSettings.plugins, function(i,sPlugin) {
				if ($.sfbrowser[sPlugin].openDir) $.sfbrowser[sPlugin].openDir(dir);
			});
		}
	}
	// duplicate file
	function duplicateFile(el) {
		var oFile = file(el);
		var sFile = oFile.file;
		//
		trace("sfb Sending duplication request...");
		$.ajax({type:"POST", url:oSettings.conn, data:"a=kung&folder="+aPath.join("")+"&file="+sFile, dataType:"json", success:function(data, status){
			if (typeof(data.error)!="undefined") {
				if (data.error!="") {
					trace(lang(data.error));
					alert(lang(data.error));
				} else {
					trace(lang(data.msg));
					listAdd(data.data).trigger('click');
				}
			}
		}});
	}
	// show
	function showFile(e) {
		var mTr = $(e.target).parent().parent();
		var oFile = file(mTr);
		//trace(oSettings.conn+"?a=sui&file="+aPath.join("")+obj.file);
		window.open(oSettings.conn+"?a=sui&file="+aPath.join("")+oFile.file,"_blank");
	}
	// delete
	function deleteFile(e) {
		var mTr = $(e.target).parent().parent();
		var oFile = file(mTr);
		var bFolder = oFile.mime=="folder";
		//
//		for (var sProp in e) trace("sProp: "+sProp+" "+e[sProp]);
//		trace("asdf: "+e.target+" "+$(e.target).parent().parent().attr("id"));
//		trace("qwer: "+this+" "+$(this).attr("class"));
		//
		if (confirm(bFolder?oSettings.lang.confirmDeletef:oSettings.lang.confirmDelete)) {
			$.ajax({type:"POST", url:oSettings.conn, data:"a=ka&folder="+aPath.join("")+"&file="+oFile.file, dataType:"json", success:function(data, status){
				if (typeof(data.error)!="undefined") {
					if (data.error!="") {
						trace(lang(data.error));
						alert(lang(data.error));
					} else {
						trace(lang(data.msg));
						$("#fbpreview").html("");
						//
						delete getPath().contents[oFile.file];
						//
						mTr.remove();
					}
				}
			}});
		}
		e.stopPropagation();
	}
	// rename
	function renameSelected(e) {
//		trace("renameSelected "+e);
//		trace(e);
		var oFile = file(e);
//		trace("oFile "+" "+oFile);
		if (oFile) {
			var mStd = oFile.tr.find("td:eq(0)");
			mStd.html("");
			$("<input type=\"text\" value=\""+oFile.file+"\" />").appendTo(mStd).click(stopEvt).dblclick(stopEvt).mousedown(stopEvt);
		}
	}
	function checkRename() {
		var aRenamed = mTbB.find("tr>td>input");
		if (aRenamed.length>0) {
			var mInput = $(aRenamed[0]);
			var mTd = mInput.parent();
			var mTr = mTd.parent();
			//
			var oFile = file(mTr);
			//
			var sFile = oFile.file;
			var sNFile = mInput.val();

			if (sFile==sNFile) {
//				mInput.parent().html(sFile.length>20?sFile.substr(0,15)+"(...)":sFile);
				mInput.parent().html(sFile);
			} else {
				$.ajax({type:"POST", url:oSettings.conn, data:"a=ho&folder="+aPath.join("")+"&file="+sFile+"&nfile="+sNFile, dataType:"json", success:function(data, status){
					if (typeof(data.error)!="undefined") {
						if (data.error!="") {
							trace(lang(data.error));
							alert(lang(data.error));
						} else {
							trace(lang(data.msg));
//							mTd.html(sNFile.length>20?sNFile.substr(0,15)+"(...)":sNFile).attr("title",sNFile).attr("abbr",sNFile);
							mTd.html(sNFile);
							oFile.file = sNFile;
						}
					}
				}});
			}
		}
		return mTr?mTr:false;
	}
	// add folder
	function addFolder() {
		trace("sfb addFolder");
		$.ajax({type:"POST", url:oSettings.conn, data:"a=tsuchi&folder="+aPath.join("")+"&foldername="+oSettings.lang.newfolder, dataType:"json", success:function(data, status){
			if (typeof(data.error)!="undefined") {
				if (data.error!="") {
					trace(lang(data.error));
					alert(lang(data.error));
				} else {
					trace(lang(data.msg));
					listAdd(data.data).trigger('click').trigger('click');
					sortFbTable(); // todo: fix scrolltop below because because of
					$("#sfbrowser #fbtable").scrollTop(0);	// IE and Safari
					mTbB.scrollTop(0);		// Firefox
				}
			}
		}});
	}
	// fileUpload
	function fileUpload() {
		var sFile = mSfb.find("#fileToUpload").val();
		trace("sfb fileUpload "+sFile);
		if (sFile=="") return false;
		//
		// check for existing same files
		var sFileName = sFile.split("\\").pop();
		var oExists = getPath().contents[sFileName];
		if (oExists&&!confirm(oSettings.lang.fileExistsOverwrite)) return false;
		//
		// upload bar
		$("#loadbar").ajaxStart(function(){
			trace("");
			$(this).show();
			loading();
		}).ajaxComplete(function(){
			$(this).hide();
		});
		//
		// ajax upload
		ajaxFileUpload({ // fu
			url:			oSettings.conn,
			secureuri:		false,
			fileElementId:	"fileToUpload",
			dataType:		"json",
			success: function (data, status) {
				if (typeof(data.error)!="undefined") {
					if (data.error!="") {
						trace("sfb error: "+lang(data.error));
						alert(lang(data.error));
					} else {
						if (oExists) oExists.tr.remove();
						listAdd(data.data).trigger('click');
						sortFbTable(); // todo: fix scrolltop below because because of
						$("#sfbrowser #fbtable").scrollTop(0);	// IE and Safari
						mTbB.scrollTop(0);		// Firefox
					}
					return false; // otherwise upload stays open...
				}
			},
			error: function (data, status, e){
				trace(e);
			}
		});
		return false;
	}
	// loading
	function loading() {
		var iPrgMove = Math.ceil((new Date()).getTime()*.3)%512;
		$("#loadbar>div").css("backgroundPosition", "0px "+iPrgMove+"px");
		$("#loadbar:visible").each(function(){setTimeout(loading,20);});
	}
	///////////////////////////////////////////////////////////////////////////////// misc methods
	//
	// get file object from tr
	function file(tr) {
		if (!tr) tr = mTbB.find("tr.selected:first");
		return getPath().contents[$(tr).attr("id")];
	}
	// find folder in oTree
	function getPath() {
		var oCTree = oTree;
		$.each(aPath,function(i,sPath){
			if (!oCTree[sPath]) oCTree[sPath] = {contents:{},filled:false};
			oCTree = oCTree[sPath];
		});
		return oCTree;
	}
	// addContextItem
	function addContextItem(className,title,fnc,after) {
		if (after===undefined) $("<li><a class=\"textbutton "+className+"\" title=\""+title+"\"><span>"+title+"</span></a></li>").appendTo("ul#sfbcontext").find("a").click(fnc).click(function(){$("#sfbcontext").slideUp("fast")});
		else $("<li><a class=\"textbutton "+className+"\" title=\""+title+"\"><span>"+title+"</span></a></li>").insertAfter("ul#sfbcontext>li:eq("+after+")").find("a").click(fnc).click(function(){$("#sfbcontext").slideUp("fast")});
	}
	// lang
	function lang(s) {
		var aStr = s.split("#");
		sReturn = oSettings.lang[aStr[0]]?oSettings.lang[aStr[0]]:s;
		if (aStr.length>1) for (var i=1;i<aStr.length;i++) sReturn = sReturn.replace("#"+i,aStr[i]);
		return sReturn;
	}
	// clearObject
	function clearObject(o) {
		for (var sProp in o) delete o[sProp];
	}
	// is numeric
	function isNum(n) {
		return (parseFloat(n)+"")==n;
	}
	// trace
	function trace(o,v) {
		if ((v||oSettings.debug)&&window.console&&window.console.log) {
			if (typeof(o)=="string")	window.console.log(o);
			else						for (var prop in o) window.console.log(prop+":\t"+String(o[prop]).split("\n")[0]);
		}
	}
	// stop event propagation
	function stopEvt(e) {
		e.stopPropagation();
	}
	////////////////////////////////////////////////////////////////////////////
	// resizing
	//
	// resizeBrowser
	function resizeBrowser() {
		if ($("#sfbrowser").length>0) {
			iBrW = $(window).width();
			iBrH = $(window).height();
			if (bOverlay) {
				var oPos = mWin.position();
				var iRbX = oPos.left;
				var iRbW = mWin.width();
				var iRbY = oPos.top;
				var iRbH = mWin.height();
				if ((iRbX+iRbW)>iBrW) {
					var iRbX = iBrW-iRbW;
					if (iRbX<0) {
						iRbW = Math.max(iWinMaxW,iRbW+iRbX);
						iRbX = 0;
					}
				}
				if ((iRbY+iRbH)>iBrH) {
					var iRbY = iBrH-iRbH;
					if (iRbY<0) {
						iRbH = Math.max(iWinMaxH,iRbH+iRbY);
						iRbY = 0;
					}
				}
				if (iRbX!=oPos.left||iRbY!=oPos.top) moveWindow(null,iRbX,iRbY);
				if (iRbW<mWin.width()||iRbH<mWin.height()) resizeWindow(null,iRbW,iRbH);
			}
		}
	}
	// window
	function unbindBody(e) {
		$("body").unbind("mousemove");
		$("body").unbind("mouseup");
		if (oSettings.cookie) setSfbCookie();
	}
	// moveWindow
	function moveWindowDown(e) {
		var iXo = e.pageX-$(e.target).offset().left;
		var iYo = e.pageY-$(e.target).offset().top;
		$("body").mousemove(function(e){
			moveWindow(e,iXo,iYo);
		});
		$("body").mouseup(unbindBody);
	}
	function moveWindow(e,xo,yo) {
		var mHd = $(".sfbheader>h3");
		var mPrn = $("#fbbg");
		var iXps = e?Math.max(0,Math.min(iBrW-mWin.width(),e.pageX-xo-mPrn.offset().left)):xo;
		var iYps = e?Math.max(0,Math.min(iBrH-mWin.height(),e.pageY-yo-mPrn.offset().top)):yo;
		mWin.css({left:iXps+"px",top:iYps+"px"});
	}
	// resizeWindow
	function resizeWindowDown(e) {
		var iXo = e.pageX-$(e.target).offset().left;
		var iYo = e.pageY-$(e.target).offset().top;
		$("body").mousemove(function(e){
			resizeWindow(e,iXo,iYo);
		});
		$("body").mouseup(unbindBody);
	}
	function resizeWindow(e,xo,yo) {
		var iWdt, iHgt;
		if (e) {
			var oSPos = mSfb.position();
			var oWPos = mWin.position();
			iWdt = Math.max(iWinMaxW,Math.min(iBrW,e.pageX+xo-(oWPos.left+oSPos.left)));
			iHgt = Math.max(iWinMaxH,Math.min(iBrH,e.pageY+yo-(oWPos.top+oSPos.top)));
			mWin.css({width:iWdt+"px",height:iHgt+"px"});
		} else {
			iWdt = xo?xo:mWin.width();
			iHgt = yo?yo:mWin.height();
			mWin.css({width:iWdt+"px",height:iHgt+"px"});
		}
		$("#sfbrowser div#fbtable").css({height:(iHgt-230+$("#sfbrowser table>thead").height())+"px"});
		mTbB.css({height:(iHgt-230)+"px"});
		//
		var mTblDiv = $("#sfbrowser div#fbtable");
		var mTable = $("#sfbrowser table");
		if (mTable.width()>mTblDiv.width()) $("#sfbrowser table tr ").width(mTblDiv.width());
		$.each( oSettings.plugins, function(i,sPlugin) {
			if ($.sfbrowser[sPlugin].resizeWindow) $.sfbrowser[sPlugin].resizeWindow(iWdt,iHgt);
		});
	}
	// setSfbCookie
	function setSfbCookie() {
		var mBg = $("#fbbg");
		var oBPos = mBg.position();
		var oPos = mWin.position();
		var sCval = "{"
		sCval += "\"path\":[\""+aPath.toString().replace(/,/g,"\",\"")+"\"]";
		if (bOverlay) {
			sCval += ",\"x\":"+(oPos.left-oBPos.left);
			sCval += ",\"y\":"+(oPos.top-oBPos.top);
			sCval += ",\"w\":"+mWin.width();
			sCval += ",\"h\":"+mWin.height();
		}
		sCval += "}";
		trace("sCval "+" "+sCval);
		createCookie($.sfbrowser.id,sCval,356);
	}
	//////////////////////
	//
	// cookie functions
	//
	function createCookie(name,value,days) {
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else var expires = "";
		document.cookie = 	name+"="+value+expires+"; path=/";
	}
	function readCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}
	function eraseCookie(name) {
		createCookie(name,"",-1);
	}

	////////////////////////////////////////////////////////////////
	//
	// here starts copied functions from http://www.phpletter.com/Demo/AjaxFileUpload-Demo/
	// - changed iframe and form creation to jQuery notation
	//
	function ajaxFileUpload(s) {
		trace("sfb ajaxFileUpload");
        // todo: introduce global settings, allowing the client to modify them for all requests, not only timeout		
        s = jQuery.extend({}, jQuery.ajaxSettings, s);
		//
        var iId = new Date().getTime();
		var sFrameId = "jUploadFrame" + iId;
		var sFormId = "jUploadForm" + iId;
		var sFileId = "jUploadFile" + iId;
		//
		// create form
		var mForm = $("<form  action=\"\" method=\"POST\" name=\"" + sFormId + "\" id=\"" + sFormId + "\" enctype=\"multipart/form-data\"><input name=\"a\" type=\"hidden\" value=\"fu\" /><input name=\"folder\" type=\"hidden\" value=\""+aPath.join("")+"\" /><input name=\"allow\" type=\"hidden\" value=\""+oSettings.allow.join("|")+"\" /><input name=\"deny\" type=\"hidden\" value=\""+oSettings.deny.join("|")+"\" /><input name=\"resize\" type=\"hidden\" value=\""+oSettings.resize+"\" /></form>").appendTo('body').css({position:"absolute",top:"-1000px",left:"-1000px"});
		$("#"+s.fileElementId).before($("#"+s.fileElementId).clone(true).val("")).attr('id', s.fileElementId).appendTo(mForm);
		//
		// create iframe
		var mIframe = $("<iframe id=\""+sFrameId+"\" name=\""+sFrameId+"\"  src=\""+(typeof(s.secureuri)=="string"?s.secureuri:"javascript:false")+"\" />").appendTo("body").css({position:"absolute",top:"-1000px",left:"-1000px"});
		var mIframeIO = mIframe[0];
		//
        // Watch for a new set of requests
        if (s.global&&!jQuery.active++) jQuery.event.trigger("ajaxStart");
        var requestDone = false;
        // Create the request object
        var xml = {};
        if (s.global) jQuery.event.trigger("ajaxSend", [xml, s]);
        // Wait for a response to come back
        var uploadCallback = function(isTimeout) {			
			var mIframeIO = document.getElementById(sFrameId);
            try {				
				if(mIframeIO.contentWindow) {
					xml.responseText = mIframeIO.contentWindow.document.body?mIframeIO.contentWindow.document.body.innerHTML:null;
					xml.responseXML = mIframeIO.contentWindow.document.XMLDocument?mIframeIO.contentWindow.document.XMLDocument:mIframeIO.contentWindow.document;
				} else if(mIframeIO.contentDocument) {
					xml.responseText = mIframeIO.contentDocument.document.body?mIframeIO.contentDocument.document.body.innerHTML:null;
                	xml.responseXML = mIframeIO.contentDocument.document.XMLDocument?mIframeIO.contentDocument.document.XMLDocument:mIframeIO.contentDocument.document;
				}						
            } catch(e) {
				jQuery.handleError(s, xml, null, e);
			}
            if (xml||isTimeout=="timeout") {				
                requestDone = true;
                var status;
                try {
                    status = isTimeout != "timeout" ? "success" : "error";
                    // Make sure that the request was successful or notmodified
                    if (status!="error") {
                        // process the data (runs the xml through httpData regardless of callback)
                        var data = uploadHttpData(xml, s.dataType);    
                        // If a local callback was specified, fire it and pass it the data
                        if (s.success) s.success(data, status);
                        // Fire the global callback
                        if (s.global) jQuery.event.trigger("ajaxSuccess", [xml, s]);
                    } else {
                        jQuery.handleError(s, xml, status);
					}
                } catch(e) {
                    status = "error";
                    jQuery.handleError(s, xml, status, e);
                }

                // The request was completed
                if (s.global) jQuery.event.trigger("ajaxComplete", [xml, s]);

                // Handle the global AJAX counter
                if (s.global && ! --jQuery.active) jQuery.event.trigger("ajaxStop");

                // Process result
                if (s.complete) s.complete(xml, status);

				mIframe.unbind();

                setTimeout(function() {
					try {
						mIframe.remove();
						mForm.remove();
					} catch(e) {
						jQuery.handleError(s, xml, null, e);
					}
				}, 100);

                xml = null;
            }
        };
        // Timeout checker // Check to see if the request is still happening
        if (s.timeout>0) setTimeout(function() { if (!requestDone) uploadCallback("timeout"); }, s.timeout);
        
        try {
			mForm.attr("action", s.url).attr("method", "POST").attr("target", sFrameId).attr("encoding", "multipart/form-data").attr("enctype", "multipart/form-data").submit();
        } catch(e) {			
            jQuery.handleError(s, xml, null, e);
        }
		mIframe.load(uploadCallback);
        return {abort: function () {}};
    }
	function uploadHttpData(r, type) {
        var data = !type;
        data = type=="xml" || data?r.responseXML:r.responseText;
        // If the type is "script", eval it in global context
        if (type=="script")	jQuery.globalEval(data);
        // Get the JavaScript object, if JSON is used.
        if (type=="json")	eval("data = " + data);
        // evaluate scripts within html
        if (type=="html")	jQuery("<div>").html(data).evalScripts();
		//alert($('param', data).each(function(){alert($(this).attr('value'));}));
        return data;
    }
	// set functions
	$.sfb = $.fn.sfbrowser;
})(jQuery);

// opera $(window).height() bugfix for jQuery 1.2.6
var height_ = jQuery.fn.height;
jQuery.fn.height = function() {
    if ( this[0] == window && jQuery.browser.opera && jQuery.browser.version >= 9.50)
        return window.innerHeight;
    else return height_.apply(this,arguments);
};

// functional equivalents for these prototypes
//Array.prototype.unique=function(){var a=[],i;this.sort();for(i=0;i<this.length;i++){if(this[i]!==this[i+1]){a[a.length]=this[i];}}return a;}
function unique(b) { var a=[],i; b.sort(); for(i=0;i<b.length;i++) if(b[i]!==b[i+1]) a[a.length]=b[i]; return a; }
//if(typeof Array.prototype.copy==='undefined'){Array.prototype.copy=function(a){var a=[],i=this.length;while(i--){a[i]=(typeof this[i].copy!=='undefined')?this[i].copy():this[i];}return a;};}
function copy(b) { var a=[],i = b.length; while (i--) a[i] = b[i].constructor===Array?copy(b[i]):b[i]; return a; }
// $$ fucking IE forces prototype... oh well...
if (!Array.indexOf) Array.prototype.indexOf=function(n){for(var i=0;i<this.length;i++){if(this[i]===n){return i;}}return -1;}


function format_size(size,round) {
	if (!round) round = 0;
    aSize = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    for (var i=0;size>1024&&aSize.length>i;i++) size /= 1024;
    return Math.round(size,round)+aSize[i];
}