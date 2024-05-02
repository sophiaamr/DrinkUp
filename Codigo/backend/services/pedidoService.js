const Database = require("../models/Database");
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const Endereco = require('../models/Endereco');
const ItemPedido = require('../models/ItemPedido');
const Usuario = require('../services/clienteService');
const freteService = require('../services/freteService');


async function criarPedido(itens_do_carrinho, endereco, id_cliente) {
  let transaction;
  let usuarioCriado;
  try {
    //Inicia uma transação passível de rollback
    const db = new Database();
    const sequelize = db.getInstance();
    transaction = await sequelize.transaction();

    //Cria o endereço dentro da transação
    // if(!endereco){
    //     const enderecoCriado = await Endereco.create(endereco, { transaction });
    // }

    // Cria o usuário dentro da transação
    cliente = await Usuario.buscarClientePorId(id_cliente, { transaction });

    const valorTotalPedido = itens_do_carrinho.map(item => item.valor * item.quant).reduce((total, valor) => total + valor , 0);

    const frete = await freteService.calcularFrete(valorTotalPedido);

    // Cria o Pedido usando os IDs do usuário e endereço criados
    const pedido = await Pedido.create({
      "id_frete": 1,
      "valor_pedido": (valorTotalPedido + frete),
      "id_cliente": id_cliente,
      "id_endereco": cliente.id_endereco, //TODO: Deixar o endereço dinamico na chamada
    }, { transaction });

    try {
      for (const element of itens_do_carrinho) {
        await ItemPedido.create({
          quantidade: element.quant,
          valor_item: element.valor,
          id_produto: element.id,
          id_pedido: pedido.id
        }, { transaction });
      }
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao confirmar transação:", error);
    }

    console.log("Transação confirmada com sucesso");

    // Se tudo ocorreu bem, faz o commit da transação
    await transaction.commit();

    return Pedido;
  } catch (error) {
    // Em caso de erro, faz o rollback da transação
    if (transaction) await transaction.rollback();

    // Se houver erro no Pedido, destrua o usuário criado
    if (usuarioCriado) await Usuario.excluirUsuario(usuarioCriado.id);

    console.error('Erro ao criar Pedido:', error);
    throw new Error('Erro ao criar Pedido');
  }
}


async function buscarPedidoPorCpf(cpf) {
  try {
    const Pedido = await Pedido.findOne({ where: { cpf } });
    return Pedido;
  } catch (error) {
    console.error('Erro ao buscar Pedido por CPF:', error);
    throw new Error('Erro ao buscar Pedido por CPF');
  }
}

async function buscarPedidoPorId(id) {
  try {
    const Pedido = await Pedido.findByPk(id);
    return Pedido;
  } catch (error) {
    console.error('Erro ao buscar Pedido por ID:', error);
    throw new Error('Erro ao buscar Pedido por ID');
  }
}


async function listarTodosPedidos() {
  try {
    const Pedidos = await Pedido.findAll();
    return Pedidos;
  } catch (error) {
    console.error('Erro ao listar Pedidos:', error);
    throw new Error('Erro ao listar Pedidos');
  }
}

async function atualizarPedido(id, nome, dataNascimento, telefone, endereco_param) {
  try {
    const Pedido = await Pedido.findByPk(id);
    if (!Pedido) {
      throw new Error('Pedido não encontrado');
    }
    // Atualiza somente os campos de Pedido preenchidos por parâmetro
    if (nome) {
      Pedido.nome = nome
    }
    if (dataNascimento) {
      Pedido.data_nascimento = dataNascimento;
    }
    if (telefone) {
      Pedido.telefone = telefone;
    }

    const endereco = await Endereco.findByPk(Pedido.id_endereco);

    if (endereco) {
      // Atualiza somente os campos de endereço preenchidos por parâmetro
      for (const key in endereco_param) {
        if (Object.hasOwnProperty.call(endereco_param, key)) {
          endereco[key] = endereco_param[key];
        }
      }
      await endereco.save();
    }

    await Pedido.save();
    return Pedido;
  } catch (error) {
    console.error('Erro ao atualizar Pedido:', error);
    throw new Error('Erro ao atualizar Pedido');
  }
}


module.exports = {
  criarPedido,
  listarTodosPedidos,
  buscarPedidoPorCpf,
  buscarPedidoPorId,
  atualizarPedido,
  //excluirPedido
};






