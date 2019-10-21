import mongoose from 'mongoose';

export const schema = new mongoose.Schema({
    uid: {
        type: mongoose.Types.ObjectId,
        required: true,
        index: true
    },
    bid: {
        type: mongoose.Types.ObjectId,
        required: true,
        index: true
    },
    i: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        index: true,
        required: true
    },
    script: {
        type: String,
        index: true,
        required: true
    },
    redeemScript: {
        type: String,
        required: true
    },
    key: {
        type: String,
        index: true,
        required: true
    }
});

Object.assign(schema.methods, {
});

const Alias = mongoose.model('Alias', schema);
export default Alias;
