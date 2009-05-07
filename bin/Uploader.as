package {
	//
	import flash.net.*;
	import flash.events.*;
	import flash.display.*;
	import flash.external.ExternalInterface;
	//
	public class Uploader extends Sprite {
		//
		private var oFRef:FileReference;
		private var aTypeFilter:Array = new Array();
		private var oQue:Object = new Object();
		//
		// flashvar data
		private var iMaxSize:uint = 2097152;
		private var sUploadUri:String = "";
		private var sAction:String = "";
		private var sFolder:String = "";
		private var sAllow:String = "";
		private var sDeny:String = "";
		private var sResize:String = "";
		//
		public function Uploader() {
			trace("Uploader");
			stage.align = StageAlign.TOP_LEFT;
			stage.scaleMode = StageScaleMode.NO_SCALE;
			stage.quality = StageQuality.LOW;
			//
			// get data from flashvars
			var oFlashVars:Object = LoaderInfo(this.loaderInfo).parameters;
			for (var sVar:String in oFlashVars) {
				var sValue:String = String(oFlashVars[sVar]);
				switch (sVar) {
					case "maxsize":		iMaxSize = uint(sValue); break;
					case "uploadUri":	sUploadUri = sValue; break;
					case "action":		sAction = sValue; break;
					case "folder":		sFolder = sValue; break;
					case "allow":		sAllow = sValue; break;
					case "deny":		sDeny = sValue; break;
					case "resize":		sResize = sValue; break;
				}
			}
			if (sAllow!="") aTypeFilter.push(new FileFilter("SFBrowser", "*."+sAllow.replace(/\|/g,";*.")));
			//
			var mBg:Sprite = Sprite(this.addChild(new Sprite()));
			mBg.graphics.beginFill(0xFF0000,.0);
			mBg.graphics.drawRect(0,0,stage.stageWidth,stage.stageHeight);
			mBg.graphics.endFill();
			mBg.mouseEnabled = mBg.useHandCursor = true;
			mBg.addEventListener(MouseEvent.CLICK,findFile);
			//
			ExternalInterface.addCallback("setPath", setPath);
			ExternalInterface.addCallback("cancelUpload", cancelUpload);
			//
			ExternalInterface.call("$.sfbrowser.swfInit()");
		}
		//
		// PUBLIC FUNCTIONS
		//
		// setPath
		public function setPath(s:String):void {
			sFolder = s;
		}
		//
		// cancelUpload
		public function cancelUpload(s:String):void {
			trace("cancelUpload: "+s);
			var oDl:FileReference = FileReference(oQue[s]);
			oDl.cancel();
			delete(oQue[s]);
		}
		//
		// PRIVATE FUNCTIONS
		//
		// findFile
		private function findFile(e:MouseEvent):void {
			trace("findFile");
			ExternalInterface.call("$.sfbrowser.getPath()");
			//
			oFRef = new FileReference();
			// (de)activation
			//	activate			Dispatched when Flash Player gains operating system focus and becomes active. EventDispatcher
			//	deactivate			Dispatched when Flash Player loses operating system focus and is becoming inactive. EventDispatcher
			// file handling
			oFRef.addEventListener(Event.SELECT,						fileSelected);		// Dispatched when the user selects a file for upload or download from the file-browsing dialog box. FileReference
			oFRef.addEventListener(Event.OPEN,							fileOpen);			// Dispatched when an upload or download operation starts. FileReference
			oFRef.addEventListener(ProgressEvent.PROGRESS,				fileProgress);		// Dispatched periodically during the file upload or download operation. FileReference
			oFRef.addEventListener(Event.CANCEL,						fileCancel);		// Dispatched when a file upload or download is canceled through the file-browsing dialog box by the user. FileReference
			oFRef.addEventListener(Event.COMPLETE,						fileComplete);		// Dispatched when download is complete or when upload generates an HTTP status code of 200. FileReference
			oFRef.addEventListener(DataEvent.UPLOAD_COMPLETE_DATA,		fileCompleteD);		// Dispatched after data is received from the server after a successful upload.
			// error handling
			oFRef.addEventListener(HTTPStatusEvent.HTTP_STATUS,			errorHttpStatus);	// Dispatched when an upload fails and an HTTP status code is available to describe the failure. FileReference
			oFRef.addEventListener(IOErrorEvent.IO_ERROR,				errorIO);			// Dispatched when the upload or download fails. FileReference
			oFRef.addEventListener(SecurityErrorEvent.SECURITY_ERROR,	errorSecurity);		// Dispatched when a call to the FileReference.upload() or FileReference.download() method tries to upload a file to a server or get a file from a server that is outside the caller's security sandbox. FileReference
			oFRef.browse(aTypeFilter);
		}
		//
		private function fileSelected(e:Event):void {
			trace("fileSelected");
			oFRef = FileReference(e.currentTarget);
			if (oFRef.size>iMaxSize) { // file exceeds upload_max_filesize
				ExternalInterface.call("$.sfbrowser.ufileTooBig(\""+oFRef.name+"\")");
			} else if (!oQue.hasOwnProperty(oFRef.name)) {// proceed to upload
				oQue[oFRef.name] = oFRef;
				oFRef.upload(new URLRequest(uri));
				ExternalInterface.call("$.sfbrowser.ufileSelected(\""+oFRef.name+"\")");
			}
		}
		private function fileOpen(e:Event):void {
			ExternalInterface.call("$.sfbrowser.ufileOpen(\""+FileReference(e.currentTarget).name+"\")");
		}
		private function fileProgress(e:ProgressEvent):void {
			ExternalInterface.call("$.sfbrowser.ufileProgress("+e.bytesLoaded/e.bytesTotal+",\""+FileReference(e.currentTarget).name+"\")");
		}
		private function fileCancel(e:Event):void {				trace("fileCancel: "+e); }			// remove from que
		private function fileComplete(e:Event):void {			trace("fileComplete: "+e); }
		private function fileCompleteD(e:DataEvent):void {
			trace("fileCompleteD");
			delete(oQue[FileReference(e.currentTarget).name]);
			ExternalInterface.call("$.sfbrowser.ufileCompleteD("+e.data+")");
		}
		//
		// error
		private function errorHttpStatus(e:HTTPStatusEvent):void {	delete(oQue[FileReference(e.currentTarget).name]);trace("errorHttpStatus: "+e); }	// remove from que
		private function errorIO(e:IOErrorEvent):void {				delete(oQue[FileReference(e.currentTarget).name]);trace("fileComplete: "+e); }	// remove from que
		private function errorSecurity(e:SecurityErrorEvent):void {	delete(oQue[FileReference(e.currentTarget).name]);trace("errorSecurity: "+e); }	// remove from que
		//
		// uri
		private function get uri():String {
			return sUploadUri+"?a="+sAction+"&folder="+sFolder+"&allow="+sAllow+"&deny="+sDeny+"&resize="+sResize;
		}
	}
}