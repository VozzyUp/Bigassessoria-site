'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { lerEscolha, salvar } from '@/lib/medicao/consentimento'

function assinar(cb: () => void) {
  window.addEventListener('big-consent', cb)
  return () => window.removeEventListener('big-consent', cb)
}
// "ja" = já escolheu; "nao" = precisa perguntar; null no servidor, para não piscar no HTML estático
const lerEstado = () => (lerEscolha() ? 'ja' : 'nao')

export function CookieBanner() {
  const estado = useSyncExternalStore(assinar, lerEstado, () => null)
  const [personalizar, setPersonalizar] = useState(false)
  const [estatistica, setEstatistica] = useState(false)
  const [marketing, setMarketing] = useState(false)

  if (estado !== 'nao') return null
  const agora = () => new Date().toISOString()

  return (
    <div role="dialog" aria-label="Preferências de cookies" className="cookie">
      <div className="cookie-corpo">
        <p>
          Usamos cookies para o site funcionar, medir o uso e melhorar nossos anúncios. Você escolhe o que permitir.{' '}
          <Link href="/privacidade">Saiba mais</Link>
        </p>
        {personalizar ? (
          <div className="cookie-opcoes">
            <label><input type="checkbox" checked disabled /> Necessários (sempre ativos)</label>
            <label><input type="checkbox" checked={estatistica} onChange={(e) => setEstatistica(e.target.checked)} /> Estatística: entender como o site é usado</label>
            <label><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /> Marketing: medir e melhorar anúncios</label>
          </div>
        ) : null}
        <div className="cookie-acoes">
          {/* Aceitar e recusar têm o mesmo peso visual (LGPD) */}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => salvar({ estatistica: false, marketing: false, em: agora() })}>Recusar</button>
          {personalizar ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => salvar({ estatistica, marketing, em: agora() })}>Salvar escolha</button>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPersonalizar(true)}>Personalizar</button>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => salvar({ estatistica: true, marketing: true, em: agora() })}>Aceitar tudo</button>
        </div>
      </div>
    </div>
  )
}
