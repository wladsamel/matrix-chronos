const { spawnSync } = require('child_process');

function addEnv(key, value) {
    console.log(`Setting ${key}...`);
    const result = spawnSync('cmd.exe', ['/c', 'C:\\Users\\BENI\\AppData\\Roaming\\npm\\vercel env add ' + key + ' production'], {
        input: value,
        encoding: 'utf-8',
        stdio: ['pipe', 'inherit', 'inherit']
    });
    if (result.error) console.error(result.error);
}

addEnv('MATRIX_MASTER_KEY', 'neo123');
addEnv('GEMINI_API_KEY', 'AIzaSyBKtmWsj4c7eRBC745Sb4q87nDuRhEd9DA');
addEnv('HF_API_KEY', 'hf_MCVTJIdqvbVoZwsLodqcWFHiOjrusShCDSM');
console.log('Done!');
