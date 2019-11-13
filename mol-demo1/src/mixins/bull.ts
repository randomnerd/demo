/*
 * moleculer-bull
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer-addons)
 * MIT Licensed
 */

import Bull, { Job, Queue } from 'bull';
import { ActionHandler, ServiceSchema } from 'moleculer';
export interface IQueueService extends ServiceSchema {
    $queues?: { [name: string]: Queue };
    methods: {
        createJob(name: string, jobName: any, payload: any, opts: any): Job;
        getQueue(name: string): Queue;
    };
}

export interface IHandler {
    name?: string;
    concurrency?: number;
    process: (...args: any[]) => any;
}

export function createService(url?: string, queueOpts?: Bull.QueueOptions): IQueueService {
    return {
        name: 'bull',
        methods: {
            createJob(name: string, jobName: string, payload: any, opts: any): Job {
                return this.getQueue(name).add(jobName, payload, opts);
            },
            getQueue(name: string): Queue {
                if (!this.$queues[name]) {
                    this.$queues[name] = Bull(name, url, queueOpts);
                }
                return this.$queues[name];
            }
        },
        created() {
            console.log('!!!!!!!!!', Object.prototype.toString.apply(this));
            const _: { [name: string]: Queue } = this.$queues = {};
        },
        async started() {
            const setHandler = (handler: IHandler, name: string) => {
                const args = [];
                if (handler.name) args.push(handler.name);
                if (handler.concurrency) args.push(handler.concurrency);
                args.push(handler.process.bind(this));
                this.getQueue(name).process(...args);
            };

            if (!this.schema.queues) return;
            Object.entries(this.schema.queues).forEach(([name, fn]) => {
                if (Array.isArray(fn))
                    return fn.forEach(h => setHandler(h, name));
                if (typeof fn === 'function')
                    return this.getQueue(name).process(fn.bind(this));
                return setHandler(fn as IHandler, name);
            });
        }
    };
}
export default createService;
