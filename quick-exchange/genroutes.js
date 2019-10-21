const DEFAULT_INTEREST = 0.005;
const DEFAULT_CURRENCIES = ['btc', 'eth', 'xmr', 'zec', 'dash', 'ltc', 'btg'];

const fs = require('fs');
const ts = new Date().getTime();
const config = require('config');
const defaultRoute = config.routes.default;
const routesConfig = './config/routes.json';
const routesBackup = `./config/routes-${ts}.json`;
let routes;
try {
    routes = require(routesConfig);
} catch (e) {
    routes = {};
}
const interest = process.argv[2] ? parseFloat(process.argv[2]) : DEFAULT_INTEREST;
const currencies = process.argv[3] ? JSON.parse(process.argv[3]) : DEFAULT_CURRENCIES;

for (const curr of currencies) {
    const neighbours = currencies.filter(c => c !== curr);
    for (const neighbour of neighbours) {
        routes[`${curr}>${neighbour}`] = { ...defaultRoute, disabled: false, interest };
    }
}

const routesJSON = JSON.stringify(routes, null, 4);
fs.copyFileSync(routesConfig, routesBackup);
fs.writeFileSync(routesConfig, routesJSON);
console.log(require('config').routes);
