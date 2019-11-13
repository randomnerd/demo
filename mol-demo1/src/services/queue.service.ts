import { ServiceSchema, Service } from 'moleculer';
// import QueueService1 from 'moleculer-bull';
import { createService, IQueueService } from '../mixins/bull';

const q1 = createService();
// const q2 = QueueService1();
// console.log(q1, q1.prototype, q1.__proto__, q2, q2.prototype, q2.__proto__);
export const QueueService: ServiceSchema<IQueueService> = {
    name: 'queue1',
    mixins: [q1],
    queues: {
        'sample.task'(job) {
            this.logger.info('New job received!', job.data);
            job.progress(10);

            return this.Promise.resolve({
                done: true,
                id: job.data.id,
                worker: process.pid,
            });
        },
    },
    actions: {
        addJob(payload: any) {
            // return this.logger.info(this);
        }
    },
    async started(this: Service<ServiceSchema<IQueueService>>) {
        let id = 1;
        this.timer = setInterval(() => {
            this.logger.info('Add a new job. ID:', id);
            this.createJob('sample.task', { id: id++, pid: process.pid });
        }, 3000);

        this.getQueue('sample.task').on('global:progress', (jobID, progress) => {
            this.logger.info(`Job #${jobID} progress is ${progress}%`);
        });

        this.getQueue('sample.task').on('global:completed', (jobID, res) => {
            this.logger.info(`Job #${jobID} completed!. Result:`, res);
        });
    },
    async stopped() {
        clearInterval(this.timer);
        this.getQueue('sample.task').removeAllListeners();
    }
};
export default QueueService;
