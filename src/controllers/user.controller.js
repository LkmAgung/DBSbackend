const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const { ImageService } = require('../services');

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
      const { name } = req.body;
      
      // Prepare update data
      const updateData = {};
      if (name) updateData.name = name;
      
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

  async uploadProfilePicture(req, res) {
    try {
      const userId = req.user.userId;
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }
      
      // Get current user to check for existing profile picture
      const currentUser = await UserModel.getById(userId);
      
      // Delete old profile picture from Cloudinary if it exists
      if (currentUser.profile_picture) {
        try {
          const oldPublicId = ImageService.extractPublicId(currentUser.profile_picture);
          if (oldPublicId) {
            await ImageService.deleteImage(oldPublicId);
          }
        } catch (deleteError) {
          console.error('Error deleting old profile picture:', deleteError);
          // Continue with upload even if deletion fails
        }
      }
      
      // Upload new image
      const imageData = await ImageService.uploadImage(req.file);
      
      // Update user with new profile picture URL
      const updatedUser = await UserModel.update(userId, {
        profile_picture: imageData.url
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload profile picture',
        error: error.message
      });
    }
  }

  async deleteProfilePicture(req, res) {
    try {
      const userId = req.user.userId;
      
      // Get current user
      const currentUser = await UserModel.getById(userId);
      
      if (!currentUser.profile_picture) {
        return res.status(400).json({
          success: false,
          message: 'No profile picture to delete'
        });
      }
      
      // Delete from Cloudinary
      const publicId = ImageService.extractPublicId(currentUser.profile_picture);
      if (publicId) {
        await ImageService.deleteImage(publicId);
      }
      
      // Update user to remove profile picture URL
      const updatedUser = await UserModel.update(userId, {
        profile_picture: null
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json({
        success: true,
        message: 'Profile picture deleted successfully',
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Delete profile picture error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete profile picture',
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