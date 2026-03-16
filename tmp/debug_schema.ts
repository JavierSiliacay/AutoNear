import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkSchema() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'service_request_messages' })
  // If rpc doesn't exist, try raw query if possible, or just check columns via information_schema
  
  const { data: cols, error: err } = await supabase.from('service_request_messages').select('*').limit(1)
  console.log('Sample data:', cols)
  console.log('Error if any:', err)
}

checkSchema()
