
export const getPublicTenant = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, slug, settings')
      .eq('slug', slug)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Tenant no encontrado' });
    return res.status(200).json(data);
  } catch (e: any) { return res.status(400).json({ error: e.message }); }
};

export const createPublicRequest = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('public_requests').insert(req.body);
    if (error) throw error;
    return res.status(201).json({ success: true });
  } catch (e: any) { return res.status(400).json({ error: e.message }); }
};
