document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'http://localhost:3000';


    fetch(`${baseUrl}/categorias`)
       .then(response => response.json())
       .then(categorias => {
           const categoriaSelect = document.getElementById('categoriaSelect');
           categorias.forEach(categoria => {
               const option = document.createElement('option');
               option.value = categoria.id; 
               option.textContent = categoria.descricao; 
               categoriaSelect.appendChild(option);
           });
       })
       .catch(error => console.error('Erro ao carregar categorias:', error));



   document.querySelector('.button-busca').addEventListener('click', function() {
       const selectedCategoria = document.getElementById('categoriaSelect').value;
       if (!selectedCategoria) {
           alert('selecione a categoria que deseja filtrar!');
           return;
       }

      fetch(`${baseUrl}/produtos`) 
       .then(response => response.json())
       .then(produtos => {
           const filteredProdutos = produtos.filter(produto => produto.id_categoria.id == selectedCategoria);
           const tbody = document.querySelector('.tabela tbody');
           tbody.innerHTML = ''; 
           filteredProdutos.forEach(produto => {
               const tr = document.createElement('tr');
               tr.setAttribute('data-id', produto.id);
               tr.innerHTML = `<td>${produto.nome}</td>
                               <td>${produto.descricao}</td>
                               <td class="quantidade">${produto.estoque_atual}</td>  
                               <td><button class="adicionar">➕</button></td>
                               <td><button class="remover">➖</button></td>`;
               tbody.appendChild(tr);
           });
           addEventListenersToButtons();
       })
       .catch(error => console.error('Erro ao puxar produtos do banco', error));
         });



         // botoões
      
function addEventListenersToButtons() {
    document.querySelectorAll('.adicionar').forEach(button => {
        button.addEventListener('click', function(event) {
            alterarQuantidade(event, true); 
        });
    });

    document.querySelectorAll('.remover').forEach(button => {
        button.addEventListener('click', function(event) {
            alterarQuantidade(event, false); 
        });
    });
}

function alterarQuantidade(event, isAdding) {
    const tr = event.target.closest('tr');
    const idProduto = tr.getAttribute('data-id');
    if (!idProduto) {
        console.error('ID de produto não encontrado!');
        return;
    }
    const tdQuantidade = tr.querySelector('.quantidade');
    let quantidadeAtual = parseInt(tdQuantidade.textContent);
    let quantidadeAlterar;
    if (isAdding) {
        quantidadeAlterar = parseInt(prompt("Quantos itens queremos adicionar?"));
    } else {
        quantidadeAlterar = parseInt(prompt("Quantos itens queremos remover?")); }
    if (!quantidadeAlterar || quantidadeAlterar < 0) {
        alert('valor inválido digitado. Favor tentar novamente');
        return; }
    if (!isAdding && quantidadeAtual < quantidadeAlterar) {
        alert('Quantidade insuficinete para esta operação :(   tente novamente');
        return;}
    let novaQuantidade;
    if (isAdding) {
        novaQuantidade = quantidadeAtual + quantidadeAlterar;
    } else {
        novaQuantidade = quantidadeAtual - quantidadeAlterar;
    }

    fetch(`${baseUrl}/produtos/atualizar-estoque/${idProduto}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            estoque_atual: novaQuantidade
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message); 
        tdQuantidade.textContent = novaQuantidade; 
    })
    .catch(error => {
        console.error('Erro em atualizar estoque :(', error);
    });
    
}
        
});
