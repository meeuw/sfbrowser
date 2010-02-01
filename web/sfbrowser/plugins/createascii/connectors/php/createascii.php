<?php
/*
* jQuery SFBrowser 3.1.0
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
//include("config.php");
//
// security file checking
$aVldt = validateInput($sConnBse,array(
	 "new"=>	array(0,4,0)
	,"edit"=>	array(0,4,0)
	,"cont"=>	array(0,3,0)
));
$sAction = $aVldt["action"];
$sSFile = $aVldt["file"];
$sErr .= $aVldt["error"];
if (isset($_POST["contents"])) $sContents = $_POST["contents"];//$aVldt["contents"];//$_POST["contents"];
//
switch ($sAction) {
	case "new":
		if (file_exists($sSFile)) {
			$sErr .= "File exists";
		} else {
			$oFile = fopen($sSFile, "w");
			fputs ($oFile, stripslashes($sContents) );
			fclose($oFile);
			chmod($sSFile,0644);
			$oFNfo = fileInfo($sSFile);
			$sData = $oFNfo["stringdata"];
			$sMsg .= "new file created ... almost that is ... ";
		}
	break;
	case "edit":
		if (file_exists($sSFile)) {
			$oFile = fopen($sSFile, "w");
			fputs ($oFile, stripslashes($sContents) );
			fclose($oFile);
			$sMsg .= "File edited";
		} else {
			$sErr .= "File could not be found";
		}
	break;
	case "cont":
		$oHnd = fopen($sSFile, "r");
		$sCnt = preg_replace(array("/\n/","/\r/","/\t/"),array("\\n","\\r","\\t"),addslashes(fread($oHnd, max(1,filesize($sSFile)) )));
		fclose($oHnd);
		$sData .= '"text":"'.$sCnt.'"';
		$sMsg .= "contentsSucces";
	break;
}
echo '{"error":"'.$sErr.'","msg":"'.$sMsg.'","data":{'.$sData.'}}';