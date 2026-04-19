import { cpSync, mkdirSync } from 'fs';

const vendorDir = 'js/vendor';
mkdirSync(vendorDir, { recursive: true });

cpSync('node_modules/hls.js/dist/hls.min.js', `${vendorDir}/hls.min.js`);
cpSync('node_modules/plyr/dist/plyr.min.js', `${vendorDir}/plyr.min.js`);
cpSync('node_modules/plyr/dist/plyr.css', `${vendorDir}/plyr.css`);

console.log('Vendor files copied to', vendorDir);
