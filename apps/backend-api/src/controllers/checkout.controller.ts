import { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';

export const createCheckout = async (req: Request, res: Response) => {
  try {
    // Tu lógica de checkout aquí
    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};
