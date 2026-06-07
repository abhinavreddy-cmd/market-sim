import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  plain_password: {  
    type: String,
    select: false  
  },
  team_id: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['STUDENT', 'ADMIN'],
    default: 'STUDENT',
  },
  game_id: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true,
});


userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.plain_password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
