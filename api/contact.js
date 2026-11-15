// =============================================================================
//  api/contact.js — Vercel Serverless Function per Digital Peak
//  Riceve i dati del form contatti, li salva su Supabase e invia l'email via Resend
// =============================================================================

export default async function handler(req, res) {
  // ─── GESTIONE CORS (consente chiamate da qualsiasi origine/dominio) ───
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Metodo non consentito. Utilizzare POST.'
    });
  }

  try {
    const { name, email, phone, message, lang = 'it' } = req.body || {};

    // ─── VALIDAZIONE DATI DI BASE ───
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Il nome è obbligatorio.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Inserire un indirizzo email valido.' });
    }
    if (!message || message.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Il messaggio deve contenere almeno 5 caratteri.' });
    }

    const cleanData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      message: message.trim(),
      lang: lang.trim(),
      receivedAt: new Date().toISOString()
    };

    let supabaseSaved = false;
    let emailSent = false;
    let dbErrorMessage = null;

    // ─── 1. SALVATAGGIO SU DATABASE (SUPABASE) ───
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        // Normalizzazione URL: rimuove trailing slashes ed eventuale /rest/v1 già presente
        let cleanBaseUrl = supabaseUrl.trim().replace(/\/+$/, '');
        if (cleanBaseUrl.endsWith('/rest/v1')) {
          cleanBaseUrl = cleanBaseUrl.slice(0, -('/rest/v1'.length)).replace(/\/+$/, '');
        }
        const endpoint = `${cleanBaseUrl}/rest/v1/leads`;

        console.log(`[Supabase] Connessione all'endpoint: ${endpoint}`);

        const dbRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey.trim(),
            'Authorization': `Bearer ${supabaseKey.trim()}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            name: cleanData.name,
            email: cleanData.email,
            phone: cleanData.phone,
            message: cleanData.message,
            lang: cleanData.lang
          })
        });

        if (dbRes.ok) {
          supabaseSaved = true;
          console.log('[Supabase] Lead salvato con successo!');
        } else {
          dbErrorMessage = await dbRes.text();
          console.error('[Supabase] Errore inserimento lead:', dbErrorMessage);
        }
      } catch (dbErr) {
        dbErrorMessage = dbErr.message;
        console.error('[Supabase] Connessione non riuscita:', dbErr);
      }
    } else {
      console.warn('[Supabase] Credenziali SUPABASE_URL o SUPABASE_ANON_KEY non trovate.');
    }

    // Se Supabase era configurato ma il salvataggio è fallito, restituiamo errore 500
    if (supabaseUrl && supabaseKey && !supabaseSaved) {
      return res.status(500).json({
        success: false,
        error: `Errore durante il salvataggio su database: ${dbErrorMessage || 'impossibile inserire il record'}`
      });
    }

    // ─── 2. INVIO NOTIFICA EMAIL VIA RESEND ───
    const resendApiKey = process.env.RESEND_API_KEY;
    const notificationEmails = (
      process.env.NOTIFICATION_EMAILS ||
      'giulianoguerriero@gmail.com,marco.guerriero1994@gmail.com'
    )
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    if (resendApiKey) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Digital Peak <onboarding@resend.dev>';

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; background-color: #f4f6fa; padding: 40px 20px; color: #181c2e;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              
              <div style="background: #181c2e; padding: 24px 32px; border-bottom: 3px solid #8c52ff;">
                <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.05em; text-transform: uppercase;">
                  Nuovo Lead Ricevuto — Digital Peak
                </h2>
              </div>

              <div style="padding: 32px;">
                <p style="font-size: 15px; color: #4a5568; margin-top: 0;">
                  È arrivata una nuova richiesta di contatto dal sito web:
                </p>

                <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; font-weight: bold; width: 140px; color: #4a5568;">Nome e Cognome:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #181c2e; font-size: 16px;"><strong>${cleanData.name}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #4a5568;">Email:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><a href="mailto:${cleanData.email}" style="color: #8c52ff; text-decoration: none;">${cleanData.email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #4a5568;">Telefono:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #181c2e;">${cleanData.phone || 'Non specificato'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #4a5568;">Lingua usata:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; text-transform: uppercase; color: #718096;">${cleanData.lang}</td>
                  </tr>
                </table>

                <div style="background: #f8fafc; border-left: 4px solid #00e5ff; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
                  <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #718096; margin-bottom: 8px;">Messaggio / Sfida del cliente:</div>
                  <div style="font-size: 15px; line-height: 1.6; color: #181c2e; white-space: pre-line;">${cleanData.message}</div>
                </div>

                <div style="margin-top: 32px; text-align: center;">
                  <a href="mailto:${cleanData.email}?subject=Re:%20Richiesta%20Digital%20Peak" style="background: #8c52ff; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">
                    Rispondi direttamente a ${cleanData.name} →
                  </a>
                </div>
              </div>

              <div style="background: #edf2f7; padding: 16px 32px; text-align: center; font-size: 12px; color: #718096;">
                Digital Peak Website Lead Notification • ${cleanData.receivedAt}
              </div>
            </div>
          </div>
        `;

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: notificationEmails,
            reply_to: cleanData.email,
            subject: `🎯 Nuovo Lead Digital Peak — ${cleanData.name}`,
            html: htmlContent
          })
        });

        if (emailRes.ok) {
          emailSent = true;
          console.log('[Resend] Email di notifica inviata con successo!');
        } else {
          const errBody = await emailRes.text();
          console.error('[Resend] Errore invio email:', errBody);
        }
      } catch (mailErr) {
        console.error('[Resend] Eccezione durante invio:', mailErr);
      }
    } else {
      console.info('[Resend] RESEND_API_KEY non ancora configurata in environment variables.');
    }

    return res.status(200).json({
      success: true,
      message: 'Richiesta ricevuta con successo.',
      savedToDatabase: supabaseSaved,
      emailDispatched: emailSent
    });

  } catch (error) {
    console.error('[API /api/contact] Errore server:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server durante l\'elaborazione della richiesta.'
    });
  }
}
