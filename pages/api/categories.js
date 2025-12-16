import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id')
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  
  res.setHeader('Allow', ['GET'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
