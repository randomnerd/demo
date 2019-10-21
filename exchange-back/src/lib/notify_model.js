export default {
    notifyCreate(exchange, options) {
        let data = this.get({ plain: true });
        for (let channel of this.channelName()) exchange.publish(channel, { event: 'create', data });
    },

    notifyUpdate(exchange, options) {
        let data = { id: this.id };
        for (let field of options.fields) data[field] = this.get(field);
        for (let channel of this.channelName()) exchange.publish(channel, { event: 'update', data });
    },

    notifyDestroy(exchange, options) {
        for (let channel of this.channelName()) exchange.publish(channel, { event: 'destroy', data: { id: this.id } });
    }
}
