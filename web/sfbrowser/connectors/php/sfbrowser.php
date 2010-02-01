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
	 "fileList"=>	array(0,2,0)	// retreive file list			chi
	,"duplicate"=>	array(0,3,0)	// duplicate file				kung
	,"upload"=>		array(0,5,1)	// file upload					fu
	,"swfUpload"=>	array(5,2,1)	// swf file upload				sfu
	,"delete"=>		array(0,3,0)	// file delete					ka
	,"download"=>	array(2,0,0)	// file force download			sui
	,"read"=>		array(0,3,0)	// read txt file contents		mizu
	,"rename"=>		array(0,4,0)	// rename file					ho
	,"addFolder"=>	array(0,3,0)	// add folder					tsuchi
));
$sAction = $aVldt["action"];
$sSFile = $aVldt["file"];
$sErr .= $aVldt["error"];
if ($sErr!="") die('{"error":"'.$sErr.'","msg":"'.$sMsg.'","data":{'.$sData.'}}');
//
switch ($sAction) {

	case "fileList": // retreive file list
		$sImg = "";
		$sDir = $sConnBse.(isset($_POST["folder"])?$_POST["folder"]:"data/");
		$i = 0;
		if ($handle = opendir($sDir)) while (false !== ($file = readdir($handle))) {
			$oFNfo = fileInfo($sDir.$file);
			if ($oFNfo&&isset($oFNfo["stringdata"])) $sImg .= '"'.numToAZ($i).'":{'.$oFNfo["stringdata"].'},';
			$i++;
		}
		$sMsg .= "fileListing";
		$sData = substr($sImg,0,strlen($sImg)-1);
	break;

	case "duplicate": // duplicate file
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

	case "swfUpload": // swf file upload
		if ($sAction=="swfUpload") foreach($_GET as $k=>$v) $_POST[$k] = $v;
	case "upload": // file upload
		$sElName = $sAction=="upload"?"fileToUpload":"Filedata";
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

	case "delete": // file delete
		if (count($_POST)!=3||!isset($_POST["folder"])||!isset($_POST["file"])) exit("ku ka");
		if (is_file($sSFile)) {
			if (@unlink($sSFile))	$sMsg .= "fileDeleted";
			else					$sErr .= "fileNotdeleted";
		} else {
			if (@rmdir($sSFile))	$sMsg .= "folderDeleted";
			else					$sErr .= "folderNotdeleted";
		}
	break;

	case "download":// file force download
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

	case "read":// read txt file contents
		$sExt = strtolower(array_pop(explode('.',$sSFile)));
		//
		// install extensions and add to php.ini
		// - extension=php_zip.dll
		// - extension=php_rar.dll
		if ($sExt=="zip") {
			$sDta = "";
			if (!function_exists("zip_open")) {
				$sErr .= "php_zip not installed or enabled";
			} else if ($zip=@zip_open(getcwd()."/".$sSFile)) {
				while ($zip_entry=@zip_read($zip)) $sDta .=  @zip_entry_name($zip_entry)."\\r\\n"; // zip_entry_filesize | zip_entry_compressedsize | zip_entry_compressionmethod
				@zip_close($zip);
				$sData = '"type":"archive","text":"'.$sDta.'"';
				$sMsg .= "contentsSucces";
			} else {
				$sMsg .= "contentsFail";
			}
		} else if ($sExt=="rar") {
			if (!function_exists("rar_open")) {
				$sMsg .= "php_rar not installed or enabled";
			} else if ($rar_file=@rar_open('example.rar')) {
				$entries = @rar_list($rar_file);
				foreach ($entries as $entry) $sDta .=  $entry->getName()."\\r\\n"; // getName | getPackedSize | getUnpackedSize
				@rar_close($rar_file);
				$sData = '"type":"archive","text":"'.$sDta.'"';
				$sMsg .= "contentsSucces";
			} else {
				$sMsg .= "contentsFail";
			}
		} else {
			$oHnd = fopen($sSFile, "r");
			$sCnt = preg_replace(array("/\n/","/\r/","/\t/"),array("\\n","\\r","\\t"),addslashes(fread($oHnd, 600)));
			fclose($oHnd);
			$sData = '"type":"ascii","text":"'.$sCnt.'"';
			$sMsg .= "contentsSucces";
		}
	break;

	case "rename":// rename file
		if (isset($_POST["file"])&&isset($_POST["nfile"])) {
			$sFile = $_POST["file"];
			$sNFile = $_POST["nfile"];

			$sNSFile = str_replace($sFile,$sNFile,$sSFile);
//			$sFileType = "unknown";
//			try {
//				$sFileType = filetype($sSFile);
//			} catch (Exception $e) {
//				$sErr .= "could not retreive filetype";
//			}
			if (@filetype($sSFile)=="file"&&array_pop(split("\.",$sFile))!=array_pop(split("\.",$sNFile))) {
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

	case "addFolder":// add folder
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
//if ($sAction!="swfUpload"&&$sAction!="upload") {
//	header('Cache-Control: no-cache, must-revalidate');
//	header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
//	header('Content-type: application/json');
//}
echo '{"error":"'.$sErr.'","msg":"'.$sMsg.'","data":{'.$sData.'}}';