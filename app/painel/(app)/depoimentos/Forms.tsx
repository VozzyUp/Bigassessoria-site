'use client'

import { useState, useTransition } from 'react'
import { criarDepoimento, excluirDepoimento, publicarDepoimento } from '@/app/painel/acoes-depoimentos'

interface Linha {
  id: string
  nome: string
  cidade: string | null
  uf: string | null
  texto: string
  nota: number | null
  fonte: string | null
  publicado: boolean
  autorizacao_em: string
}

export function LinhaDepoimento({ d }: { d: Linha }) {
  const [pendente, iniciar] = useTransition()
  const [aviso, setAviso] = useState<string | null>(null)
  return (
    <li style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
      <p><b>{d.nome}</b>{d.cidade ? ' · ' + d.cidade + (d.uf ? '/' + d.uf : '') : ''} {d.nota ? '· ' + d.nota + ' de 5' : ''} <span className={'badge ' + (d.publicado ? 'b-ok' : '')}>{d.publicado ? 'Publicado' : 'Rascunho'}</span></p>
      <p className="meta">{d.texto}</p>
      <p className="meta">Autorizado em {new Date(d.autorizacao_em).toLocaleDateString('pt-BR')}</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button className="btn btn-brand btn-sm" disabled={pendente} onClick={() => iniciar(async () => setAviso((await publicarDepoimento(d.id, !d.publicado)).mensagem))}>{d.publicado ? 'Tirar do site' : 'Publicar'}</button>
        <button className="btn btn-secondary btn-sm" disabled={pendente} onClick={() => iniciar(async () => setAviso((await excluirDepoimento(d.id)).mensagem))}>Excluir</button>
      </div>
      {aviso ? <p role="status" className="meta">{aviso}</p> : null}
    </li>
  )
}

export function FormDepoimento() {
  const [pendente, iniciar] = useTransition()
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  return (
    <form
      className="cartao doc-form"
      style={{ marginTop: 12, maxWidth: 720 }}
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const form = e.currentTarget
        iniciar(async () => {
          const r = await criarDepoimento({
            nome: String(f.get('nome')),
            cidade: String(f.get('cidade')),
            uf: String(f.get('uf')),
            texto: String(f.get('texto')),
            nota: String(f.get('nota')),
            fonte: String(f.get('fonte')),
            autorizado: f.get('autorizado') === 'on',
          })
          setAviso({ ok: r.ok, texto: r.mensagem })
          if (r.ok) form.reset()
        })
      }}
    >
      <h2>Novo depoimento</h2>
      <div className="grade2">
        <div className="tf"><label htmlFor="d-n">Nome como o cliente autorizou aparecer</label><input id="d-n" name="nome" required /></div>
        <div className="tf"><label htmlFor="d-c">Cidade</label><input id="d-c" name="cidade" /></div>
        <div className="tf"><label htmlFor="d-u">UF</label><input id="d-u" name="uf" maxLength={2} /></div>
        <div className="tf"><label htmlFor="d-o">Nota (1 a 5)</label><input id="d-o" name="nota" inputMode="numeric" /></div>
        <div className="tf"><label htmlFor="d-f">De onde veio</label><select id="d-f" name="fonte" defaultValue="google"><option value="google">Avaliação no Google</option><option value="whatsapp">Mensagem no WhatsApp</option><option value="outro">Outro</option></select></div>
      </div>
      <div className="tf"><label htmlFor="d-t">Depoimento (copie o texto original, sem editar)</label><textarea id="d-t" name="texto" rows={4} required style={{ height: 'auto', padding: 12 }} /></div>
      <label className="check" style={{ color: 'var(--text)' }}><input type="checkbox" name="autorizado" /><span>O cliente autorizou, por escrito, o uso do nome e do depoimento no site.</span></label>
      {aviso ? <p role="status" className={aviso.ok ? 'aviso-ok' : 'aviso-erro'}>{aviso.texto}</p> : null}
      <button className="btn btn-brand" type="submit" disabled={pendente}>Salvar rascunho</button>
    </form>
  )
}
