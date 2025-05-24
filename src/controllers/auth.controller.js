const UserModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await UserModel.getByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const newUser = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        created_at: new Date()
      });
      
      // Generate token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        config.jwtSecret,
        { expiresIn: '24h' }
      );
      
      // Return user info (without password) and token
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json({
        success: true,
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to register user',
        error: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await UserModel.getByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
      
      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: '24h' }
      );
      
      // Return user info (without password) and token
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({
        success: true,
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to login',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();