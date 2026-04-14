import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync(':memory:');
console.log('Success with node:sqlite!');
db.close();
