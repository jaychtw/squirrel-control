import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
process.chdir(root);
const gameSourceCommit='4c1f7886148626b2c9ff3f59d5fa0bdddee4b3de';
const approvedJavaScriptSha256='55403aec683d0bc3e56d8eb356594039e4f242b10f6baff726e492c0b9121871';
const paths=['src','public','index.html','vite.config.ts','tsconfig.json','package-lock.json','.node-version'];
execFileSync('git',['diff','--exit-code',gameSourceCommit,'--',...paths],{stdio:'inherit'});
const assets=await readdir('dist/assets');
const js=assets.filter(name=>name.endsWith('.js'));
if(js.length!==1)throw new Error('Expected one approved game bundle');
const javascript=await readFile(`dist/assets/${js[0]}`);
const sha256=createHash('sha256').update(javascript).digest('hex');
if(sha256!==approvedJavaScriptSha256)throw new Error('Game bundle differs from the human-approved candidate');
const manifest={
  releaseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  gameSourceCommit,
  version:JSON.parse(await readFile('package.json','utf8')).version,
  javascript:{path:`assets/${js[0]}`,sha256},
};
await writeFile('dist/release.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('dist/.nojekyll','');
console.log(JSON.stringify(manifest,null,2));
