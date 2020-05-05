function unpng(png) {
    var pos = 0;
    for (let b of [137, 80, 78, 71, 13, 10, 26, 10])
        if (b !== png[pos++])
            throw "Non-PNG";
    for (let b of [0, 0, 0, 13])
        if (b !== png[pos++])
            throw "Unexpected length for IHDR";
    for (let b of "IHDR")
        if (b.charCodeAt() !== png[pos++])
            throw "IHDR expected only";
    var width = 0;
    for (let i = 0; i < 4; i++)
        width = (width << 8) + png[pos++];
    var height = 0;
    for (let i = 0; i < 4; i++)
        height = (height << 8) + png[pos++];
    if (png[pos++] !== 8)
        throw "8 bit per channel expected";
    var type = png[pos++];
    if (type !== 0 && type !== 2)
        throw "Grayscale and RGB supported only";
    for (let i = 0; i < 3; i++)
        if (png[pos++] !== 0)
            throw "No extra modes expected";
    pos += 4; // CRC32
    var length = 0;
    for (let i = 0; i < 4; i++)
        length = (length << 8) + png[pos++];
    for (let b of "IDAT")
        if (b.charCodeAt() !== png[pos++])
            throw "IDAT expected only";
    pos += 2;
    var pngdata = inflate(png.subarray(pos), height * (1 + (type === 0 ? width : width * 3)));
    var wpos=0;
    var rpos=0;
    if(type === 0){
        var data=new Uint8Array(width*height);
        for(var y=0;y<height;y++){
            rpos++;
            for(var x=0;x<width;x++)
                data[wpos++]=pngdata[rpos++];
        }
        return{
            data:data,
            width:width,
            height:height,
            bpp:1
        };
    }else{
        var data=new Uint32Array(width*height);
        var data8=new Uint8Array(data.buffer);
        for(var y=0;y<height;y++){
            rpos++;
            for(var x=0;x<width;x++){
                data8[wpos++]=pngdata[rpos++];
                data8[wpos++]=pngdata[rpos++];
                data8[wpos++]=pngdata[rpos++];
                data8[wpos++]=255;
            }
        }
        return{
            data:data,
            width:width,
            height:height,
            bpp:4
        };
    }
}