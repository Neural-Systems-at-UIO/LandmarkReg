importScripts("inflater.js","unpng.js");

var edge = 64;
var edgeedge = edge * edge;
var mask = edge - 1;
var shift = 6;
var fblimit = edge / 2;

var xdim, ydim, zdim;
var maxlevel;
//var urlformatter;
var modidx;

var xcubs, ycubs, zcubs;
var xy;
var xyz;

onmessage = function(event) {
    console.log(event);
    switch (event.data.op) {
        case "dataprops":
            registerprops(event.data.props);
            break;
        case "registerview":
            registerview(event.data.id);
            break;
        case "draw":
            var view = views[event.data.id];
            view.cut = event.data;
            draw(view);
            break;
        default:
            close();
    }
};

function registerprops(dataprops) {
    xdim = dataprops.xdim;
    ydim = dataprops.ydim;
    zdim = dataprops.zdim;
    maxlevel = dataprops.maxlevel;
//    urlformatter = new Function("l,x,y,z","return "+dataprops.urlformatter);
    modidx = dataprops.idx;

    xcubs = Math.floor(xdim / edge) + 1;
    ycubs = Math.floor(ydim / edge) + 1;
    zcubs = Math.floor(zdim / edge) + 1;
    xy = xcubs * ycubs;
    xyz = xy * zcubs;
    
    var xhr=new XMLHttpRequest();
    xhr.open("GET",dataprops.urlformatter);
    xhr.responseType="arraybuffer";
    xhr.onload=loaded;
    xhr.send();
}

var views = {};
function View(id) {
    this.id = id;
    this.width = 0; //width;
    this.height = 0; //height;
    this.data = null; //new Uint16Array(width * height);
    this.cut = null;
}
function registerview(id) {
    views[id] = new View(id);
}

var cubs = [];
var cubslen = 0;

function draw(view) {
    if(!rleblob)return;
    var cut = view.cut;
    view.cut=null;
    var ox = cut.ox, oy = cut.oy, oz = cut.oz;
    var ux = cut.ux, uy = cut.uy, uz = cut.uz;
    var vx = cut.vx, vy = cut.vy, vz = cut.vz;
    var w = cut.width;
    var h = cut.height;
    
    if(view.width!==w || view.height!==h){
        view.width=w;
        view.height=h;
        view.data=new Uint16Array(w * h * 3);
    }    
    var data = view.data;
    var w = view.width;
    var h = view.height;
    var xd = xdim;
    var yd = ydim;
    var zd = zdim;

    var u = Math.sqrt(ux * ux + uy * uy + uz * uz);
    var v = Math.sqrt(vx * vx + vy * vy + vz * vz);
    var level = 0;
    while (u > w * 2 && v > h * 2 && level < maxlevel) {
        ox /= 2;
        oy /= 2;
        oz /= 2;
        ux /= 2;
        uy /= 2;
        uz /= 2;
        vx /= 2;
        vy /= 2;
        vz /= 2;
        u /= 2;
        v /= 2;
        level++;
        xd = (xd + 1) >> 1;
        yd = (yd + 1) >> 1;
        zd = (zd + 1) >> 1;
    }
    var idx = 0;
    for (var y = 0; y < h; y++)
        for (var x = 0; x < w; x++) {
            var lx = Math.round(ox + ux * x / w + vx * y / h);
            var ly = Math.round(oy + uy * x / w + vy * y / h);
            var lz = Math.round(oz + uz * x / w + vz * y / h);
            if (lx < 0 || ly < 0 || lz < 0 || lx >= xd || ly >= yd || lz >= zd)
                data[idx++] = 0;//255;//128;
            else {
                var ix = lx & mask;
                var iy = ly & mask;
                var iz = lz & mask;
                lx >>= shift;
                ly >>= shift;
                lz >>= shift;
                var vol = cubs[level * xyz + lz * xy + ly * xcubs + lx];
                if (!vol) { //!!
                    vol=getCub(level,lx,ly,lz);
                    cubs[level * xyz + lz * xy + ly * xcubs + lx]=vol;
                }
                data[idx++] = vol[ix + iy * edge + iz * edgeedge];
            }
        }
//    postMessage({id:view.id,imagedata:view.imagedata});
    postMessage({op:"draw", id: view.id, mod: modidx, view: {width:view.width,height:view.height,data:view.data}});
}
var count=0;
var onebyte;
function getCub(l,x,y,z){
    var vol=new Uint16Array(64*64*64);
    var pos=pyramid[l][z][y][x];
    if(pos>=0){
        var idx=0;
        if(onebyte)
            while(idx<vol.length){
                var cur=rleblob[pos++];
                var cnt=rleblob[pos++];
                do{
                    vol[idx++]=cur;
                }while(cnt--)
            }
        else
            while(idx<vol.length){
                var cur=(rleblob[pos++]<<8)+rleblob[pos++];
                var cnt=rleblob[pos++];
                do{
                    vol[idx++]=cur;
                }while(cnt--)
            }

        console.log(idx,++count);
    }
    return vol;
}

var rleblob=null;
var pyramid=[];
function loaded(event) {
    var bigdata=unpng(new Uint8Array(event.target.response)).data;
    var dwords=bigdata.length;
    bigdata=new Uint8Array(bigdata.buffer);
    var data=new Uint8Array(dwords*3);
    for(var i=0;i<dwords;i++){
        data[i*3]=bigdata[i*4];
        data[i*3+1]=bigdata[i*4+1];
        data[i*3+2]=bigdata[i*4+2];
    }
    
    var datablob=new DataView(data.buffer);
    var hdr="";
    for(var i=0;i<10;i++)
        hdr+=String.fromCharCode(datablob.getUint8(i));
    console.log(hdr);
    var bpp=datablob.getUint8(10);
    console.log(bpp);
    onebyte=bpp===1;
    var xd=datablob.getUint16(11);
    var yd=datablob.getUint16(13);
    var zd=datablob.getUint16(15);
    var flats=datablob.getUint8(17);
    var flat=datablob.getUint8(18);
    var pos=19;
    console.log(xd,yd,zd);
    console.log(flats,flat);
    var count=0;
    while(xd>edge/2 || yd>edge/2 || zd>edge/2){
        var xc=Math.ceil(xd/edge);
        var yc=Math.ceil(yd/edge);
        var zc=Math.ceil(zd/edge);
        var la=[];
        pyramid.push(la);
        for(var z=0;z<zc;z++){
            var za=[];
            la.push(za);
            for(var y=0;y<yc;y++){
                var ya=[];
                za.push(ya);
                for(var x=0;x<xc;x++){
                    var code=datablob.getInt32(pos);
//                    ya.push({
//                        flat:code<0,
//                        offset:code,
//                        cube:null
//                    });
                    ya.push(code);
                    pos+=4;
                    count++;
                }
            }
        }
        xd=Math.ceil(xd/2);
        yd=Math.ceil(yd/2);
        zd=Math.ceil(zd/2);
    }
    console.log(count,pyramid.length);
    var blobsize=datablob.getUint32(pos);
    pos+=4;
    console.log(blobsize);
    rleblob=new Uint8Array(data.buffer,pos,blobsize);
    
    for(var view in views)
        if(views[view].cut)
            draw(views[view]);
}
