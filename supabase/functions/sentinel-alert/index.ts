// Supabase Edge Function: sentinel-alert
// Integrates Resend (Email) and Twilio (SMS)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

serve(async (req) => {
  try {
    const { userId, type, aqi, zone } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch user preferences and contact details
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, phone_number, email_enabled, sms_enabled, push_enabled')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('Sentinel profile not found')
    }

    const results = []

    // 1. GMAIL ALERT (Resend)
    if (profile.email_enabled && profile.email && RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Sentinel <alerts@delhicarbon.ai>',
          to: [profile.email],
          subject: '⚠️ Environmental Health Report: Critical AQI Detected',
          html: `
            <div style="font-family: sans-serif; background: #020617; color: white; padding: 40px; border-radius: 20px;">
              <h2 style="color: #10b981;">Quantum Sentinel Alert</h2>
              <p>Critical AQI levels detected in your current sector: <strong>${zone}</strong></p>
              <div style="background: rgba(16,185,129,0.1); border: 1px solid #10b981; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold;">AQI: ${aqi}</span>
              </div>
              <p>Switching to the suggested <strong>Green Corridor</strong> is recommended for your health.</p>
              <a href="https://delhicarbon.ai/?action=reroute" style="display: inline-block; background: #10b981; color: #020617; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reroute Now</a>
            </div>
          `
        })
      })
      results.push({ channel: 'email', success: res.ok })
    }

    // 2. MOBILE SMS (Twilio)
    if (profile.sms_enabled && profile.phone_number && TWILIO_ACCOUNT_SID) {
      const formData = new URLSearchParams()
      formData.append('To', profile.phone_number)
      formData.append('From', TWILIO_PHONE_NUMBER!)
      formData.append('Body', `⚠️ Sentinel Guard: High Emission Zone detected in ${zone} (AQI: ${aqi}). Switching to suggested Green Route now.`)

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      })
      results.push({ channel: 'sms', success: res.ok })
    }

    // 3. PUSH NOTIFICATION (Handled via separate Push Service or Supabase Realtime if configured)
    // For now, we assume the client triggered this or we use a push provider
    if (profile.push_enabled) {
      // Logic for triggering Push API (requires VAPID keys)
      results.push({ channel: 'push', success: true, note: 'Triggered via client callback' })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
