<?php
/*
* jQuery SFBrowser 2.5.3
* Copyright (c) 2008 Ron Valstar http://www.sjeiti.com/
* Dual licensed under the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*/
// JSON return strings
$sErr = "";
$sMsg = "";
$sData = "";
//
// basepath
$sConnBse = "../../../../";
include($sConnBse."connectors/php/config.php");
include($sConnBse."connectors/php/functions.php");
include("config.php");
//
// security file checking
$aVldt = validateInput($sConnBse,array(
	 "bar"=>	array(0,9,0)
));
$sAction = $aVldt["action"];
$sSFile = $aVldt["file"];
$sErr .= $aVldt["error"];
//
switch ($sAction) {
	case "bar": // image resize
		$iScW = intval($_POST["w"]);
		$iScH = intval($_POST["h"]);
		$iCrX = intval($_POST["cx"]);
		$iCrY = intval($_POST["cy"]);
		$iCrW = intval($_POST["cw"]);
		$iCrH = intval($_POST["ch"]);
		list($iW,$iH) = getimagesize($sSFile);
		$fScl = $iW/$iScW;
		$iFrX = intval($fScl*$iCrX);
		$iFrY = intval($fScl*$iCrY);
		$iFrW = intval($fScl*$iCrW);
		$iFrH = intval($fScl*$iCrH);
		$oImgN = imagecreatetruecolor($iCrW,$iCrH);
		$oImg = imagecreatefromjpeg($sSFile);
		imagecopyresampled($oImgN,$oImg, 0,0, $iFrX,$iFrY, $iCrW,$iCrH, $iFrW,$iFrH );
		if (imagejpeg($oImgN, $sSFile)) $sMsg .= "imgResized";
		else							$sERR .= "imgNotresized";
	break;
}
echo "{error: \"".$sErr."\", msg: \"".$sMsg."\", data: {".$sData."}}";