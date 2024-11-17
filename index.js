const Redux = require('redux')
const dateFns = require('date-fns')
const prompts = require('prompts')

const criarContrato = (data, nome, taxa) => {
  return {
    type: "CRIAR_CONTRATO",
    payload: { data, nome, taxa }
  }
}

const cancelarContrato = (data, nome) => {
  return {
    type: 'CANCELAR_CONTRATO',
    payload: { data, nome }
  }
}

const solicitarCashback = (nome, valor) => {
  return {
    type: "PEDIR_CASHBACK",
    payload: { nome, valor }
  }
}

const comprarProduto = (nomeComprador, nomeProduto, valor) => {
  return {
    type: "COMPRAR_PRODUTO",
    payload: { nomeComprador, nomeProduto, valor }
  }
}

const historicoDePedidosDeCashback = (pedidosCashback = {}, acao = {}, saldoCashbackClientes = {}) => {
  switch (acao.type) {
    case "PEDIR_CASHBACK":
      const saldoCliente = saldoCashbackClientes[acao.payload.nome] || 0;
      if (acao.payload.valor <= saldoCliente) {
        pedidosCashback[acao.payload.nome] = [
          ...(pedidosCashback[acao.payload.nome] || []),
          { valor: acao.payload.valor, status: "ATENDIDO" }
        ];
      } else {
        pedidosCashback[acao.payload.nome] = [
          ...(pedidosCashback[acao.payload.nome] || []),
          { valor: acao.payload.valor, status: "NÃO_ATENDIDO" }
        ];
      }
      return pedidosCashback;
    case "COMPRAR_PRODUTO":
      pedidosCashback[acao.payload.nomeComprador] = [
        ...(pedidosCashback[acao.payload.nomeComprador] || []),
        { valor: acao.payload.valor * 0.1, status: "ATENDIDO" }
      ];
      return pedidosCashback;
    default:
      return pedidosCashback;
  }
};


const caixa = (dinheiroEmCaixa = 1000, acao = {}, estadoAtual = {}) => {
  switch (acao.type) {
    case "PEDIR_CASHBACK":
      // Acessando o histórico de pedidos de cashback diretamente da store
      const pedidos = estadoAtual.historicoDePedidosDeCashback?.[acao.payload.nome] || []; // Usando optional chaining para evitar erro
      const saldoCliente = estadoAtual.saldoCashback?.[acao.payload.nome] || 0; // Acessando o saldo de cashback
      if (acao.payload.valor <= saldoCliente) {
        return dinheiroEmCaixa - acao.payload.valor; // Deduz apenas se o saldo for suficiente
      }
      return dinheiroEmCaixa;

    case "CRIAR_CONTRATO":
      return dinheiroEmCaixa + acao.payload.taxa;

    case "CANCELAR_CONTRATO":
      const duracaoContrato = parseInt(dateFns.formatDistance(acao.payload.data, new Date()).split(' ')[0]);
      return duracaoContrato <= 3 ? dinheiroEmCaixa + 100 : dinheiroEmCaixa;

    case "COMPRAR_PRODUTO":
      return dinheiroEmCaixa + acao.payload.valor * 0.9;

    default:
      return dinheiroEmCaixa;
  }
};



const contratos = (listaDeContratosAtual = [], acao) => {
  switch (acao.type) {
    case "CRIAR_CONTRATO":
      return [...listaDeContratosAtual, acao.payload]
    case "CANCELAR_CONTRATO":
      return listaDeContratosAtual.filter(c => c.nome !== acao.payload.nome)
    default:
      return listaDeContratosAtual
  }
}

const saldoCashback = (saldoCashbackClientes = {}, acao) => {
  switch (acao.type) {
    case "PEDIR_CASHBACK":
      saldoCashbackClientes[acao.payload.nome] -= acao.payload.valor
      return saldoCashbackClientes
    case "COMPRAR_PRODUTO":
      saldoCashbackClientes[acao.payload.nomeComprador] += acao.payload.valor * 0.1
      return saldoCashbackClientes
    default:
      return saldoCashbackClientes
  }
}

const todosOsReducers = Redux.combineReducers({
  historicoDePedidosDeCashback,
  caixa,
  contratos,
  saldoCashback
})

const store = Redux.createStore(todosOsReducers)

async function exibirMenu() {
  while (true) {
    const { opcao } = await prompts({
      type: 'select',
      name: 'opcao',
      message: 'Selecione uma opção:',
      choices: [
        { title: '1. Realizar novo contrato', value: 1 },
        { title: '2. Cancelar contrato existente', value: 2 },
        { title: '3. Consultar saldo de cashback', value: 3 },
        { title: '4. Fazer pedido de cashback', value: 4 },
        { title: '5. Exibir saldo em caixa', value: 5 },
        { title: '6. Comprar produto', value: 6 },
        { title: '0. Sair', value: 0 }
      ]
    })

    if (opcao === 0) {
      console.log('Saindo...')
      break
    }

    await processarOpcao(opcao)
  }
}

async function processarOpcao(opcao) {
  switch (opcao) {
    case 1: {
      const { nome, taxa } = await prompts([
        { type: 'text', name: 'nome', message: 'Digite o nome do cliente:' },
        { type: 'number', name: 'taxa', message: 'Digite a taxa do contrato:' }
      ])
      store.dispatch(criarContrato(new Date(), nome, taxa))
      console.log('Contrato criado com sucesso.')
      console.log(store.getState())
      break
    }
    case 2: {
      const { nome } = await prompts({
        type: 'text',
        name: 'nome',
        message: 'Digite o nome do cliente a ser removido:'
      })
      store.dispatch(cancelarContrato(new Date(), nome))
      console.log('Contrato cancelado com sucesso.')
      console.log(store.getState())
      break
    }
    case 3: {
      const { nome } = await prompts({
        type: 'text',
        name: 'nome',
        message: 'Digite o nome do cliente para consultar o saldo:'
      })
      const saldo = store.getState().saldoCashback[nome]
      console.log(`Saldo de cashback do cliente ${nome}: ${saldo || 0}`)
      console.log(store.getState())
      break
    }
    case 4: {
      const { nome, valor } = await prompts([
        { type: 'text', name: 'nome', message: 'Digite o nome do cliente:' },
        { type: 'number', name: 'valor', message: 'Digite o valor do cashback:' }
      ])
      store.dispatch(solicitarCashback(nome, valor))
      console.log('Pedido de cashback realizado.')
      console.log(store.getState())
      break
    }
    case 5: {
      const saldoEmCaixa = store.getState().caixa
      console.log(`Saldo atual em caixa: ${saldoEmCaixa}`)
      console.log(store.getState())
      break
    }
    case 6: {
      const { nomeComprador, nomeProduto, valor } = await prompts([
        { type: 'text', name: 'nomeComprador', message: 'Digite o nome do comprador:' },
        { type: 'text', name: 'nomeProduto', message: 'Digite o nome do produto:' },
        { type: 'number', name: 'valor', message: 'Digite o valor do produto:' }
      ])
      store.dispatch(comprarProduto(nomeComprador, nomeProduto, valor))
      console.log('Produto comprado com sucesso.')
      console.log(store.getState())
      break
    }
    default:
      console.log('Opção inválida.')
      break
  }
}

exibirMenu()
