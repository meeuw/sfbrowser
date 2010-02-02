;(function($) {
	//
	// data from sfbrowser
	// functions
	var trace;
	var file;
	var lang;
	var onError;
	var listAdd;
	// variables
	var aPath;
	var oSettings;
	var oTree;
	var mSfb;
	var oReg;
	var oThis;
	//
	// private vars
	var oFile;
	var mBut;
	var mAsc;
	var mNme; // input.text for name
	var mExt; // select for extension
	var mCnt; // textarea for contents
	var sCntOr; // original contents
	var mContextItem;
	var bNewOrEdit;
	var sConnector;
	//
	$.fn.extend($.sfbrowser, {
		createascii: function(p) {
			trace = p.trace;
			file = p.file;
			lang = p.lang;
			onError = p.onError;
			addContextItem = p.addContextItem;
			aPath = p.aPath;
			oTree = p.oTree;
			oSettings = p.oSettings;
			mSfb = p.mSfb;
			oReg = p.oReg;
			moveWindowDown = p.moveWindowDown;
			listAdd = p.listAdd;
			//
			sConnector = oSettings.sfbpath+"plugins/createascii/connectors/"+oSettings.connector+"/createascii."+oSettings.connector;
			//
			var sHtml = "<div>"+oSettings.createascii+"</div>";
			var oHtml = $(sHtml);
			//
			mBut = oHtml.find(">ul>li:first").prependTo(mSfb.find("#sfbtopmenu")).click(openCreateascii);
			mBut.find("a>span").text(oSettings.lang.asciiFileNew);
			//
			mAsc = oHtml.find("#sfbcreateascii").appendTo(mSfb.find("#fbwin")).hide();
			mAsc.find(".cancel").click(closeCreateascii);
			mAsc.find(".submit").click(submitCreateascii);

			mNme = mAsc.find("input");
			mExt = mAsc.find("select");
			mCnt = mAsc.find("textarea");
			//
			// labels
			mAsc.find("label[for=filename]").text(oSettings.lang.filename+": ");
			mAsc.find("label[for=fileext]").text(oSettings.lang.filetype+": ");
			mAsc.find("label[for=filecont]").text(oSettings.lang.contents+": ");
			//
			// add mime types
			$(oSettings.ascii).each(function(i,o){
				if (oSettings.deny.indexOf(0)<0) mExt.append("<option value=\""+o+"\">&nbsp; "+o+"</option>");
			});
			//
			// header
			mAsc.find("div.sfbheader>h3").mousedown(moveWindowDown);
			//
			// add contextmenu item
			mContextItem = addContextItem("editascii",oSettings.lang.asciiFileSave,function(){openCreateascii()},0);
//			//$.sfbrowser.createascii.resizeWindow(123,123); //$$ causes IE error : functions are probably not inited yet
		}
	});
	$.extend($.sfbrowser.createascii, {
		resizeWindow: function(iWdt,iHgt) {
			mCnt.width(iWdt-30).height(iHgt-mCnt.position().top-45);
		}
		,checkContextItem: function(oFile) {
			mContextItem.css({display:oSettings.ascii.indexOf(oFile.mime)>=0?"block":"none"});
		}
	});
	function openCreateascii(e) {
		bNewOrEdit = e!=null;
		// set txt
		mAsc.find("h3").text(bNewOrEdit?oSettings.lang.asciiFileNew:oSettings.lang.asciiFileSave);
		mAsc.find(".submit").text(bNewOrEdit?oSettings.lang.create:oSettings.lang.save);
		//
		if (bNewOrEdit) {
			mCnt.text("");
			oFile = null;
		} else {
			oFile = file();
			$.ajax({type:"POST", url:sConnector, data:"a=cont&folder="+aPath.join("")+"&file="+oFile.file, dataType:"json", success:function(data, status){//, error:onError
				if (typeof(data.error)!="undefined") {
					if (data.error!="") alert(lang(data.error));
					else				mCnt.text(data.data.text);
				}
			}});
		}
		//
		//
		var oShow = {display:bNewOrEdit?"inline":"none"}
		$("[for=filename],[for=fileext],[name=filename],[name=fileext]").css(oShow);
		//mNme.css(oShow);
		//mExt.css(oShow);
		//
		$("#winbrowser").hide();
		mAsc.show();
//		$("#resizer").mousedown().mouseup();
//			mSfb.resizeBrowser();
//			mSfb.resizeWindow();
//		oSettings.lang.editascii
//		mAsc.show(0,$.sfbrowser.resizeWindow);
//		mAsc.show(0,resizeWindow);
//		$.sfbrowser.createascii.resizeWindow();
	}
	function closeCreateascii(e) {
		mAsc.hide();
		$("#winbrowser").show();
//		$("#resizer").mousedown().mouseup();
//			mSfb.resizeBrowser();
//			mSfb.resizeWindow();
	}
	function submitCreateascii(e) {
		var sNme = mNme.val();
		var sExt = mExt.val();
		var sCnt = mCnt.val();
		var sFNme = sNme+"."+sExt;
		var bProceed = true;
		if (bNewOrEdit) {
			if (sNme==""||sNme.match(oReg.fileNameNoExt)) {
				alert(oSettings.lang.axciiFileNameInvalid);
				bProceed = false;
			}
		} else {
			if (sCntOr==sCnt) {
				trace("No changes were made.");
				closeCreateascii();
				bProceed = false;
			}
		}
		if (bProceed) {
			var sSend = "a="+(bNewOrEdit?"new":"edit")+"&folder="+aPath.join("")+"&file="+(bNewOrEdit?sFNme:oFile.file)+"&contents="+sCnt;
			$.ajax({type:"POST", url:sConnector, data:sSend, dataType:"json", error:onError, success:function(data, status){
				if (typeof(data.error)!="undefined") {
					if (data.error!="") {
						alert(lang(data.error));
					} else {
						if (data.data.file)	listAdd(data.data,1);
						closeCreateascii();
					}
				}
			}});
		}
	}
})(jQuery);