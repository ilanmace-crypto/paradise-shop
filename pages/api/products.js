import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false })
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  
  if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('products')
      .insert([req.body])
      .select()
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data[0])
  }
  
  if (req.method === 'PUT') {
    const { id } = req.query
    const { data, error } = await supabase
      .from('products')
      .update([req.body])
      .eq('id', id)
      .select()
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data[0])
  }
  
  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).send()
  }
  
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
