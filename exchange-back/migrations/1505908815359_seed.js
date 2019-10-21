const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync(path.join(__dirname, 'sql', 'seed.sql')).toString();
exports.up = (pgm) => {
    pgm.sql(sql);
};

exports.down = (pgm) => {

};
