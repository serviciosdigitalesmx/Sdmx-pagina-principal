import { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';

export const getPublicTenant = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    // Usamos el cliente directamente si expone la instancia de supabase
    const { data, error } = await supabase.from('tenants').select('id, name, slug').eq('slug', slug).single();
    
    if (error || !data) return res.status(404).json({ error: 'Tenant no encontrado' });
    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};
