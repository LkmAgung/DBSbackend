const supabase = require('../utils/supabase/supabaseClient');

class HealthRecordModel {
  async getById(id) {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async create(recordData) {
    const { data, error } = await supabase
      .from('health_records')
      .insert([recordData])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async update(id, updates) {
    const { data, error } = await supabase
      .from('health_records')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async delete(id) {
    const { error } = await supabase
      .from('health_records')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}

module.exports = new HealthRecordModel();