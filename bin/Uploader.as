package {
	import flash.net.*;
	import flash.events.*;
	import flash.display.*;
	import flash.external.ExternalInterface;
	import nl.ronvalstar.net.FileUpload;
	public class Uploader extends Sprite {
		//
		private var oFu:FileUpload;
		//
		// flashvar data
		private var bMulti:Boolean = false;
		private var sUploadUri:String = "";
		private var sAction:String = "";
		private var sFolder:String = "";
		private var sAllow:String = "";
		private var sDeny:String = "";
		private var sResize:String = "";
		//
		public function Uploader() {
			//
			stage.align = StageAlign.TOP_LEFT;
			stage.scaleMode = StageScaleMode.NO_SCALE;
			stage.quality = StageQuality.LOW;
			//
			// get data from flashvars
			var oFlashVars:Object = LoaderInfo(this.loaderInfo).parameters;
			for (var sVar:String in oFlashVars) {
				var sValue:String = String(oFlashVars[sVar]);
				switch (sVar) {
					case "multi":		bMulti = sValue=="true"; break;
					case "uploadUri":	sUploadUri = sValue; break;
					case "action":		sAction = sValue; break;
					case "folder":		sFolder = sValue; break;
					case "allow":		sAllow = sValue; break;
					case "deny":		sDeny = sValue; break;
					case "resize":		sResize = sValue; break;
				}
			}
			//
			var aTypeFilter:Array = new Array();
			if (sAllow!="") aTypeFilter.push(new FileFilter("SFBrowser", "*."+sAllow.replace(/\|/g,";*.")));
			//
			var mBg:Sprite = Sprite(this.addChild(new Sprite()));
			mBg.graphics.beginFill(0xFF0000,.4);
			mBg.graphics.drawRect(0,0,stage.stageWidth,stage.stageHeight);
			mBg.graphics.endFill();
			mBg.mouseEnabled = mBg.useHandCursor = true;
			mBg.addEventListener(MouseEvent.CLICK,findFile);
			//
			oFu = new FileUpload(uri,bMulti,aTypeFilter);
			oFu.addEventListener(Event.SELECT,fileSelected);
			oFu.addEventListener(Event.OPEN,fileOpen);
			oFu.addEventListener(ProgressEvent.PROGRESS,fileProgress);
			oFu.addEventListener(DataEvent.UPLOAD_COMPLETE_DATA,fileCompleteD);
			//
			ExternalInterface.addCallback("setPath", setPath);
			//
			ExternalInterface.call("$.sfbrowser.swfInit()");
		}
		//
		// findFile
		private function findFile(e:MouseEvent):void {
			ExternalInterface.call("$.sfbrowser.getPath()");
			oFu.findFile();
		}
		//
		//
		private function fileSelected(e:Event):void {
			trace("fileSelectede.target: "+e.target);
			trace("fileSelectede.currentTarget: "+e.currentTarget);
			ExternalInterface.call("$.sfbrowser.ufileSelected(\""+oFu.name+"\")");
		}
		private function fileOpen(e:Event):void {
			trace("fileOpene.target: "+e.target);
			trace("fileOpene.currentTarget: "+e.currentTarget);
			ExternalInterface.call("$.sfbrowser.ufileOpen(\""+oFu.name+"\")");
		}
		private function fileProgress(e:ProgressEvent):void {
			ExternalInterface.call("$.sfbrowser.ufileProgress("+e.bytesLoaded/e.bytesTotal+",\""+oFu.name+"\")");
		}
		private function fileCompleteD(e:DataEvent):void {
			ExternalInterface.call("$.sfbrowser.ufileCompleteD("+e.data+")");
		}
		//
		//
		// uri
		private function get uri():String {
			return sUploadUri+"?a="+sAction+"&folder="+sFolder+"&allow="+sAllow+"&deny="+sDeny+"&resize="+sResize;
		}
		//
		// setPath
		public function setPath(s:String):void {
			sFolder = s;
			oFu.uri = uri
		}
	}
}