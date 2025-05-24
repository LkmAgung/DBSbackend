const supabase = require('../utils/supabase/supabaseClient');

class PredictionModel {
  async getById(id) {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('predictions')
      .select(`
        *,
        health_records (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async create(predictionData) {
    const { data, error } = await supabase
      .from('predictions')
      .insert([predictionData])
      .select();
    
    if (error) throw error;
    return data[0];
  }
}

module.exports = new PredictionModel();