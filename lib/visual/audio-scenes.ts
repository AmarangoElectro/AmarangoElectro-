const scene=(key:string)=>`/assets/v16-generated/audio-scenes-v2/${key}.webp`;
export const audioBrandScenes:Readonly<Record<string,{image:string;description:string}>>={
  audisat:{image:scene("audisat"),description:"Sonido y presencia para compartir."},
  harrison:{image:scene("harrison"),description:"Dale potencia a tus encuentros."},
  joog:{image:scene("joog"),description:"Tu música, donde quieras."},
  stromberg:{image:scene("stromberg"),description:"Un nuevo espacio para tu música."},
  "ken brown":{image:scene("ken-brown"),description:"Disfrutá el sonido en grande."},
};
export const audioSectorScenes:Readonly<Record<string,string>>={
  "parlantes-portatiles":scene("parlantes-portatiles"),
  torres:scene("torres"),
  "barras-de-sonido":scene("barras-de-sonido"),
};
