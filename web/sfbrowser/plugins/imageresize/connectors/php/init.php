<?php
$sSfbImgHtml = getBody(SFB_PATH."plugins/imageresize/browser.html");
$sPluginPath = SFB_PATH."plugins/imageresize/";
echo "\t\t<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"".$sPluginPath."css/imageresize.css\" />\n";
echo "\t\t<script type=\"text/javascript\" src=\"".$sPluginPath."lang/".SFB_LANG.".js\"></script>\n";
echo "\t\t<script type=\"text/javascript\" src=\"".$sPluginPath."jquery.sfbrowser.imageresize".(SFB_DEBUG?"":".min").".js\"></script>\n";
echo "\t\t<script type=\"text/javascript\"><!--\n";
echo "\t\t\t$.sfbrowser.defaults.imageresize = \"".$sSfbImgHtml."\";\n";
echo "\t\t--></script>\n";
?>