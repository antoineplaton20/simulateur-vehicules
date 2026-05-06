import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from 'recharts'

const COLORS = {
  achat: '#1A1A1A',
  energie: '#8B6F47',
  entretien: '#5B7C99',
  assurance: '#A39076',
  revente: '#4A7C59',
  line: '#1A1A1A',
  axis: '#999',
  grid: '#E5E0D5',
}

const fmtEUR = (n) => `${Math.round(n).toLocaleString('fr-FR')} €`

const tooltipStyle = {
  background: '#FFF',
  border: '1px solid #1A1A1A',
  borderRadius: 0,
  padding: '8px 12px',
  fontSize: 12,
  fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif',
}

// ============================================================
// PODIUM — comparatif horizontal des N premiers
// ============================================================
export function PodiumComparison({ vehicules, dureeGarde }) {
  const data = vehicules.map((v, i) => ({
    name: `#${i + 1} ${v.marque} ${v.modele}`,
    tco: Math.round(v.tco),
    energie: v.energie,
  }))

  const palette = {
    essence: '#8B6F47',
    diesel: '#5C4033',
    hybride: '#5B7C99',
    hybride_rechargeable: '#2E5C7E',
    electrique: '#4A7C59',
  }

  return (
    <div style={{ width: '100%', height: 60 + data.length * 44 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 60, left: 0, bottom: 8 }}>
          <CartesianGrid stroke={COLORS.grid} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            stroke={COLORS.axis}
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={220}
            stroke={COLORS.axis}
            fontSize={12}
            tick={{ fill: '#1A1A1A' }}
          />
          <Tooltip
            formatter={(v) => fmtEUR(v)}
            contentStyle={tooltipStyle}
            cursor={{ fill: 'rgba(26,26,26,0.04)' }}
          />
          <Bar dataKey="tco" name={`TCO ${dureeGarde} ans`} radius={[0, 0, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={palette[entry.energie] || '#888'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================
// BREAKDOWN — composition du TCO en barre empilée
// ============================================================
export function TcoBreakdown({ v, dureeGarde }) {
  const prix = v.prix_min_eur || 0
  const energie = v.coutEnergieAnnuel * dureeGarde
  const entretienAnnuel =
    v.energie === 'electrique' ? 250 :
    v.energie === 'hybride' ? 400 : 500
  const entretien = entretienAnnuel * dureeGarde
  const assurance = 650 * dureeGarde
  const revente = v.valeurRevente

  const data = [{
    name: 'TCO',
    Achat: prix,
    'Énergie': energie,
    Entretien: entretien,
    Assurance: assurance,
    Revente: -revente,
  }]

  return (
    <div style={{ width: '100%', height: 130 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" stackOffset="sign" margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke={COLORS.grid} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            stroke={COLORS.axis}
            fontSize={10}
          />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            formatter={(val) => fmtEUR(Math.abs(val))}
            contentStyle={tooltipStyle}
            cursor={{ fill: 'rgba(26,26,26,0.04)' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
          <Bar dataKey="Achat" stackId="a" fill={COLORS.achat} />
          <Bar dataKey="Énergie" stackId="a" fill={COLORS.energie} />
          <Bar dataKey="Entretien" stackId="a" fill={COLORS.entretien} />
          <Bar dataKey="Assurance" stackId="a" fill={COLORS.assurance} />
          <Bar dataKey="Revente" stackId="a" fill={COLORS.revente} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================
// EVOLUTION — TCO cumulé année par année
// ============================================================
export function TcoEvolution({ v, dureeGarde }) {
  const prix = v.prix_min_eur || 0
  const entretienAnnuel =
    v.energie === 'electrique' ? 250 :
    v.energie === 'hybride' ? 400 : 500
  const decoteAnnuelle = v.energie === 'electrique' ? 0.16 : 0.13
  const annualOps = v.coutEnergieAnnuel + entretienAnnuel + 650

  const data = []
  for (let n = 0; n <= dureeGarde; n++) {
    const revente = prix * Math.pow(1 - decoteAnnuelle, n)
    const tco = prix + annualOps * n - revente
    data.push({
      annee: n,
      TCO: Math.round(tco),
      Revente: Math.round(revente),
    })
  }

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke={COLORS.grid} />
          <XAxis
            dataKey="annee"
            stroke={COLORS.axis}
            fontSize={11}
            label={{ value: 'année', position: 'insideBottom', offset: -2, fontSize: 11, fill: COLORS.axis }}
          />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            stroke={COLORS.axis}
            fontSize={11}
          />
          <Tooltip
            formatter={(val) => fmtEUR(val)}
            labelFormatter={(l) => `Année ${l}`}
            contentStyle={tooltipStyle}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
          <Line type="monotone" dataKey="TCO" stroke={COLORS.line} strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Revente" stroke={COLORS.revente} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
