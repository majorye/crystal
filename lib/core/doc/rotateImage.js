var rot=0;
var rotImg=0;
function rotateImage(id,direct){
    rot=rotImg==id?rot:0;
    rotImg=rotImg==id?rotImg:id;
    if(direct==1){
        rot -= 90;
        if (rot === -90) {
            rot = 270
        }
    }else if(direct==2){
        rot += 90;
        
    }

    var rotateImg=$("[tag='rotImg_"+id+"']")[0];
    var cv=document.getElementById("canvas_"+id);
    var K = rotateImg.width;
    var L = rotateImg.height;
    
    if (!rot) {
        rot = 0
    }
    var G = Math.PI * rot / 180;
    var F = Math.round(Math.cos(G) * 1000) / 1000;
    var H = Math.round(Math.sin(G) * 1000) / 1000;
    cv.height = Math.abs(F * L) + Math.abs(H * K);
    cv.width = Math.abs(F * K) + Math.abs(H * L);
    var D = cv.getContext("2d");
    D.save();
    if (G <= Math.PI / 2) {
        D.translate(H * L, 0)
    } else {
        if (G <= Math.PI) {
            D.translate(cv.width, -F * L)
        } else {
            if (G <= 1.5 * Math.PI) {
                D.translate(-F * K, cv.height)
            } else {
                D.translate(0, -H * K)
            }
        }
    }
    D.rotate(G);
    D.drawImage(rotateImg, 0, 0, K, L);
    D.restore();
    rotateImg.style.display = "none"
    if(direct==2){
        if (rot === 270) {
            rot = -90
        }
    }
    return false;
}