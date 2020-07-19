# poc2-dashboard

1. Ensure that you have installed Node.js >= 12.16.2 and Npm >= 6.14.5
2. Install Typescript globally: `npm install typescript -g`

## 1. Telemetry

1. `cd telemetry && tsc`
2. `cp config.json build;cp db/mysql_js.js build/db`
3. `cd build && node main.js`

## 2. Chain

1. `cd chain && tsc`
2. `cp db/mysql_js.js build/db`
3. `cd build && node main.js`

## 3. Frontend

**TBD**
