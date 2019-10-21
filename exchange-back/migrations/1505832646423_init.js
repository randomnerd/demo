const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync(path.join(__dirname, 'sql', 'init.sql')).toString();
exports.up = (pgm) => {
    pgm.sql(sql);
};

exports.down = (pgm) => {

};
