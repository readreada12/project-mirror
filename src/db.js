// ─── Project Mirror — Data Layer ──────────────────────────────
//
// Currently stores everything in localStorage (works with zero setup).
// To switch to Supabase:
//   1. npm install @supabase/supabase-js
//   2. Uncomment the supabase import and client setup below
//   3. Replace each localStorage block with the supabase equivalent shown
//   4. Add your env vars to .env (see .env.example)
//
// ─────────────────────────────────────────────────────────────

// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY
// )

const LS = {
  get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  push: (key, item) => {
    const arr = LS.get(key)
    arr.push(item)
    localStorage.setItem(key, JSON.stringify(arr))
  },
  update: (key, id, patch) => {
    const arr = LS.get(key)
    const item = arr.find(x => x.id === id)
    if (item) Object.assign(item, patch)
    localStorage.setItem(key, JSON.stringify(arr))
  },
}

export const DB = {
  // ── Start a new session ──────────────────────────────────
  startSession(conditionId) {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    const session = {
      id,
      condition_selected: conditionId,
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      platform: navigator.platform || 'unknown',
      started_at: new Date().toISOString(),
      completed: false,
    }
    LS.push('pm_sessions', session)
    // Supabase: await supabase.from('sessions').insert(session)
    return id
  },

  // ── Record touch telemetry from a game ──────────────────
  recordTelemetry(sessionId, data) {
    const row = {
      session_id: sessionId,
      game_id: data.game_id,
      avg_velocity: data.avg_velocity ?? 0,
      max_velocity: data.max_velocity ?? 0,
      jitter_score: data.jitter_score ?? 0,
      pause_count: data.pause_count ?? 0,
      touch_count: data.touch_count ?? 0,
      recorded_at: new Date().toISOString(),
    }
    LS.push('pm_telemetry', row)
    // Supabase: await supabase.from('telemetry').insert(row)
  },

  // ── Record a feeling check-in score ─────────────────────
  recordCheckin(sessionId, score, type = 'post_game') {
    const row = {
      session_id: sessionId,
      feeling_score: score,
      checkin_type: type,
      created_at: new Date().toISOString(),
    }
    LS.push('pm_checkins', row)
    // Supabase: await supabase.from('checkins').insert(row)
  },

  // ── Save response to a disguised post-game question ─────
  recordQuestionResponse(sessionId, gameId, index, question, response) {
    const row = {
      session_id: sessionId,
      game_id: gameId,
      question_index: index,
      question_text: question,
      response_text: response,
      created_at: new Date().toISOString(),
    }
    LS.push('pm_question_responses', row)
    // Supabase: await supabase.from('question_responses').insert(row)
  },

  // ── Record Signal routing choice ─────────────────────────
  recordSignalRoute(sessionId, scenePicked, followupAnswer, routedTo) {
    const row = {
      session_id: sessionId,
      scene_picked: scenePicked,
      followup_answer: followupAnswer,
      routed_to: routedTo,
      created_at: new Date().toISOString(),
    }
    LS.push('pm_signal_routes', row)
    // Supabase: await supabase.from('signal_routes').insert(row)
  },

  // ── Mark session complete ────────────────────────────────
  completeSession(sessionId, finalFeeling) {
    LS.update('pm_sessions', sessionId, {
      completed: true,
      final_feeling: finalFeeling,
      ended_at: new Date().toISOString(),
    })
    // Supabase: await supabase.from('sessions')
    //   .update({ completed: true, final_feeling: finalFeeling, ended_at: new Date().toISOString() })
    //   .eq('id', sessionId)
  },

  // ── Read all stored data (for mindscape view) ────────────
  getStats() {
    return {
      sessions:          LS.get('pm_sessions'),
      telemetry:         LS.get('pm_telemetry'),
      checkins:          LS.get('pm_checkins'),
      questionResponses: LS.get('pm_question_responses'),
      signalRoutes:      LS.get('pm_signal_routes'),
    }
  },
}
