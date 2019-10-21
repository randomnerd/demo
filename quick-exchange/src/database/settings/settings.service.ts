import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as _ from 'lodash';
import { DeepPartial, In, Like, Repository } from 'typeorm';
import { ConfigService } from '~config/config.service';
import { ExchangeDefaultRoute, ExchangeRoute, Partner } from '~private-api/private-api.dto';
import { Setting } from './setting.entity';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Setting)
        private readonly settings: Repository<Setting>,
        private readonly config: ConfigService,
    ) { }

    merge(rootKey: string, data: Array<{ key: string, value: any }>) {
        const root = data.find(o => o.key === rootKey) || { value: null };
        const result = { [rootKey]: root.value };
        for (const { key, value } of data) {
            if (key === rootKey) continue;
            const oldValue = _.get(result, key, {});
            const objects = typeof oldValue === 'object' && typeof value === 'object';
            const newValue = objects ? _.merge(oldValue, value) : value;
            _.set(result, key, newValue);
        }
        return result[rootKey];
    }

    idObjToArray(obj: { [id: string]: any }) {
        return Object.entries(obj).map(([ id, value ]) => (
            { id, ...value }
        ));
    }

    async getArray(key: string, configOnly: boolean = false, saveToDb: boolean = true): Promise<any[]> {
        return this.idObjToArray(await this.get(key, configOnly, saveToDb));
    }

    // lookup a setting in DB or try to get it from config
    async get(key: string, configOnly: boolean = false, saveToDb: boolean = true): Promise<any> {
        if (configOnly) return this.config.get(key);
        const envName = this.config.get('env');
        const env = In([ 'local', 'default', envName ]);
        const found = await this.settings.find({
            cache: 60 * 1000,
            where: [
                { env, key },
                { env, key: Like(`${key}.%`) },
            ],
        });
        if (!found.length) {
            const val = this.config.get(key);
            if (saveToDb && val) await this.set(key, val);
            return val || null;
        }
        // config value
        const confValue = this.config.get(key);
        // default value
        let value = this.merge(key, found.filter(s => s.env === 'default')) || null;
        let objValue = typeof value === 'object';
        // environment value
        const envValue = this.merge(key, found.filter(s => s.env === envName)) || null;
        // local value
        const locValue = this.merge(key, found.filter(s => s.env === 'local')) || null;

        if (envValue) {
            if (objValue && typeof envValue === 'object') value = _.defaultsDeep(envValue, value);
            else value = envValue;
            objValue = typeof value === 'object';
        }

        if (locValue) {
            if (objValue && typeof locValue === 'object') value = _.defaultsDeep(locValue, value);
            else value = locValue;
        }
        return objValue && typeof confValue === 'object' ? _.defaultsDeep(value, confValue) : value;
    }

    set(key: string, value: any, env: string = 'default'): Promise<Setting> {
        return this.settings.save({ env, key, value });
    }

    async getExchangeRoute(source: string, target: string): Promise<ExchangeRoute> {
        const defaultRoute = await this.getDefaultExchangeRoute();
        const key = `routes.${source}>${target}`;
        const route: ExchangeRoute = await this.get(key);
        if (!route) return defaultRoute;
        if (route.disabled === undefined) route.disabled = defaultRoute.disabled;
        if (route.interest === undefined) route.interest = defaultRoute.interest;
        return route;
    }

    async getDefaultExchangeRoute(): Promise<ExchangeRoute> {
        return this.get('routes.default');
    }

    async setExchangeRoute(
        value: DeepPartial<ExchangeRoute>,
        env: string = 'default',
    ): Promise<ExchangeRoute> {
        const defaultRoute = await this.getDefaultExchangeRoute();
        value = { ...defaultRoute, ...value };
        const { source, target } = value;
        const key = `routes.${source}>${target}`;
        const route = await this.settings.save({ env, key, value });
        return route.value;
    }

    async setDefaultExchangeRoute(
        value: DeepPartial<ExchangeDefaultRoute>,
        env: string = 'default',
    ): Promise<ExchangeRoute> {
        const key = `routes.default`;
        const route = await this.settings.save({ env, key, value });
        return route.value;
    }

    async getRoutes(): Promise<ExchangeRoute[]> {
        const routes = await this.getArray('routes', false, false);
        return routes.map(route => {
            if (route.id === 'default') return;
            const [ source, target ] = route.id.split('>');
            return new ExchangeRoute({ source, target, ...route });
        }).filter(r => !!r);
    }

    async getPartners(): Promise<Partner[]> {
        return this.getArray('partners', false, false);
    }

    async getPartner(id: string): Promise<Partner> {
        const partner = await this.get(`partners.${id}`);
        return partner ? new Partner(partner) : null;
    }

    async setPartner(partner: Partner) {
        const data = _.clone(partner);
        delete data.id;
        return this.set(`partners.${partner.id}`, data);
    }

    async setPartnerCheque(id: string, cheque: string) {
        const partner = await this.getPartner(id);
        if (!partner) return;
        partner.cheque = cheque;
        return this.setPartner(partner);
    }

    async getPartnerCheque(id: string): Promise<string> {
        const partner = await this.getPartner(id);
        if (!partner) return null;
        return partner.cheque;
    }
}
