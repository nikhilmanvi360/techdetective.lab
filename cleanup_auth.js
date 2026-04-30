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

    // Replace token usage with null string
    if (content.includes("localStorage.getItem('token')")) {
        content = content.replace(/localStorage\.getItem\('token'\)/g, "''");
        changed = true;
    }

    // Replace team usage with useOutletContext where applicable
    // This is trickier to do via regex for all cases, but we can do a simple replacement for the components we know.
    // Actually, for team, we'll just let the components read it from useOutletContext instead.
    if (content.includes("localStorage.getItem('team')")) {
        // We will just do a manual replace for the team ones later, but let's see if we can do a quick fix:
        // We'll replace it with a dummy empty object temporarily, and fix the 5 files manually to useOutletContext.
        content = content.replace(/JSON\.parse\(localStorage\.getItem\('team'\) \|\| '\{\}'\)/g, "({} as any)");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
