const $=s=>document.querySelector(s);
const fileInput=$("#fileInput"), drop=$("#dropZone"), choose=$("#chooseBtn"), workspace=$("#workspace");
const preview=$("#previewImg"), canvas=$("#resultCanvas"), fileName=$("#fileName"), fileInfo=$("#fileInfo");
const enhance=$("#enhanceBtn"), download=$("#downloadBtn"), resultInfo=$("#resultInfo");
let image=null, scale=2;

choose.onclick=()=>fileInput.click();
drop.onclick=e=>{if(e.target===drop||e.target.closest(".upload-icon"))fileInput.click()};
fileInput.onchange=e=>loadFile(e.target.files[0]);

["dragenter","dragover"].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.add("drag")}));
["dragleave","drop"].forEach(x=>drop.addEventListener(x,e=>{e.preventDefault();drop.classList.remove("drag")}));
drop.addEventListener("drop",e=>loadFile(e.dataTransfer.files[0]));
$("#resetBtn").onclick=()=>{workspace.classList.add("hidden");drop.classList.remove("hidden");fileInput.value="";download.disabled=true};

function loadFile(file){
 if(!file||!file.type.startsWith("image/"))return;
 const url=URL.createObjectURL(file); image=new Image();
 image.onload=()=>{
   preview.src=url; fileName.textContent=file.name;
   fileInfo.textContent=`${image.naturalWidth} × ${image.naturalHeight}px • ${(file.size/1024/1024).toFixed(2)} MB`;
   drop.classList.add("hidden");workspace.classList.remove("hidden");canvas.classList.add("hidden");preview.classList.remove("hidden");
   resultInfo.textContent="Belum diproses";download.disabled=true;
 };
 image.src=url;
}

document.querySelectorAll(".scale-btn").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".scale-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");scale=+b.dataset.scale;
});
["sharpness","clarity","contrast"].forEach(id=>{
 const el=$("#"+id), out=$("#"+id.replace("ness","Value").replace("ity","Value").replace("contrast","contrastValue"));
 const update=()=>{ if(id==="sharpness")$("#sharpValue").textContent=el.value+"%"; if(id==="clarity")$("#clarityValue").textContent=el.value+"%"; if(id==="contrast")$("#contrastValue").textContent=el.value+"%" };
 el.oninput=update;
});

enhance.onclick=()=>process();
function process(){
 if(!image)return;
 enhance.disabled=true;enhance.textContent="Memproses…";
 requestAnimationFrame(()=>{
   const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
   canvas.width=w;canvas.height=h;const c=canvas.getContext("2d",{willReadFrequently:true});
   c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";c.drawImage(image,0,0,w,h);
   let src=c.getImageData(0,0,w,h), data=src.data;
   const clarity=+$("#clarity").value/100, contrast=+$("#contrast").value;
   const factor=(259*(contrast+255))/(255*(259-contrast));
   for(let i=0;i<data.length;i+=4){
     let r=data[i],g=data[i+1],b=data[i+2];
     const avg=(r+g+b)/3;
     r += (r-avg)*clarity*.35; g += (g-avg)*clarity*.35; b += (b-avg)*clarity*.35;
     data[i]=Math.max(0,Math.min(255,factor*(r-128)+128));
     data[i+1]=Math.max(0,Math.min(255,factor*(g-128)+128));
     data[i+2]=Math.max(0,Math.min(255,factor*(b-128)+128));
   }
   c.putImageData(src,0,0);
   const sharp=+$("#sharpness").value/100;
   if(sharp>0) sharpen(c,w,h,sharp);
   preview.classList.add("hidden");canvas.classList.remove("hidden");
   resultInfo.textContent=`HD ${scale}× • ${w} × ${h}px`;
   download.disabled=false;enhance.disabled=false;enhance.textContent="✨ Tingkatkan HD";
 });
}
function sharpen(c,w,h,amount){
 const src=c.getImageData(0,0,w,h), out=c.createImageData(w,h), s=src.data,d=out.data;
 const a=amount*.9;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;
   for(let ch=0;ch<3;ch++){
     const center=s[i+ch];
     const l=s[((y*w+Math.max(0,x-1))*4)+ch], r=s[((y*w+Math.min(w-1,x+1))*4)+ch];
     const u=s[((Math.max(0,y-1)*w+x)*4)+ch], dn=s[((Math.min(h-1,y+1)*w+x)*4)+ch];
     d[i+ch]=Math.max(0,Math.min(255,center+a*(4*center-l-r-u-dn)));
   }
   d[i+3]=s[i+3];
 }
 c.putImageData(out,0,0);
}
download.onclick=()=>{
 if(!canvas.width)return;
 const a=document.createElement("a");
 a.download=(fileName.textContent.replace(/\.[^.]+$/,"")||"image")+"_HD.png";
 a.href=canvas.toDataURL("image/png");a.click();
};