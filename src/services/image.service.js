const { cloudinary } = require('../config/cloudinary');

class ImageService {
  async uploadImage(file) {
    try {
      // File is already uploaded to Cloudinary via multer middleware
      // Return the secure URL
      return {
        url: file.path,
        publicId: file.filename
      };
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  async deleteImage(publicId) {
    try {
      if (!publicId) return;
      
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  // Extract public ID from Cloudinary URL
  extractPublicId(url) {
    if (!url) return null;
    
    try {
      // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const publicId = filename.split('.')[0];
      
      // Include folder path if it exists
      const folderIndex = parts.indexOf('upload') + 2; // Skip version number
      if (folderIndex < parts.length - 1) {
        const folderPath = parts.slice(folderIndex, -1).join('/');
        return `${folderPath}/${publicId}`;
      }
      
      return publicId;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }
}

module.exports = new ImageService();