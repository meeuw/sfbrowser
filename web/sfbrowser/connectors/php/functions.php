<?php

include_once("config.php");

function errorHandler($errno, $errstr, $errfile, $errline) {
	throw new Exception($errstr, $errno);
}

if (!function_exists("dump")) {
	function dump($s) {
		echo "<pre>";
		print_r($s);
		echo "</pre>";
	}
}

function trace($s) {
	if (SFB_DEBUG) {
		$oFile = fopen("log.txt", "a");
		$sDump  = $s."\n";
		fputs ($oFile, $sDump );
		fclose($oFile);
	}
}

function format_size($size, $round = 0) {
    $sizes = array('B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB');
    for ($i=0; $size > 1024 && isset($sizes[$i+1]); $i++) $size /= 1024;
    return round($size,$round).$sizes[$i];
}

function getBody($path) {
	$oHtBrowser = fopen($path,"r");
	$sBrowser = fread($oHtBrowser,filesize($path));
	fclose($oHtBrowser);
	if (preg_match('@<body[^>]*>(.*)</body>@Usi', $sBrowser, $regs)) $sCnt = preg_replace(array("/\n/","/\r/","/\t/","/\"/"),array("","","","\\\""),$regs[1]);
	return $sCnt;
}

function pathWithin($path,$inpath) {
	$sRegFld = "/(\w+\/+\.\.\/+)/";
	$sRegDbl = "/\/+/";
	$sRegWht = "/\s+/";
	$aFind = array($sRegWht,$sRegFld,$sRegDbl);
	$aRepl = array("","","/");
	$path = preg_replace($aFind,$aRepl,$path);
	$inpath = preg_replace($aFind,$aRepl,$inpath);
	//echo substr($path,0,strlen($inpath))."\n";
	//echo $inpath."\n";
	return substr($path,0,strlen($inpath))===$inpath;
}

function validateInput($sConnBse,$aGPF) {
	$sErr = "";
	$sAction = "";
	// check input
	if (isset($_POST["a"])||isset($_GET["a"])) {
		$sAction = isset($_POST["a"])?$_POST["a"]:$_GET["a"];
		$aChck = $aGPF[$sAction];
		if (!(count($_GET)==$aChck[0]&&count($_POST)==$aChck[1]&&count($_FILES)==$aChck[2])) $sErr .= sterf("input does not match action");
	} else {
		$sErr .= sterf("no action set");
	}
	// check files
	$sSFile = "";
	if (isset($_POST["file"])) $sSFile = $_POST["file"];
	else if (isset($_GET["file"])) $sSFile = $_GET["file"];
	else if (isset($_FILES["fileToUpload"])) $sSFile = $_FILES["fileToUpload"]["name"];
	//
	$bFld = isset($_POST["folder"]);
	if ($sSFile!="") {
		if ($bFld) $sSFile = $sConnBse.$_POST["folder"].$sSFile;
		if (strstr($sSFile,"sfbrowser")!==false||!preg_match('/[^:\*\?<>\|(\.\/)]+\/[^:\*\?<>\|(\.\/)]/',$sSFile)) $sErr .= sterf("not a valid path");
		// $$todo: maybe check SFB_DENY here as well
		// check if path within base path
		if (!pathWithin($sSFile,($bFld?$sConnBse:"").SFB_BASE)) $sErr .= sterf("file not within base: [".$sSFile."] [".SFB_BASE."]");
	} else if ($bFld&&!pathWithin($_POST["folder"],SFB_BASE)) {
		$sErr .= sterf("path not within base");
	}
	// log
	if (SFB_DEBUG) {
		$sP = "POST: [";
		$sG = "GET:  [";
		$sF = "FILE: [";
		foreach($_POST as  $k=>$v)	$sP .= $k.":".$v.",";
		foreach($_GET as   $k=>$v)	$sG .= $k.":".$v.",";
		foreach($_FILES as $k=>$v)	$sF .= $k.":".$v.",";
		$sP .= "]";
		$sG .= "]";
		$sF .= "]";
		$sLog  = date("j-n-Y H:i")."\t\t";
		$sLog .= "ip:".$_SERVER["REMOTE_ADDR"]."\t\t";
		$sLog .= "a:".$sAction."(".$sSFile.")\t\t";
		$sLog .= "error:".$sErr;
		$sLog .= "\n\t\t".$sP."\n\t\t".$sG."\n\t\t".$sF;
		trace($sLog);
	}
	return array("action"=>$sAction,"file"=>$sSFile,"error"=>$sErr);
}

function sterf($sErr) {
	if (SFB_DEBUG) return $sErr;
	else {

		exit(SFB_ERROR_RETURN);
	}
}

//function constantsToJs($a) {
//	foreach ($a as $s) {
//		$oVal = @constant($s);
//		$sPrefix = substr(gettype($oVal),0,1);
//		$sIsString = $sPrefix=="s"?"\"":"";
//		$sVal = 0;
//		switch ($sPrefix) {
//			case "s": $sVal = "\"".str_replace("\\","\\\\",$oVal)."\""; break;
//			case "b": $sVal = $oVal?"true":"false"; break;
//			case "d": $sPrefix = "f";
//			default: $sVal = $oVal;
//		}
//		if ($sPrefix!="N") echo "\t\t\tvar ".$sPrefix.camelCase($s)." = ".$sVal.";\n";
//		else  echo "\t\t\t// ".$s." could not be found or contains a null value.\n";
//	}
//}

function camelCase($in) {
	$out = "";
	foreach(explode("_", $in) as $n => $chunk) $out .= ucfirst(strtolower($chunk));
	return $out;
}

function numToAZ($i) {
	$s = "";
	for ($j=0;$j<strlen((string)$i);$j++) $s .= chr((int)substr((string)$i, $j, 1)%26+97);
	return $s;
}

function strip_html_tags($text) {
	$text = preg_replace(
		array(
		  // Remove invisible content
			'@<head[^>]*?>.*?</head>@siu',
			'@<style[^>]*?>.*?</style>@siu',
			'@<script[^>]*?.*?</script>@siu',
			'@<object[^>]*?.*?</object>@siu',
			'@<embed[^>]*?.*?</embed>@siu',
			'@<applet[^>]*?.*?</applet>@siu',
			'@<noframes[^>]*?.*?</noframes>@siu',
			'@<noscript[^>]*?.*?</noscript>@siu',
			'@<noembed[^>]*?.*?</noembed>@siu',
		  // Add line breaks before and after blocks
			'@</?((address)|(blockquote)|(center)|(del))@iu',
			'@</?((div)|(h[1-9])|(ins)|(isindex)|(p)|(pre))@iu',
			'@</?((dir)|(dl)|(dt)|(dd)|(li)|(menu)|(ol)|(ul))@iu',
			'@</?((table)|(th)|(td)|(caption))@iu',
			'@</?((form)|(button)|(fieldset)|(legend)|(input))@iu',
			'@</?((label)|(select)|(optgroup)|(option)|(textarea))@iu',
			'@</?((frameset)|(frame)|(iframe))@iu',
		),
		array(
			' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
			"\n\$0", "\n\$0", "\n\$0", "\n\$0", "\n\$0", "\n\$0",
			"\n\$0", "\n\$0",
		),
		$text );
	return strip_tags($text);
}

function getUriContents($sUri) {
	$sExt = array_pop(explode(".", $sUri));

	if ($sExt=="pdf")	$sContents = pdf2txt($sUri);
	else				$sContents = file_get_contents($sUri);

	$sContents = strip_html_tags($sContents);
	$sContents = preg_replace(
		array(
			"/(\r\n)|(\n|\r)/"
			,"/(\n){3,}/"
			,"/(?<=.)(\n)(?=.)/"
			,"/\|}/"
		), array(
			"\n"
			,"\n\n"
			," "
			,"!"
		), $sContents);

	return nl2br($sContents);
}


// The function returns the absolute path to the file to be included. 
// This path can be used as argument to include() and resolves the problem of nested inclusions.
function getFilePath($relative_path) { 
    // $abs_path is the current absolute path (replace "\\" to "/" for windows platforms) 
    $abs_path=str_replace("\\", "/", dirname($_SERVER['SCRIPT_FILENAME']));
    $relative_array=explode("/",$relative_path);
    $abs_array=explode("/",$abs_path);
    // for each "../" at the beginning of $relative_path
    // removes this 1st item from $relative_path and the last item from $abs_path
    while ($relative_array and ($relative_array[0]=="..")) {
        array_shift($relative_array);
        array_pop($abs_array);
    }
    // and implodes both arrays 
    return implode("/", $abs_array) . "/" . implode("/", $relative_array);   
}


function getUploadMaxFilesize() {
	$iMaxBytes = 0;
	$sMxSz = ini_get("upload_max_filesize");
	$iLen = strlen($sMxSz);
	if ($iLen>1) {
		$sLast = substr($sMxSz, $iLen-1, 1);
		$iRest = intVal(substr($sMxSz, 0, $iLen-1));
		switch ($sLast) {
			case "K": $iMaxBytes = $iRest*1024; break;
			case "M": $iMaxBytes = $iRest*1048576; break;
			case "G": $iMaxBytes = $iRest*1073741824; break;
			default: $iMaxBytes = intVal($sMxSz);
		}
	} else {
		$iMaxBytes = intVal($sMxSz);
	}
	return $iMaxBytes;
}