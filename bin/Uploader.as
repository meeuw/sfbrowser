package {
	import flash.events.*;
	import flash.display.*;
	import flash.external.ExternalInterface;
	import nl.ronvalstar.net.FileUpload;
	public class Uploader extends Sprite {
		private var oFu:FileUpload;
		public function Uploader() {
			//
			stage.align = StageAlign.TOP_LEFT;
			stage.scaleMode = StageScaleMode.NO_SCALE;
			stage.quality = StageQuality.LOW;
			//
			var mBg:Sprite = Sprite(this.addChild(new Sprite()));
			mBg.graphics.beginFill(0xFF0000,.4);
			mBg.graphics.drawRect(0,0,stage.stageWidth,stage.stageHeight);
			mBg.graphics.endFill();
			mBg.mouseEnabled = mBg.useHandCursor = true;
			mBg.addEventListener(MouseEvent.CLICK,findFile);
			//
			oFu = new FileUpload();
			trace("FileUpload "+oFu);
			ExternalInterface.call("$sfbrowser.s(\""+Math.random()+"\")");
			ExternalInterface.addCallback("findFile", findFile);
		}
		private function findFile(e:MouseEvent):void {
			trace("findFile "+findFile);
			oFu.findFile();
		}
	}
}