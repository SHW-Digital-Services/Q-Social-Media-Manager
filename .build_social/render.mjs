import fs from 'node:fs/promises'; import {pathToFileURL} from 'node:url';
const {FileBlob,PresentationFile}=await import(pathToFileURL('C:\\Users\\ScottHarvey-Whittle\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\@oai\\artifact-tool\\dist\\artifact_tool.mjs').href);
const p=await PresentationFile.importPptx(await FileBlob.load('E:/dev/Q-Social-Media-Manager/.build_social/draft.pptx'));
console.log('loaded',p.slides.items.length);
for(let i=0;i<p.slides.items.length;i++){const b=await p.export({slide:p.slides.items[i],format:'png',scale:1}); await fs.writeFile(`.build_social/slide-${String(i+1).padStart(2,'0')}.png`,new Uint8Array(await b.arrayBuffer()));}
console.log('rendered');
const q=await p.inspect({kind:'slide,textbox,notes',maxChars:1000000}); await fs.writeFile('.build_social/final-inspect.ndjson',q.ndjson);
