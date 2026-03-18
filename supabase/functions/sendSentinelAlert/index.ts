// Follow Supabase Edge Function conventions
// Create this in your Supabase Dashboard as 'sendSentinelAlert'

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = "re_your_api_key" // Placeholder

serve(async (req) => {
  const { userId, zone, co2 } = await req.json()
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Fetch User Profile for Preferences
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) return new Response("Profile not found", { status: 404 })

  console.log(`Triggering Sentinel Alert for User: ${userId} in Zone: ${zone}`)

  // 2. Multi-Channel Dispatch
  const alerts = []

  // A. SMS Dispatch (Mock/Twilio)
  if (profile.sms_enabled && profile.phone_number) {
    console.log(`[SMS Sentinel] Sending alert to ${profile.phone_number}: ⚠️ High Emission in ${zone}`)
    alerts.push("sms")
  }

  // B. Email Dispatch (Resend/Nodemailer)
  if (profile.email_enabled && profile.email) {
    console.log(`[Email Sentinel] Sending report to ${profile.email}: Environmental Health Report for ${zone}`)
    // Example Resend implementation
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    //   body: JSON.stringify({
    //     from: 'Sentinel <alerts@delhicarbon.ai>',
    //     to: [profile.email],
    //     subject: 'Environmental Health Report: Critical Zone Detected',
    //     html: `<strong>Sentinel Hub:</strong> You were detected in ${zone} with a high CO2 level of ${co2}. Please reroute.`
    //   })
    // })
    alerts.push("email")
  }

  // C. Push Notification Trigger
  if (profile.push_enabled) {
    console.log(`[Push Sentinel] Triggering background push for User: ${userId}`)
    alerts.push("push")
  }

  return new Response(JSON.stringify({ 
    success: true, 
    dispatched: alerts,
    timestamp: new Date().toISOString()
  }), {
    headers: { "Content-Type": "application/json" },
  })
})
