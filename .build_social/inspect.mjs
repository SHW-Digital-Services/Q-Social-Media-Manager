import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { FileBlob, PresentationFile } = await import(pathToFileURL('C:\\Users\\ScottHarvey-Whittle\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\@oai\\artifact-tool\\dist\\artifact_tool.mjs').href);
const p = await PresentationFile.importPptx(await FileBlob.load('C:/Users/ScottHarvey-Whittle/OneDrive - SHW/Documents/Q/Training/CS/Q Customer Service Agent Induction with Facilitator Notes.pptx'));
console.log('slides',p.slides.items.length);
const x=await p.inspect({kind:'slide,textbox,notes',maxChars:50000});
await fs.writeFile('.build_social/inspect.ndjson',x.ndjson);
console.log(x.ndjson.slice(0,2000));
