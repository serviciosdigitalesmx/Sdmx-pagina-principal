import { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // Tu lógica de webhook aquí
    return res.status(200).json({ received: true });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};
