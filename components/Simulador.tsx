'use client'

import { useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CONFIG_PADRAO, formatarBRL, formatarPercentual, simular, type Produto, type Sistema } from '@/lib/financeiro'
import { coletarAtribuicao } from '@/lib/atribuicao/cliente'
import { paraE164 } from '@/lib/telefone'
import { evento, lerEscolha } from '@/lib/medicao/consentimento'
import { Icone } from './Icone'

const UFS = ['MG', 'SP', 'MS', 'MT', 'PR', 'SC', 'RS', 'RJ', 'ES']
type ProdutoSim = Extract<Produto, 'home_equity' | 'financiamento'>

const reais = (txt: string) => {
  const d = txt.replace(/\D/g, '')
  return d ? parseInt(d, 10) : 0
}
const mascaraReais = (n: number) => (n ? n.toLocaleString('pt-BR') : '')
const mascaraTelefone = (txt: string) => {
  const d = txt.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2)
  if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6)
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7)
}

type Opcao<T> = { valor: T; rotulo: string; legenda?: string }

function Grupo<T extends string | number>(props: {
  rotulo: string
  opcoes: Opcao<T>[]
  valor: T
  onChange: (v: T) => void
}) {
  const { rotulo, opcoes, valor, onChange } = props
  const id = useId()
  return (
    <div className="field">
      <span className="lbl" id={id}>{rotulo}</span>
      <div className="chips" role="radiogroup" aria-labelledby={id}>
        {opcoes.map((o) => (
          <button
            key={String(o.valor)}
            type="button"
            className="chip"
            role="radio"
            aria-checked={o.valor === valor}
            tabIndex={o.valor === valor ? 0 : -1}
            onClick={() => onChange(o.valor)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
              e.preventDefault()
              const i = opcoes.findIndex((x) => x.valor === valor)
              const j = (i + (e.key === 'ArrowRight' ? 1 : opcoes.length - 1)) % opcoes.length
              onChange(opcoes[j].valor)
              e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('.chip')[j]?.focus()
            }}
          >
            {o.rotulo}
            {o.legenda ? <small>{o.legenda}</small> : null}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Simulador({ produtoInicial = 'home_equity' }: { produtoInicial?: ProdutoSim }) {
  const router = useRouter()
  const cfg = CONFIG_PADRAO
  const [produto, setProduto] = useState<ProdutoSim>(produtoInicial)
  const [imovel, setImovel] = useState(1_000_000)
  const [credito, setCredito] = useState(500_000)
  const [sistema, setSistema] = useState<Sistema>('price')
  const [taxa, setTaxa] = useState(cfg.taxa_min)
  const [prazo, setPrazo] = useState(240)
  const [carencia, setCarencia] = useState(30)

  const [abrirContato, setAbrirContato] = useState(false)
  const [nome, setNome] = useState('')
  const [whats, setWhats] = useState('')
  const [email, setEmail] = useState('')
  const [uf, setUf] = useState('')
  const [consent, setConsent] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const r = useMemo(
    () =>
      simular(
        { produto, valorImovelCentavos: imovel * 100, valorCreditoCentavos: credito * 100, taxaMensal: taxa, prazoMeses: prazo, carenciaDias: carencia, sistema },
        cfg,
      ),
    [produto, imovel, credito, taxa, prazo, carencia, sistema, cfg],
  )
  const invalido = r.erros.length > 0
  const erroCredito = r.erros.some((x) => x.startsWith('credito'))
  const ehPrice = sistema === 'price'

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (nome.trim().length < 2) return setErro('Informe seu nome.')
    if (!paraE164(whats)) return setErro('Confira o WhatsApp: use DDD + número, por exemplo (55) 99999-9999.')
    if (!uf) return setErro('Escolha o estado do imóvel.')
    if (!consent) return setErro('Para continuar, aceite o contato da Big Assessoria.')
    setEnviando(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          whatsapp: whats,
          email: email.trim(),
          consentimento: true,
          marketing,
          consentimentoAnuncios: !!lerEscolha()?.marketing,
          uf: uf === 'OUTRO' ? 'XX' : uf,
          simulacao: {
            produto,
            valorImovelCentavos: imovel * 100,
            valorCreditoCentavos: credito * 100,
            taxaMensal: taxa,
            prazoMeses: prazo,
            carenciaDias: carencia,
            sistema,
          },
          atribuicao: coletarAtribuicao(),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 429) throw new Error('Muitas tentativas. Aguarde alguns minutos e tente de novo.')
        if (j.erro === 'whatsapp_invalido') throw new Error('Confira o WhatsApp informado.')
        throw new Error('Não conseguimos enviar agora. Tente de novo em instantes ou chame a gente no WhatsApp.')
      }
      evento('generate_lead', { event_id: j.leadId + ':Lead', produto, valor_credito: credito, fora_regiao: !!j.foraRegiao })
      try {
        sessionStorage.setItem('big_wa', JSON.stringify({ url: j.whatsappUrl, fora: j.foraRegiao, nome: nome.trim().split(' ')[0] }))
      } catch {
        // sem sessionStorage a página de obrigado mostra a versão genérica
      }
      router.push('/obrigado')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado.')
      setEnviando(false)
    }
  }

  return (
    <form className="sim" id="simulador" aria-labelledby="sim-t" noValidate onSubmit={enviar}>
      <h2 id="sim-t">Simule em 30 segundos</h2>

      <div className="tabs" role="tablist" aria-label="Produto">
        <button type="button" role="tab" aria-selected={produto === 'home_equity'} onClick={() => setProduto('home_equity')}>Garantia de imóvel</button>
        <button type="button" role="tab" aria-selected={produto === 'financiamento'} onClick={() => setProduto('financiamento')}>Comprar imóvel</button>
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="imovel">Valor do imóvel</label>
          <div className="money">
            <span>R$</span>
            <input id="imovel" inputMode="numeric" autoComplete="off" value={mascaraReais(imovel)} onChange={(e) => setImovel(reais(e.target.value))} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="credito">Crédito desejado</label>
          <div className="money">
            <span>R$</span>
            <input id="credito" inputMode="numeric" autoComplete="off" value={mascaraReais(credito)} onChange={(e) => setCredito(reais(e.target.value))} aria-invalid={erroCredito} aria-describedby="limite" />
          </div>
        </div>
      </div>
      <p className={'hint' + (erroCredito ? ' warn' : '')} id="limite" style={{ margin: '-8px 0 14px' }}>
        <span>Mínimo R$ 100 mil</span>
        <span>Até {formatarBRL(r.tetoCreditoCentavos).replace(',00', '')} ({Math.round(r.ltvMax * 100)}% do imóvel)</span>
      </p>

      <Grupo
        rotulo="Sistema de amortização"
        valor={sistema}
        onChange={setSistema}
        opcoes={[
          { valor: 'price', rotulo: 'Price', legenda: 'parcela fixa' },
          { valor: 'sac', rotulo: 'SAC', legenda: 'parcela decrescente' },
        ]}
      />
      <Grupo
        rotulo={'Taxa mensal (a partir de ' + formatarPercentual(cfg.taxa_min) + ')'}
        valor={taxa}
        onChange={setTaxa}
        opcoes={[0.0119, 0.0129, 0.0139, 0.0149, 0.0169].map((t) => ({ valor: t, rotulo: formatarPercentual(t) }))}
      />
      <div className="row2">
        <Grupo rotulo="Prazo" valor={prazo} onChange={setPrazo} opcoes={[120, 180, 240].map((p) => ({ valor: p, rotulo: String(p), legenda: 'meses' }))} />
        <Grupo rotulo="Carência" valor={carencia} onChange={setCarencia} opcoes={cfg.carencias.map((c) => ({ valor: c, rotulo: String(c), legenda: 'dias' }))} />
      </div>

      <div className="result" aria-live="polite">
        <div className="main">
          <div className="k">Parcela estimada em {prazo}x · {ehPrice ? 'Price' : 'SAC, 1ª parcela'}</div>
          <div className="v num">{invalido ? '—' : formatarBRL(r.parcelaCentavos)}<small> /mês</small></div>
          <div className="sub">{formatarPercentual(taxa)} a.m. + {cfg.indexador} · 1ª parcela em {carencia} dias</div>
        </div>
        <div>
          <div className="k">{ehPrice ? 'No SAC, 1ª parcela' : 'No Price, parcela fixa'}</div>
          <div className="v num" style={{ fontSize: 20 }}>{invalido ? '—' : formatarBRL(r.outraParcelaCentavos)}</div>
          <div className="sub">{ehPrice ? 'última ' + (invalido ? '—' : formatarBRL(r.outraUltimaCentavos)) : 'igual do início ao fim'}</div>
        </div>
        <div>
          <div className="k">Crédito / imóvel</div>
          <div className="v num" style={{ fontSize: 20 }}>{imovel ? Math.round(r.ltv * 100) + '%' : '—'}</div>
          <div className="sub">limite {Math.round(r.ltvMax * 100)}%</div>
        </div>
      </div>

      {!abrirContato ? (
        <button type="button" className="btn btn-primary btn-lg" disabled={invalido} onClick={() => {
            evento('simulacao_concluida', { produto, valor_credito: credito, prazo_meses: prazo, sistema })
            setAbrirContato(true)
          }}>
          Quero essa simulação com os bancos
        </button>
      ) : (
        <div className="contato">
          <div className="field">
            <label htmlFor="c-nome">Seu nome</label>
            <div className="money"><input id="c-nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="c-wa">WhatsApp</label>
              <div className="money"><input id="c-wa" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(55) 99999-9999" value={whats} onChange={(e) => setWhats(mascaraTelefone(e.target.value))} /></div>
            </div>
            <div className="field">
              <label htmlFor="c-uf">Estado do imóvel</label>
              <div className="money">
                <select id="c-uf" value={uf} onChange={(e) => setUf(e.target.value)}>
                  <option value="">Selecione</option>
                  {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
                  <option value="OUTRO">Outro estado</option>
                </select>
              </div>
            </div>
          </div>
          <div className="field">
            <label htmlFor="c-email">E-mail (opcional)</label>
            <div className="money"><input id="c-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <label className="check">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Autorizo a Big Assessoria a usar meus dados para falar comigo sobre esta simulação, conforme a <a href="/privacidade">política de privacidade</a>.</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            <span>Aceito receber novidades e ofertas por WhatsApp e e-mail (opcional).</span>
          </label>
          {erro ? <p role="alert" className="hint warn">{erro}</p> : null}
          <button type="submit" className="btn btn-primary btn-lg" disabled={enviando} aria-busy={enviando}>
            {enviando ? <><span className="spin" aria-hidden="true" />Enviando</> : <>Falar com um especialista <Icone nome="arrow" tamanho={18} /></>}
          </button>
        </div>
      )}

      <p className="legal">
        <Icone nome="info" tamanho={14} />
        <span>
          Simulação ilustrativa. A parcela não inclui a correção pelo {cfg.indexador}, seguros, tarifas e impostos. Taxa a partir de {formatarPercentual(cfg.taxa_min)} a.m. para o melhor perfil, sujeita a análise e aprovação do banco parceiro.
        </span>
      </p>
    </form>
  )
}
