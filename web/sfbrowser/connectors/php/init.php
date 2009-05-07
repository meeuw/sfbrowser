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
echo "\t\t<script type=\"text/javascript\" src=\"".SFB_PATH."jquery.sfbrowser".(SFB_DEBUG?"":".min").".js\"></script>\n";
echo "\t\t<script type=\"text/javascript\" src=\"".SFB_PATH."lang/".SFB_LANG.".js\"></script>\n";
echo "\t\t<script type=\"text/javascript\"><!--\n";
echo "\t\t\t$.sfbrowser.defaults.connector = \"php\";\n";
echo "\t\t\t$.sfbrowser.defaults.sfbpath = \"".SFB_PATH."\";\n";
echo "\t\t\t$.sfbrowser.defaults.base = \"".SFB_BASE."\";\n";
echo "\t\t\t$.sfbrowser.defaults.preview = ".PREVIEW_BYTES.";\n";
echo "\t\t\t$.sfbrowser.defaults.deny = (\"".SFB_DENY."\").split(\",\");\n";
echo "\t\t\t$.sfbrowser.defaults.icons = ['".implode("','",$aIcons)."'];\n";
echo "\t\t\t$.sfbrowser.defaults.browser = \"".$sSfbHtml."\";\n";
echo "\t\t\t$.sfbrowser.defaults.debug = ".(SFB_DEBUG?"true":"false").";\n";
echo "\t\t\t$.sfbrowser.defaults.maxsize = ".getUploadMaxFilesize().";\n";
if (SFB_PLUGINS!="") echo "\t\t\t$.sfbrowser.defaults.plugins = ['".implode("','",$aPlugins)."'];\n";
echo "\t\t--></script>\n";

echo "\t\t<!-- SFBrowser plugins -->\n";
foreach ($aPlugins as $sPlugin) {
	$sConf = SFB_PATH."plugins/".$sPlugin."/connectors/php/config.php";
	$sInit = SFB_PATH."plugins/".$sPlugin."/connectors/php/init.php";
	if (file_exists($sConf)) include($sConf);
	if (file_exists($sInit)) {
		include($sInit);
	} else {
		$sPlug = SFB_PATH."plugins/".$sPlugin."/jquery.sfbrowser.".$sPlugin.(SFB_DEBUG?"":".min").".js";
		if (file_exists($sPlug)) echo "\t\t<script type=\"text/javascript\" src=\"".$sPlug."\"></script>\n";
		$sCsss = SFB_PATH."plugins/".$sPlugin."/css/".$sPlugin.".css";
		if (file_exists($sCsss)) echo "\t\t<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"".$sCsss."\" />\n";
	}
}
echo "\t\t<!-- SFBrowser end -->\n\n";
?>