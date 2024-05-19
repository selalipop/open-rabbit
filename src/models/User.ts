import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userId: String,
    accessToken: String,
    refreshToken: String,
    expiresIn: Number,
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
