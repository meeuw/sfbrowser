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
$sConnBse = "../../";
include("config.php");
include("functions.php");
//
// security file checking
$aVldt = validateInput($sConnBse,array(
	 "chi"=>	array(0,2,0)
	,"kung"=>	array(0,3,0)
	,"fu"=>		array(0,5,1)
	,"sfu"=>	array(5,2,1)
	,"ka"=>		array(0,3,0)
	,"sui"=>	array(2,0,0)
	,"mizu"=>	array(0,3,0)
	,"ho"=>		array(0,4,0)
	,"tsuchi"=>	array(0,3,0)
));
$sAction = $aVldt["action"];
$sSFile = $aVldt["file"];
$sErr .= $aVldt["error"];
if ($sErr!="") die("{error: \"".$sErr."\", msg: \"".$sMsg."\", data: {".$sData."}}");
//
function fileInfo($sFile) {
	$aRtr = array();
	$aRtr["type"] = filetype($sFile);
	$sFileName = array_pop(split("\/",$sFile));
	if ($aRtr["type"]=="file") {
		$aRtr["time"] = filemtime($sFile);
		$aRtr["date"] = date(FILETIME,$aRtr["time"]);
		$aRtr["size"] = filesize($sFile);
		$aRtr["mime"] = array_pop(split("\.",$sFile));//mime_content_type($sFile);
		//
		$aRtr["width"] = 0;
		$aRtr["height"] = 0;
		$aImgNfo = ($aRtr["mime"]=="jpeg"||$aRtr["mime"]=="jpg"||$aRtr["mime"]=="gif") ? getimagesize($sFile) : "";
		if (is_array($aImgNfo)) {
			list($width, $height, $type, $attr) = $aImgNfo;
			$aRtr["width"] = $width;
			$aRtr["height"] = $height;
		}
		$sNfo  = "file:\"".		$sFileName."\",";
		$sNfo .= "mime:\"".		$aRtr["mime"]."\",";
		$sNfo .= "rsize:".		$aRtr["size"].",";
		$sNfo .= "size:\"".		format_size($aRtr["size"])."\",";
		$sNfo .= "time:".		$aRtr["time"].",";
		$sNfo .= "date:\"".		$aRtr["date"]."\",";
		$sNfo .= "width:".		$aRtr["width"].",";
		$sNfo .= "height:".		$aRtr["height"];
		$aRtr["stringdata"] = $sNfo;
	} else if ($aRtr["type"]=="dir"&&$sFileName!="."&&$sFileName!=".."&&!preg_match("/^\./",$sFileName)) {
		$aRtr["mime"] = "folder";
		$aRtr["time"] = filemtime($sFile);
		$aRtr["date"] = date(FILETIME,$aRtr["time"]);
		$aRtr["size"] = filesize($sFile);
		$sNfo  = "file:\"".		$sFileName."\",";
		$sNfo .= "mime:\"".		"folder\",";
		$sNfo .= "rsize:".		"0,";
		$sNfo .= "size:\"".		"-\",";
		$sNfo .= "time:".		$aRtr["time"].",";
		$sNfo .= "date:\"".		$aRtr["date"]."\"";
		$aRtr["stringdata"] = $sNfo;
	}
	$aDeny = explode(",",SFB_DENY);
	if (!isset($aRtr["mime"])||in_array($aRtr["mime"],$aDeny)) return null;
	return $aRtr;
}
//
switch ($sAction) {

	case "chi": // retreive file list
		$sImg = "";
		$sDir = $sConnBse.(isset($_POST["folder"])?$_POST["folder"]:"data/");
		$i = 0;
		if ($handle = opendir($sDir)) while (false !== ($file = readdir($handle))) {
			$oFNfo = fileInfo($sDir.$file);
			if ($oFNfo&&isset($oFNfo["stringdata"])) $sImg .= numToAZ($i).":{".$oFNfo["stringdata"]."},";
			$i++;
		}
		$sMsg .= "fileListing";
		$sData = substr($sImg,0,strlen($sImg)-1);
	break;

	case "kung": // duplicate file
		$sCRegx = "/(?<=(_copy))([0-9])+(?=(\.))/";
		$sNRegx = "/(\.)(?=[A-Za-z0-9]+$)/";
		$oMtch = preg_match( $sCRegx, $sSFile, $aMatches);
		if (count($aMatches)>0)	$sNewFile = preg_replace($sCRegx,intval($aMatches[0])+1,$sSFile);
		else					$sNewFile = preg_replace($sNRegx,"_copy0.",$sSFile);
		while (file_exists($sNewFile)) { // $$ there could be a quicker way
			$oMtch = preg_match( $sCRegx, $sNewFile, $aMatches);
			$sNewFile = preg_replace($sCRegx,intval($aMatches[0])+1,$sNewFile);
		}
		if (copy($sSFile,$sNewFile)) {
			$oFNfo = fileInfo($sNewFile);
			$sData = $oFNfo["stringdata"];
			$sMsg = "duplicated#".$sNewFile;
		} else {
			$sErr = "notduplicated#".$sNewFile;
		}
	break;

	case "sfu": // swf file upload
		if ($sAction=="sfu") foreach($_GET as $k=>$v) $_POST[$k] = $v;
	case "fu": // file upload
		$sElName = $sAction=="fu"?"fsileToUpload":"Filedata";
		if (!empty($_FILES[$sElName]["error"])) {
			switch($_FILES[$sElName]["error"]) {
				case "1": $sErr = "uploadErr1"; break;
				case "2": $sErr = "uploadErr2"; break;
				case "3": $sErr = "uploadErr3"; break;
				case "4": $sErr = "uploadErr4"; break;
				case "6": $sErr = "uploadErr6"; break;
				case "7": $sErr = "uploadErr7"; break;
				case "8": $sErr = "uploadErr8"; break;
				default:  $sErr = "uploadErr";
			}
		} else if (empty($_FILES[$sElName]["tmp_name"])||$_FILES[$sElName]["tmp_name"]=="none") {
			$sErr = "No file was uploaded..";
		} else {
			$sFolder = $_POST["folder"];
			$sMsg .= "sFolder_".$sFolder;
			$sPath = $sFolder;

			$sDeny = $_POST["deny"];
			$sAllow = $_POST["allow"];
			$sResize = $_POST["resize"];

			$oFile = $_FILES[$sElName];
			$sFile = $oFile["name"];
			$sMime = array_pop(split("\.",$sFile));//mime_content_type($sDir.$file); //$oFile["type"]; //
			//
			$iRpt = 1;
			$sFileTo = $sPath.$oFile["name"];
			while (file_exists($sFileTo)) {
				$aFile = explode(".",$oFile["name"]);
				$aFile[0] .= "_".($iRpt++);
				$sFile = implode(".",$aFile);
				$sFileTo = $sPath.$sFile;
			}
			$sFileTo = $sConnBse.$sFileTo;
//dump($sFileTo);
			move_uploaded_file( $oFile["tmp_name"], $sFileTo );
			$oFNfo = fileInfo($sFileTo);

			$bAllow = $sAllow=="";
			$sFileExt = array_pop(explode(".",$sFile));
			if ($oFNfo) {
				if ($iRpt==1) $sMsg .= "fileUploaded";
				else $sMsg .= "fileExistsrenamed";
				// check if file is allowed in this session $$$$$$todo: check SFB_DENY
				foreach (explode("|",$sAllow) as $sAllowExt) {
					if ($sAllowExt==$sFileExt) {
						$bAllow = true;
						break;
					}
				}
				foreach (explode("|",$sDeny) as $sDenyExt) {
					if ($sDenyExt==$sFileExt) {
						$bAllow = false;
						break;
					}
				}
			} else {
				$bAllow = false;
			}
			if (!$bAllow) {
				$sErr = "uploadNotallowed#".$sFileExt;
				@unlink($sFileTo);
			} else {
				if ($sResize&&$sResize!="null"&&$sResize!="undefined"&&($sMime=="jpeg"||$sMime=="jpg")) {
					$aResize = explode(",",$sResize);
					$iToW = $aResize[0];
					$iToH = $aResize[1];
					list($iW,$iH) = getimagesize($sFileTo);
					$fXrs = $iToW/$iW;
					$fYrs = $iToH/$iH;
					if (false) {//just resize
						$fRsz = min($fXrs,$fYrs);
						if ($fRsz<1) {
							$iNW = intval($iW*$fRsz);
							$iNH = intval($iH*$fRsz);
							$oImgN = imagecreatetruecolor($iNW,$iNH);
							$oImg = imagecreatefromjpeg($sFileTo);
							imagecopyresampled($oImgN,$oImg, 0,0, 0,0, $iNW,$iNH, $iW,$iH );
							imagejpeg($oImgN, $sFileTo);
						}
					} else { // crop after resize
						$fRsz = max($fXrs,$fYrs);
//						if ($fRsz<1) {
						if ($fXrs<1||$fYrs<1) {
							$iNW = intval($iW*$fRsz);
							$iNH = intval($iH*$fRsz);
							$iFrX = $iNW>$iToW?($iNW-$iToW)/2:0;
							$iFrY = $iNH>$iToH?($iNH-$iToH)/2:0;
							$iFrW = $iNW>$iToW?$iToW*(1/$fRsz):$iW;
							$iFrH = $iNH>$iToH?$iToH*(1/$fRsz):$iH;
							$oImgN = imagecreatetruecolor($iToW,$iToH);
							$oImg = imagecreatefromjpeg($sFileTo);
							imagecopyresampled($oImgN,$oImg, 0,0, $iFrX,$iFrY, $iToW,$iToH, $iFrW,$iFrH );
							imagejpeg($oImgN, $sFileTo);
						}
					}
					$oFNfo = fileInfo($sFileTo);
				}
				$sData = $oFNfo["stringdata"];
			}
		}
	break;

	case "ka": // file delete
		if (count($_POST)!=3||!isset($_POST["folder"])||!isset($_POST["file"])) exit("ku ka");
		if (is_file($sSFile)) {
			if (@unlink($sSFile))	$sMsg .= "fileDeleted";
			else					$sErr .= "fileNotdeleted";
		} else {
			if (@rmdir($sSFile))	$sMsg .= "folderDeleted";
			else					$sErr .= "folderNotdeleted";
		}
	break;

	case "sui":// file force download
		$sZeFile = $sConnBse.$sSFile;
		if (file_exists($sZeFile)) {
			ob_start();
			$sType = "application/octet-stream";
			header("Cache-Control: public, must-revalidate");
			header("Pragma: hack");
			header("Content-Type: " . $sSFile);
			header("Content-Length: " .(string)(filesize($sZeFile)) );
			header('Content-Disposition: attachment; filename="'.array_pop(explode("/",$sZeFile)).'"');
			header("Content-Transfer-Encoding: binary\n");
			ob_end_clean();
			readfile($sZeFile);
			exit();
		}
	break;

	case "mizu":// read txt file contents
		$oHnd = fopen($sSFile, "r");
		$sCnt = preg_replace(array("/\n/","/\r/"),array("\\n","\\r"),addslashes(fread($oHnd, 600)));
		fclose($oHnd);
		$sData = "text:\"".$sCnt."\"";
		$sMsg .= "contentsSucces";
	break;

	case "ho":// rename file
		if (isset($_POST["file"])&&isset($_POST["nfile"])) {
			$sFile = $_POST["file"];
			$sNFile = $_POST["nfile"];

			$sNSFile = str_replace($sFile,$sNFile,$sSFile);
			if (filetype($sSFile)=="file"&&array_pop(split("\.",$sFile))!=array_pop(split("\.",$sNFile))) {
				$sErr .= "filenameNoext";
			} else if (!preg_match("/^\w+(\.\w+)*$/",$sNFile)) {
				$sErr .= "filenamInvalid";
			} else {
				if ($sFile==$sNFile) {
					$sMsg .= "filenameNochange";
				} else {
					if ($sNFile=="") {
						$sErr .= "filenameNothing";
					} else {
						if (file_exists($sNSFile)) {
							$sErr .= "filenameExists";
						} else {
							if (@rename($sSFile,$sNSFile)) $sMsg .= "filenameSucces";
							else $sErr .= "filenameFailed";
						}
					}
				}
			}
		}
	break;

	case "tsuchi":// add folder
		if (isset($_POST["folder"]))  {
			$sFolderName = isset($_POST["foldername"])?$_POST["foldername"]:"new folder";
			$iRpt = 1;
			$sFolder = $sConnBse.$_POST["folder"].$sFolderName;
			while (file_exists($sFolder)) $sFolder = $sConnBse.$_POST["folder"].$sFolderName.($iRpt++);
			if (mkdir($sFolder)) {
				$sMsg .= "folderCreated";
				$oFNfo = fileInfo($sFolder);
				if ($oFNfo) $sData = $oFNfo["stringdata"];
				else $sErr .= "folderFailed";
			} else {
				$sErr .= "folderFailed";
			}
		}
	break;
}
echo "{error: \"".$sErr."\", msg: \"".$sMsg."\", data: {".$sData."}}";