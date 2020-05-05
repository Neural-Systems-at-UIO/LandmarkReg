<?php
$ch = curl_init("https://object.cscs.ch/".$_SERVER["QUERY_STRING"]);
curl_exec($ch);
curl_close($ch);
