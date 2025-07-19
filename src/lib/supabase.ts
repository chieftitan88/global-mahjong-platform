import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zgrnszowmwsabamoobzy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpncm5zem93bXdzYWJhbW9vYnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MDE2ODQsImV4cCI6MjA2ODQ3NzY4NH0.TlqD2MPqFs1XaoJc4-BBg75dzvacE6c0u5WFM47Z1MA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 