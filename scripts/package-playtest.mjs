/** Make an offline distribution of the existing candidate; never changes gameplay. */
import {readFile,writeFile,mkdir,readdir,mkdtemp,cp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join,resolve,relative,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';

const root=resolve(import.meta.dirname,'..');
process.chdir(root);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const gamePaths=['src','public','index.html','vite.config.ts','tsconfig.json','package-lock.json','.node-version'];
const sourceCommit=git('log','-1','--format=%H','--',...gamePaths);
execFileSync('git',['diff','--exit-code',sourceCommit,'--',...gamePaths],{stdio:'pipe'});
if(git('ls-files','--others','--exclude-standard','--',...gamePaths))throw new Error('Commit game changes before packaging a reproducible playtest');
const dist=resolve('dist');
function assetPath(reference,base=dist){
 const file=resolve(base,reference.split(/[?#]/)[0]);
 const rel=relative(dist,file);
 if(rel.startsWith('..')||rel.startsWith('/'))throw new Error('Asset escapes the static build');
 return file;
}
const dataUrl=async(file,type)=>`data:${type};base64,${(await readFile(file)).toString('base64')}`;
const pkg=JSON.parse(await readFile('package.json','utf8'));
let html=await readFile(join(dist,'index.html'),'utf8');
const jsReference=html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const cssReference=html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/);
if(!jsReference||!cssReference)throw new Error('Expected one entry script and stylesheet');
const jsFile=assetPath(jsReference[1]),cssFile=assetPath(cssReference[1]);
const js=await readFile(jsFile,'utf8');
if(/\bimport\s*(?:\(|["'{*])/.test(js))throw new Error('Offline export needs a single bundled script without imports');
let css=await readFile(cssFile,'utf8');
for(const match of [...css.matchAll(/url\(([^)]+)\)/g)]){
 const reference=match[1].replace(/^["']|["']$/g,'');
 if(reference.startsWith('data:'))continue;
 if(!reference.endsWith('.woff2'))throw new Error(`Unsupported offline stylesheet asset: ${reference}`);
 css=css.replaceAll(match[0],`url("${await dataUrl(assetPath(reference,dirname(cssFile)),'font/woff2')}")`);
}
const licenses={
 'DM-Sans-OFL.txt':await readFile('public/licenses/DM-Sans-OFL.txt','utf8'),
 'Fraunces-OFL.txt':await readFile('public/licenses/Fraunces-OFL.txt','utf8'),
};
html=html.replace(jsReference[0],`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`)
 .replace(cssReference[0],`<style>${css.replace(/<\/style/gi,'<\\/style')}</style>`)
 .replace('href="./favicon.svg"',`href="${await dataUrl(join(dist,'favicon.svg'),'image/svg+xml')}"`)
 .replace('</head>',`<script type="application/json" id="bundled-font-licenses">${JSON.stringify(licenses).replace(/</g,'\\u003c')}</script>\n</head>`);
if(/(?:src|href)="\.\//.test(html)||/url\(["']?(?:\.\/|\.\.\/)/.test(html))throw new Error('External local assets remain in offline HTML');
await mkdir('playtest',{recursive:true});
const htmlName='Squirrel-Control-Playtest.html';
await writeFile(join('playtest',htmlName),html);
const work=await mkdtemp(join(tmpdir(),'squirrel-playtest-'));
try{
 await writeFile(join(work,htmlName),html);
 for(const file of ['START-HERE.txt','FEEDBACK.md','serve-playtest.py'])await cp(join('docs/playtesting',file),join(work,file));
 await mkdir(join(work,'licenses'));
 for(const [name,contents] of Object.entries(licenses))await writeFile(join(work,'licenses',name),contents);
 const files={};
 for(const file of [htmlName,'START-HERE.txt','FEEDBACK.md','serve-playtest.py',...Object.keys(licenses).map(name=>'licenses/'+name)])files[file]=sha(await readFile(join(work,file)));
 const manifest={
  schemaVersion:1,version:pkg.version,gameSourceCommit:sourceCommit,
  sourceCommitTimeUTC:git('show','-s','--format=%cI',sourceCommit),
  approvedArtCommit:'8e6c31eb81d7a8438bdfc72b001fac24d866dafc',
  sourceBuildJavascript:{file:basename(jsFile),sha256:sha(js)},
  packagingRecipeSha256:sha(await readFile('scripts/package-playtest.mjs')),
  files,
 };
 const manifestText=JSON.stringify(manifest,null,2)+'\n';
 await writeFile(join(work,'MANIFEST.json'),manifestText);
 await writeFile('playtest/MANIFEST.json',manifestText);
 const archiveName=`squirrel-control-room1-${sourceCommit.slice(0,7)}-playtest.zip`;
 const archive=resolve('playtest',archiveName);
 execFileSync('python3',['-c',[
  'import pathlib,zipfile,sys,datetime',
  'root=pathlib.Path(sys.argv[1]); timestamp=datetime.datetime.fromtimestamp(int(sys.argv[3]),datetime.timezone.utc)',
  'with zipfile.ZipFile(sys.argv[2],"w",compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:',
  ' for file in sorted(root.rglob("*")):',
  '  if file.is_file():',
  '   info=zipfile.ZipInfo(file.relative_to(root).as_posix(),timestamp.timetuple()[:6])',
  '   info.compress_type=zipfile.ZIP_DEFLATED; info.external_attr=0o100644 << 16',
  '   archive.writestr(info,file.read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)',
 ].join('\n'),work,archive,git('show','-s','--format=%ct',sourceCommit)]);
 const sums=[];
 for(const name of [htmlName,'MANIFEST.json',archiveName])sums.push(`${sha(await readFile(join('playtest',name)))}  ${name}`);
 await writeFile('playtest/SHA256SUMS.txt',sums.join('\n')+'\n');
 console.log(JSON.stringify({gameSourceCommit:sourceCommit,archive:relative(root,archive),html:'playtest/'+htmlName,htmlBytes:Buffer.byteLength(html),archiveBytes:(await readFile(archive)).length}));
}finally{await rm(work,{recursive:true,force:true});}
