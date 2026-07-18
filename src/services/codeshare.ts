import supabase from "./supabase";

export const getSessionInfo = async (unique_id) => {
  const { data, error } = await supabase
    .from('coderooms')
    .select('*')
    .eq('unique_id', unique_id)
    .single()

  if (error) {
    console.error('Error fetching code share info:', error)
    return null
  }

  return data
}

export const subscribeToChanges = (unique_id, callback) => {
  const channel = supabase.channel(`coderooms-channel-${unique_id}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'coderooms', filter: `unique_id=eq.${unique_id}` },
      (payload) => {
        console.log('Change received!', payload)
        callback(payload)
      }
    )
    .subscribe()

  return channel
}

const generateShortId = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length]
  }
  return result
}

export const createNewSession = async (message = "", language = "text", updated_by = "anonymous") => {
  const unique_id = generateShortId()
  const { data, error } = await supabase
    .from('coderooms')
    .insert([{ message, language, unique_id, updated_by }])
    .select()
    .single()

  if (error) {
    console.error('Error creating new session:', error)
    return null
  }

  return data
}

export const updateSession = async (unique_id, message, language, updated_by = "anonymous") => {
  const { data, error } = await supabase
    .from('coderooms')
    .update({ message, language, updated_by })
    .eq('unique_id', unique_id)
    .select()
    .single()

  if (error) {
    console.error('Error updating session:', error)
    return null
  }

  return data
}




// const channels = supabase.channel('coderooms-channel')
//   .on(
//     'postgres_changes',
//     { event: '*', schema: 'public', table: 'coderooms' },
//     (payload) => {
//       console.log('Change received!', payload)
//     }
//   )
//   .subscribe()


// const updateresp = await supabase
//   .from('coderooms')
//   .update({ message: 'Hello Ji' })
//   .eq('unique_id', 'asdad')
//   .select()

//   console.log('Update result:', { data: updateresp.data, error: updateresp.error })


// const resp = await supabase
//   .from('coderooms')
//   .insert([
//     { message: 'someValue', unique_id: Date.now().toString() },
//   ])
//   .select()

// console.log('Insert result:', { data: resp.data, error: resp.error })


// let getallresp = await supabase
//   .from('coderooms')
//   .select('*')

//   console.log('Select result:', { data: getallresp.data, error: getallresp.error })

