const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    discriminator: {
        type: String,
        required: true
    },
    fullTag: {
        type: String,
        required: true,
        unique: true,
        // Format: "username#1234"
    },
    password: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.index({ username: 1, password: 1 });

userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Pre-save hook to hash password
userSchema.pre('save', async function() {
    // If password hasn't changed or is null, skip hashing
    if (!this.isModified('password') || !this.password) {
        return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);