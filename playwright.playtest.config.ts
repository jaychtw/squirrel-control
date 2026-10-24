import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
export default defineConfig({
 testDir:'./playtest-tests',fullyParallel:true,workers:2,timeout:30000,
 reporter:[['list'],['json',{outputFile:'test-results/playtest-results.json'}]],
 outputDir:'test-results/playtest',
 use:{browserName:'chromium',launchOptions:{executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']},screenshot:'only-on-failure',trace:'retain-on-failure'},
 webServer:{command:'python3 docs/playtesting/serve-playtest.py --directory playtest --port 4175',url:'http://127.0.0.1:4175',reuseExistingServer:false,timeout:15000},
});
