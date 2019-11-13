import { ServiceSchema } from 'moleculer';
import DbService from 'moleculer-db';
import MongooseDbAdapter from 'moleculer-db-adapter-mongoose';
import * as mongoose from 'mongoose';

export const PostsService: ServiceSchema = {
    name: 'posts',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXJ2aWNlIjoicG9zdHMiLCJpYXQiOjE1NzM2Mzk1NzN9.-JKKC7kymZHIf_zuhrS_ebBZNKNMxZZ7TU1JJwg7R2g',
    restricted: ['greeter'],
    mixins: [DbService as any],
    adapter: new MongooseDbAdapter('mongodb://localhost/moleculer-demo', {
        useUnifiedTopology: true,
        keepAlive: true,
    }),
    model:
        mongoose.models.Post ||
        mongoose.model(
            'Post',
            new mongoose.Schema({
                title: { type: String },
                content: { type: String },
                votes: { type: Number, default: 0 },
            })
        ),
};
export default PostsService;
