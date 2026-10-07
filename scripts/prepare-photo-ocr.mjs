import {cpSync,mkdirSync} from "node:fs";
import path from "node:path";
const target=path.resolve("public/vendor/ocr");
mkdirSync(target,{recursive:true});
cpSync("node_modules/tesseract.js/dist/worker.min.js",path.join(target,"worker.min.js"));
cpSync("node_modules/tesseract.js-core",path.join(target,"core"),{recursive:true});
cpSync("node_modules/@tesseract.js-data/spa",path.join(target,"spa"),{recursive:true});
