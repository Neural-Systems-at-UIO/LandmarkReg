var cscsbase;
function mrnc(base) {
    if(!base.startsWith("https://object.cscs.ch/"))
        throw base+" is not a CSCS link";
    cscsbase = base.substr(23);
    xhr = new XMLHttpRequest();
    xhr.open("GET", "cprox.php?" + cscsbase + "/info");
    xhr.responseType = "json";
    xhr.onload = mrncloaded;
    xhr.send();
}

//var mjson = {
//    "data_type": "uint16",
//    "num_channels": 1,
//    "scales": [
//        {
//            "chunk_sizes": [[64, 64, 64]],
//            "encoding": "raw",
//            "key": "20um",
//            "resolution": [20000, 20000, 20000],
//            "size": [1376, 623, 815],
//            "voxel_offset": [0, 0, 0]
//        }, {
//            "chunk_sizes": [[64, 64, 64]],
//            "encoding": "raw",
//            "key": "40um",
//            "resolution": [40000, 40000, 40000],
//            "size": [688, 312, 408],
//            "voxel_offset": [0, 0, 0]
//        }, {"chunk_sizes": [[64, 64, 64]], "encoding": "raw", "key": "80um", "resolution": [80000, 80000, 80000], "size": [344, 156, 204], "voxel_offset": [0, 0, 0]}, {"chunk_sizes": [[64, 64, 64]], "encoding": "raw", "key": "160um", "resolution": [160000, 160000, 160000], "size": [172, 78, 102], "voxel_offset": [0, 0, 0]}, {"chunk_sizes": [[64, 64, 64]], "encoding": "raw", "key": "320um", "resolution": [320000, 320000, 320000], "size": [86, 39, 51], "voxel_offset": [0, 0, 0]}
//    ],
//    "type": "image"
//};

function mrncloaded(event) {
    var json = event.target.response;
    var size = json.scales[0].size;
    source = {
        "name": "Unknown",

        "volume": {
            "width": size[0],
            "height": size[1],
            "length": size[2]
        },

        "tech": {
            "xdim": size[0],
            "ydim": size[1],
            "zdim": size[2],
            "maxlevel": json.scales.length-1,
            "scales": json.scales,
            "base": cscsbase
        },

        "basetrf": [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ],

        "mods": [
            {
                "name": "Unknown",
                "type": "gray8"//mjson.data_type
            }
        ]
    };

    var volume = source.volume;
    source.cut = {
        x: volume.width / 2,
        y: volume.height / 2,
        z: volume.length / 2,
        zoom: Math.max(volume.width, volume.height, volume.length)
    };

    var tech = source.tech;
    var mods = document.getElementById("srcmods");
    source.mods.forEach(function (mod, idx) {
        var opt = document.createElement("option");
        opt.text = mod.name;
        mods.appendChild(opt);

        mod.worker = new Worker(mod.type + ".js");
        mod.worker = new Worker("mrnc"+json.data_type+".js");
        mod.worker.onmessage = sworkerhandler;
        tech.idx = idx;
        mod.worker.postMessage({op: "dataprops", props: tech});
        mod.worker.postMessage({op: "registerview", id: "srccor"});
        mod.worker.postMessage({op: "registerview", id: "srcsag"});
        mod.worker.postMessage({op: "registerview", id: "srchor"});
    });
    mods.selectedIndex = 0;

//    if (source.palette) {
//        var palette = source.palette;
//        var rgbpalette = new Uint8Array(3 * 65536);
//        var textpalette = [];
//        for (var idx in palette) {
//            if (palette.hasOwnProperty(idx)) {
//                var item = palette[idx];
//                idx = parseInt(idx);
//                textpalette[idx] = item.text;
//                idx *= 3;
//                rgbpalette[idx] = parseInt(item.r);
//                rgbpalette[idx + 1] = parseInt(item.g);
//                rgbpalette[idx + 2] = parseInt(item.b);
//            }
//        }
//        source.rgbpalette = rgbpalette;
//    }
    redraw();
}