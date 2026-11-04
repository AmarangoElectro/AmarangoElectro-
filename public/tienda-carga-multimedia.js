/* AmarangoElectro tienda vieja — selección de hasta 3 fotos o un video al crear.
 * Solo conserva File en memoria; no envía nada antes de confirmar el producto.
 */
(function(){
  'use strict';
  var fotos=[],video=null,urls=[];
  function aviso(msg){if(typeof window.mostrarToast==='function')window.mostrarToast(msg);else alert(msg);}
  function limpiarURLs(){urls.forEach(function(url){URL.revokeObjectURL(url);});urls=[];}
  function limpiar(){
    limpiarURLs();fotos=[];video=null;
    var view=document.getElementById('carga-foto-preview');
    if(view)view.replaceChildren();
    ['carga-foto-input','carga-video-input'].forEach(function(id){
      var input=document.getElementById(id);if(input)input.value='';
    });
  }
  function valido(file,tipo){
    if(!file||!file.size)return false;
    return tipo==='foto'?/^(image\/jpeg|image\/png|image\/webp)$/.test(file.type)&&file.size<=18*1024*1024
      :/^(video\/mp4|video\/webm)$/.test(file.type)&&file.size<=20*1024*1024;
  }
  function crear(tag,cls,texto){var el=document.createElement(tag);if(cls)el.className=cls;if(texto!=null)el.textContent=texto;return el;}
  function pintar(){
    var box=document.getElementById('carga-foto-preview');if(!box)return;
    limpiarURLs();box.replaceChildren();
    if(!fotos.length&&!video){
      box.appendChild(crear('p','ae-carga-media-note','Elegí hasta 3 fotos en una sola selección o agregalas de a una. También podés optar por 1 video.'));
      return;
    }
    var heading=crear('div','ae-carga-media-heading',video?'🎥 Un video seleccionado':fotos.length+' de 3 fotos seleccionadas');
    box.appendChild(heading);
    var row=crear('div','ae-carga-media-preview');
    fotos.forEach(function(file,index){
      var item=crear('div','ae-carga-media-thumb'),url=URL.createObjectURL(file);
      urls.push(url);
      var img=crear('img');img.src=url;img.alt=index===0?'Imagen principal':'Imagen adicional '+index;
      var label=crear('span','',index===0?'Principal':('Foto '+(index+1)));
      var remove=crear('button','ae-carga-media-remove','✕');remove.type='button';remove.title='Quitar esta foto';
      remove.addEventListener('click',function(){fotos.splice(index,1);pintar();});
      item.append(img,label,remove);row.appendChild(item);
    });
    if(video){
      var clip=crear('div','ae-carga-media-video');
      clip.appendChild(crear('strong','','🎥 '+video.name));
      clip.appendChild(crear('span','',' · '+(video.size/1048576).toFixed(1)+' MB'));
      var removeVideo=crear('button','ae-carga-media-remove','✕');removeVideo.type='button';removeVideo.title='Quitar video';
      removeVideo.addEventListener('click',function(){video=null;pintar();});
      clip.appendChild(removeVideo);row.appendChild(clip);
    }
    box.appendChild(row);
    box.appendChild(crear('p','ae-carga-media-note',video?'El video se reproduce solo al tocarlo.':'La primera foto será la portada si el producto no tiene una; las demás irán a la galería.'));
  }
  function agregarFotos(fileList){
    var incoming=Array.from(fileList||[]);
    if(!incoming.length)return;
    if(video){aviso('Para agregar fotos, quitá primero el video seleccionado.');return;}
    if(incoming.some(function(file){return !valido(file,'foto');})){
      aviso('Elegí JPG, PNG o WebP, máximo 18 MB cada foto.');return;
    }
    if(fotos.length+incoming.length>3){
      aviso('Máximo 3 fotos por producto. Elegí menos o quitá alguna.');return;
    }
    fotos=fotos.concat(incoming);pintar();
  }
  function agregarVideo(fileList){
    var file=fileList&&fileList[0];
    if(!file)return;
    if(fotos.length){aviso('Para elegir un video, quitá primero las fotos seleccionadas.');return;}
    if(!valido(file,'video')){aviso('El video debe ser MP4 o WebM, máximo 20 MB.');return;}
    video=file;pintar();
  }
  function seleccion(){return {fotos:fotos.slice(),video:video};}
  function tomar(){var estado=seleccion();limpiar();return estado;}
  function abrir(){pintar();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pintar,{once:true});
  else pintar();
  window.AECargaMultimedia={agregarFotos:agregarFotos,agregarVideo:agregarVideo,seleccion:seleccion,tomar:tomar,limpiar:limpiar,abrir:abrir};
})();