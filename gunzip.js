function gunzip(gzip, approx) {
    var pos = 0;
    if (gzip[pos++] !== 0x1f || gzip[pos++] !== 0x8b)
        throw "Non-gzip";
    if (gzip[pos++] !== 8)
        throw "Non-deflated";
    var FTEXT = gzip[pos] & 1;
    var FHCRC = gzip[pos] & 2;
    var FEXTRA = gzip[pos] & 4;
    var FNAME = gzip[pos] & 8;
    var FCOMMENT = gzip[pos] & 16;
    pos++;
    console.log("FTEXT", FTEXT);
    console.log("FHCRC", FHCRC);
    console.log("FEXTRA", FEXTRA);
    console.log("FNAME", FNAME);
    console.log("FCOMMENT", FCOMMENT);
    var MTIME = 0;
    for (let i = 0; i < 4; i++)
        MTIME += gzip[pos++] << (i * 8);
    var d = new Date();
    d.setTime(MTIME * 1000);
    console.log("MTIME", MTIME, d);
    var XFL = gzip[pos++];
    var OS = gzip[pos++];
    console.log("XFL", XFL);
    console.log("OS", OS);
    if (FEXTRA) {
        var XLEN = gzip[pos++] + gzip[pos++] << 8;
        console.log("XLEN", XLEN);
        pos += XLEN;
    }
    if (FNAME) {
        var name = "";
        while (gzip[pos] !== 0)
            name += String.fromCharCode(gzip[pos++]);
        pos++;
        console.log("name", name);
    }
    if (FCOMMENT) {
        var comment = "";
        while (gzip[pos] !== 0)
            comment += String.fromCharCode(gzip[pos++]);
        pos++;
        console.log("comment", comment);
    }
    if (FHCRC) {
        var hcrc = gzip[pos++] + gzip[pos++] << 8;
        console.log("hcrc", hcrc);
    }
    var len = 0;
    for (let i = 0; i < 4; i++)
        len += gzip[gzip.length - 4 + i] << (i * 8);
    return inflate(new Uint8Array(gzip.buffer, pos), approx);
}