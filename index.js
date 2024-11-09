const Redux = require('redux')
const dateFns = require('date-fns')

//função criadora de ação: ela cria novos contratos
const criarContrato = (data, nome, taxa) => {
  //ela devolve uma ação, ou seja, um objeto JS
  return {
    type: "CRIAR_CONTRATO",
    payload: {
      data, nome, taxa
    }
  }
}
//escrever a criadora de ação para cancelamento de contrato
//2 minutos
const cancelarContrato = (data, nome) => {
  return {
    type: 'CANCELAR_CONTRATO',
    payload: {
      data, nome
    }
  }
}

const solicitarCashback = (nome, valor) => {
  return {
    type: "CASHBACK",
    payload: { nome, valor }
  }
}

//reducer para lidar com as solicitações de cashback
const historicoDePedidosDeCashback = (historicoDePedidosDeCashbackAtual = [], acao) => {
  if (acao.type === "CASHBACK") {
    return [
      ...historicoDePedidosDeCashbackAtual,
      acao.payload
    ]
  }
  return historicoDePedidosDeCashbackAtual
}

const caixa = (dinheiroEmCaixa = 0, acao) => {
  if (acao.type === "CASHBACK") {
    dinheiroEmCaixa -= acao.payload.valor
  }
  else if (acao.type === "CRIAR_CONTRATO") {
    dinheiroEmCaixa += acao.payload.taxa
  }
  else if (acao.type === "CANCELAR_CONTRATO") {
    //O resultado do formatDistance é uma string da forma '6 months', por isso pego apenas o primeiro número no índice 0
    //espera-se que o date que vem da ação seja um objeto Date do date-fns
    const duracaoContrato = dateFns.formatDistance(acao.payload.date, new Date())[0]
    if(duracaoContrato <= 3)
      dinheiroEmCaixa += 100
  }
  return dinheiroEmCaixa
}

const contratos = (listaDeContratosAtual = [], acao) => {
  if (acao.type === "CRIAR_CONTRATO")
    return [...listaDeContratosAtual, acao.payload]
  if (acao.type === "CANCELAR_CONTRATO") 
    return listaDeContratosAtual.filter(c => c.nome !== acao.payload.nome)
  return listaDeContratosAtual
}

const { createStore, combineReducers } = Redux

const todosOsReducers = combineReducers({
  historicoDePedidosDeCashback, caixa, contratos
})

const store = createStore(todosOsReducers)
