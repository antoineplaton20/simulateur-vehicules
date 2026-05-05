import { createClient } from '@supabase/supabase-js'

// Les valeurs sont injectées par Vercel/Vite depuis les variables d'environnement
// (à configurer dans le dashboard Vercel ou dans un fichier .env local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Variables Supabase manquantes ! ' +
    'Vérifie VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans tes variables d\'environnement.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================
// API SIMPLIFIÉE — fonctions prêtes à l'emploi pour le simulateur
// ============================================================

/**
 * Récupère tous les véhicules avec un filtre optionnel.
 * Renvoie les données aplaties depuis la vue v_vehicule_complet.
 */
export async function fetchVehicules({
  segment = null,
  energie = null,
  prixMax = null,
  limit = 50,
} = {}) {
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

/**
 * Récupère plusieurs véhicules par leurs IDs.
 */
export async function fetchVehiculesByIds(ids) {
  if (!ids?.length) return []
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

/**
 * Récupère la liste des marques distinctes.
 */
export async function fetchMarques() {
  const { data, error } = await supabase
    .from('marque')
    .select('id, nom')
    .order('nom')

  if (error) return []
  return data || []
}

/**
 * Récupère les statistiques globales.
 */
export async function fetchStats() {
  const { count } = await supabase
    .from('vehicule')
    .select('*', { count: 'exact', head: true })

  return { totalVehicules: count || 0 }
}
