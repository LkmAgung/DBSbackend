const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');

class UserController {
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await UserModel.getById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get user profile',
        error: error.message
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { name, profile_picture } = req.body;
      
      // Prepare update data
      const updateData = {};
      if (name) updateData.name = name;
      if (profile_picture) updateData.profile_picture = profile_picture;
      
      // Update user
      const updatedUser = await UserModel.update(userId, updateData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update user profile',
        error: error.message
      });
    }
  }

  async updatePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;
      
      // Get user
      const user = await UserModel.getById(userId);
      
      // Check current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await UserModel.update(userId, { password: hashedPassword });
      
      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update password',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();