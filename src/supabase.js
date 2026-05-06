import { createClient } from '@supabase/supabase-js'
import { DEMO_VEHICULES } from './demoData.js'

// Les valeurs sont injectées par Vercel/Vite depuis les variables d'environnement
// (à configurer dans le dashboard Vercel ou dans un fichier .env local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isConfigured) {
  console.info(
    'ℹ️ Mode démo : Supabase n\'est pas configuré, utilisation du jeu de données local. ' +
    'Pour activer la base réelle, définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

// ============================================================
// FILTRAGE LOCAL (utilisé en mode démo)
// ============================================================
function filterDemo({ segment, energie, prixMax, limit }) {
  let data = DEMO_VEHICULES
  if (segment) data = data.filter(v => v.segment === segment)
  if (energie) data = data.filter(v => v.energie === energie)
  if (prixMax) data = data.filter(v => (v.prix_min_eur || 0) <= prixMax)
  return data.slice(0, limit)
}

// ============================================================
// API PUBLIQUE
// ============================================================
export async function fetchVehicules({
  segment = null,
  energie = null,
  prixMax = null,
  limit = 50,
} = {}) {
  if (!isConfigured) {
    return filterDemo({ segment, energie, prixMax, limit })
  }

  let query = supabase
    .from('v_vehicule_complet')
    .select('*')
    .limit(limit)

  if (segment) query = query.eq('segment', segment)
  if (energie) query = query.eq('energie', energie)
  if (prixMax) query = query.lte('prix_min_eur', prixMax)

  const { data, error } = await query
  if (error) {
    console.error('Erreur Supabase:', error)
    return []
  }
  return data || []
}

export async function fetchVehiculesByIds(ids) {
  if (!ids?.length) return []
  if (!isConfigured) {
    return DEMO_VEHICULES.filter(v => ids.includes(v.vehicule_id))
  }
  const { data, error } = await supabase
    .from('v_vehicule_complet')
    .select('*')
    .in('vehicule_id', ids)

  if (error) {
    console.error('Erreur Supabase:', error)
    return []
  }
  return data || []
}

export async function fetchMarques() {
  if (!isConfigured) {
    const set = new Set(DEMO_VEHICULES.map(v => v.marque))
    return [...set].sort().map((nom, i) => ({ id: i + 1, nom }))
  }
  const { data, error } = await supabase
    .from('marque')
    .select('id, nom')
    .order('nom')
  if (error) return []
  return data || []
}

export async function fetchStats() {
  if (!isConfigured) {
    return { totalVehicules: DEMO_VEHICULES.length, demo: true }
  }
  const { count } = await supabase
    .from('vehicule')
    .select('*', { count: 'exact', head: true })
  return { totalVehicules: count || 0 }
}
