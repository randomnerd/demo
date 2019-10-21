import config from 'config';

export class ConfigService {
    private config?: any;

    constructor() {
        this.config = config;
    }

    get(key: string): any {
        try {
            return this.config.get(key);
        } catch (e) { return null; }
    }
}
