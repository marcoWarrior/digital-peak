// =============================================================================
//  api/contact.js — Vercel Serverless Function per Digital Peak
//  Riceve i dati del form contatti, li salva su Supabase e invia le email via Resend
//  v2: aggiunto page_url, mail di ringraziamento al cliente, logging errori su console
// =============================================================================

export default async function handler(req, res) {
  // ─── GESTIONE CORS ───
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
    return res.status(405).json({ success: false, error: 'Metodo non consentito. Utilizzare POST.' });
  }

  try {
    const { name, email, phone, message, lang = 'it', page_url = '' } = req.body || {};

    // ─── VALIDAZIONE ───
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
      name:      name.trim(),
      email:     email.trim(),
      phone:     phone ? phone.trim() : null,
      message:   message.trim(),
      lang:      lang.trim(),
      page_url:  page_url.trim() || 'Non rilevato',
      receivedAt: new Date().toISOString()
    };

    let supabaseSaved = false;
    let emailNotifSent = false;
    let emailThanksSent = false;
    let dbErrorMessage = null;

    // ─── 1. SALVATAGGIO SU SUPABASE ───
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        let cleanBaseUrl = supabaseUrl.trim().replace(/\/+$/, '');
        if (cleanBaseUrl.endsWith('/rest/v1')) {
          cleanBaseUrl = cleanBaseUrl.slice(0, -('/rest/v1'.length)).replace(/\/+$/, '');
        }
        const endpoint = `${cleanBaseUrl}/rest/v1/leads`;

        console.log(`[Supabase] Connessione all'endpoint: ${endpoint}`);

        const dbRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'apikey':        supabaseKey.trim(),
            'Authorization': `Bearer ${supabaseKey.trim()}`,
            'Content-Type':  'application/json',
            'Prefer':        'return=minimal'
          },
          body: JSON.stringify({
            name:     cleanData.name,
            email:    cleanData.email,
            phone:    cleanData.phone,
            message:  cleanData.message,
            lang:     cleanData.lang,
            page_url: cleanData.page_url
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
        console.error('[Supabase] Connessione non riuscita:', dbErr.message);
      }
    } else {
      console.warn('[Supabase] Credenziali SUPABASE_URL o SUPABASE_ANON_KEY non trovate.');
    }

    // Se Supabase era configurato ma il salvataggio è fallito → errore 500
    if (supabaseUrl && supabaseKey && !supabaseSaved) {
      return res.status(500).json({
        success: false,
        error: `Errore durante il salvataggio su database: ${dbErrorMessage || 'impossibile inserire il record'}`
      });
    }

    // ─── 2. EMAIL VIA RESEND ───
    const resendApiKey = process.env.RESEND_API_KEY;
    const notificationEmails = (
      process.env.NOTIFICATION_EMAILS || 'marco.guerriero1994@gmail.com'
    )
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    if (resendApiKey) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Digital Peak <onboarding@resend.dev>';

      // ── 2a. NOTIFICA INTERNA (a voi del team) ──
      try {
        const notifHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #f4f6fa; padding: 40px 20px; color: #181c2e;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="background: #181c2e; padding: 24px 32px; border-bottom: 3px solid #8c52ff;">
                <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.05em; text-transform: uppercase;">
                  🎯 Nuovo Lead Ricevuto — Digital Peak
                </h2>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 15px; color: #4a5568; margin-top: 0;">È arrivata una nuova richiesta di contatto dal sito web.</p>
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
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #4a5568;">Pagina sorgente:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><a href="${cleanData.page_url}" style="color: #00e5ff; text-decoration: none; word-break: break-all;">${cleanData.page_url}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #4a5568;">Lingua usata:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; text-transform: uppercase; color: #718096;">${cleanData.lang}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #4a5568;">Data e ora:</td>
                    <td style="padding: 10px 0; color: #718096;">${new Date(cleanData.receivedAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</td>
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
            'Content-Type':  'application/json'
          },
          body: JSON.stringify({
            from:     fromEmail,
            to:       notificationEmails,
            reply_to: cleanData.email,
            subject:  `🎯 Nuovo Lead Digital Peak — ${cleanData.name}`,
            html:     notifHtml
          })
        });

        if (emailRes.ok) {
          emailNotifSent = true;
          console.log('[Resend] Email di notifica inviata con successo al team.');
        } else {
          const errBody = await emailRes.text();
          console.error('[Resend] Errore invio notifica team:', errBody);
        }
      } catch (mailErr) {
        console.error('[Resend] Eccezione notifica team:', mailErr.message);
      }

      // ── 2b. EMAIL DI RINGRAZIAMENTO AL CLIENTE ──
      // NOTA: in sandbox Resend (senza dominio verificato) questa email
      // arriverà SOLO se cleanData.email coincide con l'account Resend registrato.
      // Con dominio verificato (es. info@digitalpeak.it) funziona per chiunque.
      try {
        const thanksMessages = {
          it: {
            subject: 'Grazie per averci contattato — Digital Peak',
            greeting: `Ciao ${cleanData.name},`,
            body: 'Grazie per averci scritto! Abbiamo ricevuto la tua richiesta e un nostro consulente ti contatterà al più presto per capire come possiamo aiutarti a raggiungere i tuoi obiettivi.',
            cta_text: 'Nel frattempo, scopri i nostri servizi',
            footer: 'Il team di Digital Peak'
          },
          en: {
            subject: 'Thank you for contacting us — Digital Peak',
            greeting: `Hi ${cleanData.name},`,
            body: 'Thank you for reaching out! We have received your request and one of our consultants will contact you shortly to understand how we can help you achieve your goals.',
            cta_text: 'In the meantime, explore our services',
            footer: 'The Digital Peak team'
          },
          es: {
            subject: 'Gracias por contactarnos — Digital Peak',
            greeting: `Hola ${cleanData.name},`,
            body: 'Gracias por escribirnos. Hemos recibido tu solicitud y uno de nuestros consultores se pondrá en contacto contigo pronto para ver cómo podemos ayudarte a alcanzar tus objetivos.',
            cta_text: 'Mientras tanto, conoce nuestros servicios',
            footer: 'El equipo de Digital Peak'
          }
        };
        const t = thanksMessages[cleanData.lang] || thanksMessages.it;

        const thanksHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #f4f6fa; padding: 40px 20px; color: #181c2e;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="background: #181c2e; padding: 32px; border-bottom: 3px solid #8c52ff; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.05em; text-transform: uppercase;">Digital Peak</h1>
                <p style="color: #8c52ff; margin: 8px 0 0; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;">Growth Without Limits</p>
              </div>
              <div style="padding: 40px 32px;">
                <p style="font-size: 20px; font-weight: bold; color: #181c2e; margin-top: 0;">${t.greeting}</p>
                <p style="font-size: 16px; line-height: 1.7; color: #4a5568;">${t.body}</p>
                <div style="background: #f8fafc; border-left: 4px solid #8c52ff; padding: 16px 20px; margin: 28px 0; border-radius: 4px;">
                  <div style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: #718096; margin-bottom: 8px;">Il tuo messaggio:</div>
                  <div style="font-size: 14px; line-height: 1.6; color: #4a5568; white-space: pre-line;">${cleanData.message}</div>
                </div>
                <div style="text-align: center; margin-top: 32px;">
                  <a href="https://digital-peak.vercel.app/#services" style="background: #8c52ff; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block; letter-spacing: 0.05em;">
                    ${t.cta_text} →
                  </a>
                </div>
              </div>
              <div style="background: #edf2f7; padding: 20px 32px; text-align: center; font-size: 12px; color: #718096;">
                <p style="margin: 0;">${t.footer}</p>
                <p style="margin: 8px 0 0;">© 2026 Digital Peak — <a href="https://digital-peak.vercel.app" style="color: #8c52ff; text-decoration: none;">digital-peak.vercel.app</a></p>
              </div>
            </div>
          </div>
        `;

        const thanksRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey.trim()}`,
            'Content-Type':  'application/json'
          },
          body: JSON.stringify({
            from:    fromEmail,
            to:      [cleanData.email],
            subject: t.subject,
            html:    thanksHtml
          })
        });

        if (thanksRes.ok) {
          emailThanksSent = true;
          console.log(`[Resend] Email di ringraziamento inviata a ${cleanData.email}`);
        } else {
          const errBody = await thanksRes.text();
          // Logghiamo ma NON facciamo fallire la richiesta: il lead è già salvato
          console.warn('[Resend] Ringraziamento non inviato (atteso in sandbox senza dominio):', errBody);
        }
      } catch (thanksErr) {
        console.warn('[Resend] Eccezione ringraziamento cliente:', thanksErr.message);
      }

    } else {
      console.info('[Resend] RESEND_API_KEY non configurata — email non inviate.');
    }

    return res.status(200).json({
      success: true,
      message: 'Richiesta ricevuta con successo.',
      savedToDatabase:    supabaseSaved,
      notificationSent:   emailNotifSent,
      thanksSent:         emailThanksSent
    });

  } catch (error) {
    console.error('[API /api/contact] Errore server non gestito:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server durante l\'elaborazione della richiesta.'
    });
  }
}
