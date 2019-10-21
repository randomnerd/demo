import express from 'express';
import path from 'path';
import healthChecker from 'sc-framework-health-check';
import exchange from './src';

export const run = function (worker) {
  console.log('   >> Worker PID:', process.pid);

  let httpServer = worker.httpServer;
  let app = express();
  healthChecker.attach(worker, app);
  httpServer.on('request', app);

  exchange(worker);
};
