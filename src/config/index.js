// Config index file
// Export all configuration settings

// Load environment variables
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  // Add additional configuration as needed
};
