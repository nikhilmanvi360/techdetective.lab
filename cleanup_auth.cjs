const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes("localStorage.getItem('token')")) {
        content = content.replace(/localStorage\.getItem\('token'\)/g, "''");
        changed = true;
    }

    if (content.includes("JSON.parse(localStorage.getItem('team') || '{}')")) {
        content = content.replace(/JSON\.parse\(localStorage\.getItem\('team'\) \|\| '\{\}'\)/g, "({} as any)");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
