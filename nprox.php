<?php
$ch = curl_init("https://www.nesys.uio.no/LMR/".$_SERVER["QUERY_STRING"]);
curl_exec($ch);
curl_close($ch);
