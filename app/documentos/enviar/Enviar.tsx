'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseNoNavegador } from '@/lib/supabase/browser'
import { cpfValido } from '@/lib/documentos/cpf'

export interface Item {
  chave: string
  nome: string
  grupo: string
  obrigatorio: boolean
  so_se_financiado: boolean
  ordem: number
  status: 'pendente' | 'enviado' | 'aprovado' | 'rejeitado'
  motivo: string | null
  qtd: number
}

export interface Dados {
  cpf: string | null
  data_nascimento: string | null
  estado_civil: string | null
  profissao: string | null
  endereco: Record<string, string> | null
  conjuge: { nome?: string; cpf?: string } | null
  imovel: Record<string, string> | null
}

const ROTULO_STATUS: Record<Item['status'], string> = {
  pendente: 'Pendente',
  enviado: 'Enviado, aguardando análise',
  aprovado: 'Aprovado',
  rejeitado: 'Precisa enviar de novo',
}
const GRUPOS: Record<string, string> = { pessoais: 'Documentos pessoais', renda: 'Renda', imovel: 'Imóvel', outros: 'Outros' }
const CASADO = ['casado', 'uniao_estavel']

async function enviarArquivo(tipo: string, arquivo: File): Promise<string | null> {
  const r1 = await fetch('/api/documentos/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, mime: arquivo.type, tamanho: arquivo.size }),
  })
  if (r1.status === 401) return 'Sua sessão expirou. Entre de novo com um código.'
  if (!r1.ok) return 'Este arquivo não pôde ser enviado. Use PDF, JPG, PNG ou HEIC de até 10 MB.'
  const { path, token } = (await r1.json()) as { path: string; token: string }
  const up = await supabaseNoNavegador().storage.from('documentos').uploadToSignedUrl(path, token, arquivo, { contentType: arquivo.type })
  if (up.error) return 'O envio falhou. Verifique a conexão e tente de novo.'
  const r2 = await fetch('/api/documentos/upload-ok', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, path }),
  })
  return r2.ok ? null : 'Não conseguimos confirmar o envio. Tente de novo.'
}

export function Enviar({ itens, dados }: { itens: Item[]; dados: Dados | null }) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<Record<string, string>>({})
  const [msgDados, setMsgDados] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [finalizado, setFinalizado] = useState<string | null>(null)
  const [casado, setCasado] = useState(CASADO.includes(dados?.estado_civil ?? ''))

  async function aoEscolher(chave: string, arquivos: FileList | null) {
    if (!arquivos?.length) return
    setErro((e) => ({ ...e, [chave]: '' }))
    setOcupado(chave)
    for (const arq of Array.from(arquivos)) {
      const falha = await enviarArquivo(chave, arq)
      if (falha) {
        setErro((e) => ({ ...e, [chave]: falha }))
        break
      }
    }
    setOcupado(null)
    router.refresh()
  }

  async function salvarDados(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    setMsgDados(null)
    const f = new FormData(ev.currentTarget)
    const g = (k: string) => String(f.get(k) ?? '').trim()
    if (!cpfValido(g('cpf'))) return setMsgDados({ tipo: 'erro', texto: 'O CPF informado não é válido.' })
    if (casado && !cpfValido(g('conjuge_cpf'))) return setMsgDados({ tipo: 'erro', texto: 'O CPF do cônjuge não é válido.' })
    const corpo = {
      cpf: g('cpf'),
      dataNascimento: g('nasc'),
      estadoCivil: g('estado_civil'),
      profissao: g('profissao'),
      endereco: {
        cep: g('cep'),
        logradouro: g('logradouro'),
        numero: g('numero'),
        complemento: g('complemento') || undefined,
        bairro: g('bairro'),
        cidade: g('cidade'),
        uf: g('uf').toUpperCase(),
      },
      conjuge: casado ? { nome: g('conjuge_nome'), cpf: g('conjuge_cpf') } : undefined,
      imovel: { endereco: g('imovel_endereco'), matricula: g('matricula') || undefined, cartorio: g('cartorio') || undefined },
    }
    const res = await fetch('/api/documentos/dados', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
    if (res.ok) {
      setMsgDados({ tipo: 'ok', texto: 'Dados salvos.' })
      router.refresh()
    } else if (res.status === 401) {
      setMsgDados({ tipo: 'erro', texto: 'Sua sessão expirou. Entre de novo com um código.' })
    } else {
      setMsgDados({ tipo: 'erro', texto: 'Confira os campos e tente de novo.' })
    }
  }

  async function concluir() {
    setFinalizado(null)
    const res = await fetch('/api/documentos/concluir', { method: 'POST' })
    const j = (await res.json().catch(() => ({}))) as { erro?: string; faltando?: string[] }
    if (res.ok) setFinalizado('Tudo certo! Avisamos o seu especialista. Ele entra em contato pelo WhatsApp.')
    else if (j.erro === 'faltam_dados') setFinalizado('Antes de concluir, salve os seus dados cadastrais.')
    else if (j.faltando) setFinalizado('Ainda faltam: ' + j.faltando.join(', ') + '.')
    else setFinalizado('Não foi possível concluir agora. Tente de novo.')
  }

  const end = dados?.endereco ?? {}
  const im = dados?.imovel ?? {}
  const grupos = Object.keys(GRUPOS).filter((g) => itens.some((i) => i.grupo === g))

  return (
    <div style={{ display: 'grid', gap: 36 }}>
      <section aria-labelledby="dados-t">
        <h2 id="dados-t" style={{ fontSize: 22, marginBottom: 12 }}>1. Seus dados</h2>
        <form onSubmit={salvarDados} className="doc-form" noValidate>
          <div className="grade2">
            <div className="tf"><label htmlFor="cpf">CPF</label><input id="cpf" name="cpf" inputMode="numeric" defaultValue={dados?.cpf ?? ''} required /></div>
            <div className="tf"><label htmlFor="nasc">Data de nascimento</label><input id="nasc" name="nasc" type="date" defaultValue={dados?.data_nascimento ?? ''} required /></div>
            <div className="tf">
              <label htmlFor="ec">Estado civil</label>
              <select id="ec" name="estado_civil" defaultValue={dados?.estado_civil ?? ''} required onChange={(ev) => setCasado(CASADO.includes(ev.target.value))}>
                <option value="">Selecione</option>
                <option value="solteiro">Solteiro(a)</option>
                <option value="casado">Casado(a)</option>
                <option value="uniao_estavel">União estável</option>
                <option value="divorciado">Divorciado(a)</option>
                <option value="separado">Separado(a)</option>
                <option value="viuvo">Viúvo(a)</option>
              </select>
            </div>
            <div className="tf"><label htmlFor="prof">Profissão</label><input id="prof" name="profissao" defaultValue={dados?.profissao ?? ''} required /></div>
          </div>
          {casado ? (
            <div className="grade2">
              <div className="tf"><label htmlFor="cn">Nome do cônjuge</label><input id="cn" name="conjuge_nome" defaultValue={dados?.conjuge?.nome ?? ''} /></div>
              <div className="tf"><label htmlFor="cc">CPF do cônjuge</label><input id="cc" name="conjuge_cpf" inputMode="numeric" defaultValue={dados?.conjuge?.cpf ?? ''} /></div>
            </div>
          ) : null}
          <h3 style={{ fontSize: 16 }}>Seu endereço</h3>
          <div className="grade2">
            <div className="tf"><label htmlFor="cep">CEP</label><input id="cep" name="cep" inputMode="numeric" defaultValue={end.cep ?? ''} required /></div>
            <div className="tf"><label htmlFor="log">Rua</label><input id="log" name="logradouro" defaultValue={end.logradouro ?? ''} required /></div>
            <div className="tf"><label htmlFor="num">Número</label><input id="num" name="numero" defaultValue={end.numero ?? ''} required /></div>
            <div className="tf"><label htmlFor="comp">Complemento</label><input id="comp" name="complemento" defaultValue={end.complemento ?? ''} /></div>
            <div className="tf"><label htmlFor="bai">Bairro</label><input id="bai" name="bairro" defaultValue={end.bairro ?? ''} required /></div>
            <div className="tf"><label htmlFor="cid">Cidade</label><input id="cid" name="cidade" defaultValue={end.cidade ?? ''} required /></div>
            <div className="tf"><label htmlFor="ufe">UF</label><input id="ufe" name="uf" maxLength={2} defaultValue={end.uf ?? ''} required /></div>
          </div>
          <h3 style={{ fontSize: 16 }}>Imóvel que será a garantia</h3>
          <div className="grade2">
            <div className="tf" style={{ gridColumn: '1 / -1' }}><label htmlFor="ie">Endereço do imóvel</label><input id="ie" name="imovel_endereco" defaultValue={im.endereco ?? ''} required /></div>
            <div className="tf"><label htmlFor="mat">Matrícula (se souber)</label><input id="mat" name="matricula" defaultValue={im.matricula ?? ''} /></div>
            <div className="tf"><label htmlFor="car">Cartório (se souber)</label><input id="car" name="cartorio" defaultValue={im.cartorio ?? ''} /></div>
          </div>
          {msgDados ? <p role={msgDados.tipo === 'erro' ? 'alert' : 'status'} className={msgDados.tipo === 'erro' ? 'aviso-erro' : 'aviso-ok'}>{msgDados.texto}</p> : null}
          <button className="btn btn-brand btn-lg" type="submit">Salvar meus dados</button>
        </form>
      </section>

      <section aria-labelledby="docs-t">
        <h2 id="docs-t" style={{ fontSize: 22, marginBottom: 12 }}>2. Documentos</h2>
        {grupos.map((g) => (
          <div key={g} style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>{GRUPOS[g]}</h3>
            <ul className="doc-itens">
              {itens.filter((i) => i.grupo === g).map((i) => (
                <li key={i.chave} className="doc-item">
                  <header>
                    <b>{i.nome}{!i.obrigatorio || i.so_se_financiado ? ' (opcional)' : ''}</b>
                    <span className={'badge ' + (i.status === 'aprovado' ? 'b-ok' : i.status === 'rejeitado' ? 'b-hot' : i.status === 'enviado' ? 'b-brand' : '')}>{ROTULO_STATUS[i.status]}</span>
                  </header>
                  {i.so_se_financiado ? <p className="meta">Só se o imóvel ainda estiver financiado.</p> : null}
                  {i.status === 'rejeitado' && i.motivo ? <p role="alert" className="aviso-erro">{i.motivo}</p> : null}
                  {i.qtd > 0 ? <p className="meta">{i.qtd} arquivo(s) enviado(s)</p> : null}
                  {i.status !== 'aprovado' ? (
                    <div className="acoes">
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                        {ocupado === i.chave ? 'Enviando...' : i.qtd > 0 ? 'Enviar outro arquivo' : 'Escolher arquivo'}
                        <input
                          type="file"
                          className="sr-only"
                          accept="application/pdf,image/*"
                          multiple
                          disabled={ocupado !== null}
                          onChange={(ev) => {
                            void aoEscolher(i.chave, ev.target.files)
                            ev.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                  ) : null}
                  {erro[i.chave] ? <p role="alert" className="aviso-erro">{erro[i.chave]}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="fim-t">
        <h2 id="fim-t" style={{ fontSize: 22, marginBottom: 12 }}>3. Concluir</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
          Quando terminar, avise o seu especialista. Você pode voltar depois com um novo código para enviar o que faltar.
        </p>
        <button className="btn btn-primary btn-lg" type="button" onClick={() => void concluir()}>Terminei o envio</button>
        {finalizado ? <p role="status" className="aviso-ok" style={{ marginTop: 12 }}>{finalizado}</p> : null}
      </section>
    </div>
  )
}
