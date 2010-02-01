<?php // this file needs to be called in the header of your document because it adds css and js

include("config.php");
include("functions.php");

// check existing icons
$aIcons = array();
if ($handle = opendir(SFB_PATH."icons/")) while (false !== ($file = readdir($handle))) if (filetype(SFB_PATH."icons/".$file)=="file") $aIcons[] = array_shift(explode(".",$file));

// retreive browser html data
$sSfbHtml = getBody(SFB_PATH."browser.html");

// retreive plugins
if (SFB_PLUGINS!="") $aPlugins = split(",",SFB_PLUGINS);

// add javascript to header
echo "\n\t\t<!-- SFBrowser init -->\n";
echo "\t\t<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"".SFB_PATH."css/sfbrowser.css\" />\n";
echo "\t\t<script type=\"text/javascript\" src=\"".SFB_PATH."SWFObject.js\"></script>\n";
echo "\t\t<script type=\"text/javascript\" src=\"".SFB_PATH."jquery.tinysort.min.js\"></script>\n";
echo "\t\t<script type=\"text/javascript\" src=\"".SFB_PATH."jquery.corner.js\"></script>\n";//jquery.corner.jsjquery.corner.jsjquery.corner.jsjquery.corner.js
echo "\t\t<script type=\"text/javascript\" src=\"".SFB_PATH."jquery.sfbrowser".(SFB_DEBUG?"":".min").".js\"></script>\n";
echo "\t\t<script type=\"text/javascript\" src=\"".SFB_PATH."lang/".SFB_LANG.".js\"></script>\n";
echo "\t\t<script type=\"text/javascript\"><!--\n";
echo "\t\t\t$.sfbrowser.defaults.connector = \"php\";\n";
echo "\t\t\t$.sfbrowser.defaults.sfbpath = \"".SFB_PATH."\";\n";
echo "\t\t\t$.sfbrowser.defaults.base = \"".SFB_BASE."\";\n";
echo "\t\t\t$.sfbrowser.defaults.previewbytes = ".PREVIEW_BYTES.";\n";
echo "\t\t\t$.sfbrowser.defaults.deny = (\"".SFB_DENY."\").split(\",\");\n";
echo "\t\t\t$.sfbrowser.defaults.icons = ['".implode("','",$aIcons)."'];\n";
echo "\t\t\t$.sfbrowser.defaults.browser = \"".$sSfbHtml."\";\n";
echo "\t\t\t$.sfbrowser.defaults.debug = ".(SFB_DEBUG?"true":"false").";\n";
echo "\t\t\t$.sfbrowser.defaults.maxsize = ".getUploadMaxFilesize().";\n";
if (SFB_PLUGINS!="") echo "\t\t\t$.sfbrowser.defaults.plugins = ['".implode("','",$aPlugins)."'];\n";
echo "\t\t--></script>\n";

// initialize plugins via connectors
echo "\t\t<!-- SFBrowser plugins -->\n";
foreach ($aPlugins as $sPlugin) {
	$sPpth = SFB_PATH."plugins/".$sPlugin;
	$sConf = $sPpth."/connectors/php/config.php";
	$sInit = $sPpth."/connectors/php/init.php";
	$bConf = file_exists($sConf);
	$bInit = file_exists($sInit);
	echo "\t\t<!-- plugin: ".$sPlugin.($bConf?" c":"").($bInit?" i":"")." -->\n";
	$bConf&&include($sConf);
	if ($bInit) {
		include($sInit);
	} else { // no init.php so automate initialisation
		// lang
		$sPlang = $sPpth."/lang/".SFB_LANG.".js";
		if (file_exists($sPlang)) echo "\t\t<script type=\"text/javascript\" src=\"".$sPlang."\"></script>\n";
		// js
		$sPlug = $sPpth."/jquery.sfbrowser.".$sPlugin.(SFB_DEBUG?"":".min").".js";
		if (file_exists($sPlug)) echo "\t\t<script type=\"text/javascript\" src=\"".$sPlug."\"></script>\n";
		// css
		$sCsss = $sPpth."/css/screen.css";
		if (file_exists($sCsss)) echo "\t\t<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"".$sCsss."\" />\n";
		// html
		$sPhtml = $sPpth."/browser.html";
		if (file_exists($sPhtml)) {
			echo "\t\t<script type=\"text/javascript\"><!--\n";
			echo "\t\t\t$.sfbrowser.defaults.".$sPlugin." = \"".getBody($sPhtml)."\";\n";
			echo "\t\t--></script>\n";
		}
	}
}
echo "\t\t<!-- SFBrowser end -->\n\n";
?>