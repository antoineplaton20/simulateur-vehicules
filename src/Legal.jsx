import React, { useState } from 'react'

const PAGES = {
  mentions: {
    titre: 'Mentions légales',
    contenu: (
      <>
        <p><strong>Éditeur du site.</strong> Le simulateur « Coût voiture » est édité à titre informatif.
        Les coordonnées de l'éditeur sont disponibles sur simple demande à <em>contact@cout-voiture.fr</em>.</p>

        <p><strong>Hébergeur.</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
        Pour les hébergements alternatifs, voir le fichier <code>DEPLOY.md</code> du projet.</p>

        <p><strong>Propriété intellectuelle.</strong> Le code source du simulateur est publié sous licence MIT.
        Les données techniques (consommation, CO₂, puissance) proviennent de l'<strong>ADEME</strong>
        (Carlabelling) et sont distribuées sous <strong>Licence Ouverte 2.0</strong> (Etalab).
        Les marques, modèles et logos cités appartiennent à leurs propriétaires respectifs.</p>

        <p><strong>Limitation de responsabilité.</strong> Les calculs proposés sont indicatifs et reposent
        sur des moyennes 2026 (prix de l'énergie, entretien, assurance, décote). Ils ne constituent ni
        un devis, ni un conseil financier, ni une recommandation d'achat. L'éditeur décline toute
        responsabilité quant à l'usage qui en est fait.</p>
      </>
    ),
  },
  confidentialite: {
    titre: 'Politique de confidentialité',
    contenu: (
      <>
        <p><strong>Données collectées.</strong> Le simulateur fonctionne entièrement dans votre navigateur.
        Vos choix (kilométrage, durée, mode de paiement…) ne sont jamais envoyés à un serveur.
        Aucun compte, aucune adresse e-mail, aucune information personnelle ne sont demandés.</p>

        <p><strong>Cookies.</strong> Le site n'utilise <strong>aucun cookie de suivi</strong>.
        Si une mesure d'audience est ajoutée à l'avenir, elle sera respectueuse de la vie privée
        (Plausible, Cloudflare Web Analytics ou équivalent — sans cookie, sans donnée personnelle)
        et cette page sera mise à jour en conséquence.</p>

        <p><strong>Service worker.</strong> Pour permettre l'installation en application et le
        fonctionnement hors-ligne, le site stocke ses fichiers techniques dans le cache de votre
        navigateur. Aucun contenu personnel n'y est conservé.</p>

        <p><strong>Vos droits.</strong> Conformément au RGPD, puisqu'aucune donnée personnelle n'est
        collectée, aucune procédure d'accès, de rectification ou de suppression n'est nécessaire.
        Pour toute question, vous pouvez écrire à <em>contact@cout-voiture.fr</em>.</p>
      </>
    ),
  },
  methodologie: {
    titre: 'Méthodologie de calcul',
    contenu: (
      <>
        <p><strong>Sources.</strong> Consommation, émissions de CO₂ et puissance proviennent du fichier
        ouvert <strong>ADEME Carlabelling</strong>, sous Licence Ouverte 2.0. Cycle d'homologation WLTP.</p>

        <p><strong>Coût total sur N années.</strong> Prix d'achat + intérêts du crédit (si crédit) +
        carburant ou électricité × N + entretien × N + assurance × N − valeur de revente estimée à N ans.</p>

        <p><strong>Hypothèses 2026 (modifiables dans le code).</strong> Essence 2,03 €/L, diesel 1,78 €/L,
        électricité à domicile 0,1579 €/kWh, électricité en borne publique 0,45 €/kWh.
        Pour les véhicules électriques, on suppose 80 % de recharge à domicile si l'option « borne »
        est cochée, 100 % en borne publique sinon.</p>

        <p><strong>Entretien annuel.</strong> 250 € pour électrique, 400 € pour hybride, 500 € pour
        thermique (essence/diesel). <strong>Assurance.</strong> 650 € par an. <strong>Décote
        annuelle.</strong> 13 % par an, 16 % par an pour les électriques.</p>

        <p><strong>Crédit.</strong> Mensualité calculée par la formule classique
        M = (P − A) × t / (1 − (1 + t)^−n), avec P le prix, A l'apport, t le taux mensuel
        (taux annuel ÷ 12) et n le nombre de mensualités. Les intérêts payés
        sont ajoutés au coût total sur la période de garde.</p>

        <p>Ces hypothèses sont des moyennes nationales 2026 et peuvent ne pas correspondre à votre
        situation personnelle. Pour une estimation précise, demandez un devis à votre concessionnaire,
        un comparatif d'assurance auto et une simulation de prêt à votre banque.</p>
      </>
    ),
  },
}

export default function Legal({ page, onClose, onChange }) {
  const data = PAGES[page]
  if (!data) return null

  return (
    <div style={S.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={data.titre}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.head}>
          <h2 style={S.title}>{data.titre}</h2>
          <button type="button" onClick={onClose} style={S.closeBtn} aria-label="Fermer">×</button>
        </div>

        <div style={S.tabs}>
          {Object.entries(PAGES).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              style={key === page ? S.tabActive : S.tab}
            >
              {p.titre}
            </button>
          ))}
        </div>

        <div style={S.content}>{data.contenu}</div>
      </div>
    </div>
  )
}

export function LegalFooter({ open }) {
  return (
    <nav aria-label="Liens légaux" style={S.foot}>
      <button type="button" onClick={() => open('mentions')} style={S.footLink}>Mentions légales</button>
      <span style={S.dot}>·</span>
      <button type="button" onClick={() => open('confidentialite')} style={S.footLink}>Confidentialité</button>
      <span style={S.dot}>·</span>
      <button type="button" onClick={() => open('methodologie')} style={S.footLink}>Méthodologie</button>
    </nav>
  )
}

export function useLegal() {
  const [page, setPage] = useState(null)
  return {
    page,
    open: (p) => setPage(p),
    close: () => setPage(null),
    change: (p) => setPage(p),
  }
}

const S = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modal: {
    background: '#FFF', maxWidth: 720, width: '100%', maxHeight: '85vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1.5px solid #1A1A1A',
  },
  title: { fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400, margin: 0 },
  closeBtn: {
    width: 40, height: 40, fontSize: 28, lineHeight: 1, fontWeight: 400,
    border: 'none', background: 'transparent', cursor: 'pointer', color: '#1A1A1A',
  },
  tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #E5E0D5', flexWrap: 'wrap' },
  tab: {
    flex: '1 1 auto', padding: '12px 16px', fontSize: 13, fontWeight: 600,
    background: 'transparent', border: 'none', borderBottom: '2px solid transparent',
    cursor: 'pointer', color: '#666',
  },
  tabActive: {
    flex: '1 1 auto', padding: '12px 16px', fontSize: 13, fontWeight: 700,
    background: 'transparent', border: 'none', borderBottom: '2px solid #1A1A1A',
    cursor: 'pointer', color: '#1A1A1A',
  },
  content: {
    padding: '24px 28px', overflowY: 'auto', fontSize: 15, lineHeight: 1.7, color: '#222',
  },
  foot: {
    display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
    fontSize: 13, color: '#666', marginTop: 14,
  },
  footLink: {
    background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
    color: '#1A1A1A', fontSize: 13, fontWeight: 600, textDecoration: 'underline',
  },
  dot: { color: '#999' },
}
