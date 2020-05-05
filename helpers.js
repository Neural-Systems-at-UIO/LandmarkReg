var boxw,boxh,boxsize;
function layoutboxes(boxes){
    boxw=Math.floor(window.innerWidth/4);
    boxh=Math.floor(window.innerHeight/2);
    boxsize=Math.min(boxw,boxh);
    boxes.forEach(function(box){
        var e=document.getElementById(box.id);
        e.style.left=box.x*boxw+"px";
        e.style.top=box.y*boxh+"px";
        switch(e.tagName){
            case "CANVAS":
                e.width=boxw;
                e.height=boxh;
                break;
            case "DIV":
                e.style.width=boxw+"px";
                e.style.height=boxh+"px";
                break;
        }
    });
}

function haircross(ctx,color){
//    var cnv=ctx.canvas;
//    var w=cnv.width;
//    var h=cnv.height;
    var w=boxw;
    var h=boxh;
    ctx.strokeStyle=color;
    ctx.beginPath();
    var x=Math.round(w/2)+0.5;
    ctx.moveTo(x,0);
    ctx.lineTo(x,h);
    var y=Math.round(h/2)+0.5;
    ctx.moveTo(0,y);
    ctx.lineTo(w,y);
    ctx.closePath();
    ctx.stroke();
}

function putgraydata(view,workerview,low,high){
    if(view.width!==workerview.width || view.height!==workerview.height)return;
    var data=view.imagedata.data;
    var wdata=workerview.data;
    for(var i=0;i<wdata.length;i++){
        data[i*4]=data[i*4+1]=data[i*4+2]=
            (wdata[i]-low)*255/(high-low);
    }
    view.ctx.putImageData(view.imagedata,0,0);
}

function putcolordata(view,workerview){
    if(view.width!==workerview.width || view.height!==workerview.height)return;
    var data=new Uint32Array(view.imagedata.data.buffer);
    var wdata=workerview.data;
    for(var i=0;i<wdata.length;i++)
        data[i]=wdata[i];
    view.ctx.putImageData(view.imagedata,0,0);
}

function putidxdata(view,workerview,rgbpalette){
    var data=view.imagedata.data;
    var wdata=workerview.data;
    for(var i=0;i<wdata.length;i++){
        var pal=wdata[i]*3;
        data[i*4]=rgbpalette[pal];
        data[i*4+1]=rgbpalette[pal+1];
        data[i*4+2]=rgbpalette[pal+2];
    }
    view.ctx.putImageData(view.imagedata,0,0);
}

function trymix(sub){
    if(!document.getElementById("link").checked)return;
    var mix=document.getElementById("mix").value;
    var inv=100-mix;
    if(mix===0)return;
    var src=views["src"+sub];
    var trg=views["trg"+sub];
    console.log(src,trg);
    var sdat=src.imagedata.data;
    var tdat=trg.imagedata.data;
    var aux=src.auxdata.data;
    if(mix<100)
        for(var i=0;i<boxw*boxh*4;i++)
            aux[i]=(sdat[i]*inv+tdat[i]*mix)/100;
    else{
        for(var i=0;i<boxw*boxh*4;i++)
            aux[i]=sdat[i];
        var str=boxw*4;
        for(var y=1;y<boxh-1;y++)
            for(var x=1;x<boxw-1;x++){
                var t=(x+y*boxw)*4;
                var b=false;
                for(var d=0;d<3;d++)
                    if((tdat[t+d]!==tdat[t+d-str]) || (tdat[t+d]!==tdat[t+d+str]) || (tdat[t+d]!==tdat[t+d-4]) || (tdat[t+d]!==tdat[t+d+4])){
                        b=true;
                        break;
                    }
                if(b){
                    aux[t]=128;
                    aux[t+1]=255;
                    aux[t+2]=128;
                }
            }
    }
    src.ctx.putImageData(src.auxdata,0,0);
    haircross(src.ctx,"#FFFF80");
}