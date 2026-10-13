
//exibição pesquisa e filtros

//teste de lista inicial de produtos
const produtos = [
    { nome: "Bolo de chocolate", categoria: "bolos", preco: 45.00 },
    { nome: "Cupcake de baunilha", categoria: "cupcakes", preco: 8.00 },
    { nome: "Brigadeiro", categoria: "doces", preco: 3.50 },
    { nome: "Bolo de cenoura", categoria: "bolos", preco: 38.00 }
];

// elementos do HTML que utlizaremos
const productGrid = document.getElementById("productGrid");
const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");

// formata o preco para moeda brasileira
function formatarPreco(preco) {
    return preco.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

//funcao que mostrara os produtos na tela
function mostrarProdutos(lista) {
    if (!productGrid) {
        return;
    }

    // Limpa os produtos anteriores antes de atualizar a lista
    productGrid.innerHTML = "";

    //se o elemento estiver vazio, exiba erro
    if (lista.length === 0) {
        productGrid.textContent = "Nenhum produto encontrado.";
        return;
    }

    // funcao que percorera a lista de produtos
    lista.forEach(function(produto) {
        // cria um cartão para representar o produto
        const cartao = document.createElement("article");
        cartao.classList.add("produto-card");

        // cria o titulo com o nome do produto.
        const nome = document.createElement("h3");
        nome.textContent = produto.nome;

        //categoria do produto
        const categoria = document.createElement("p");
        categoria.textContent = "Categoria: " + produto.categoria;

        //preco formatado
        const preco = document.createElement("p");
        preco.textContent = formatarPreco(produto.preco);

        //adiciona as informacoes ao cartao
        cartao.append(nome, categoria, preco);

        //insere o cartao na grade de produtos
        productGrid.appendChild(cartao);
    });
}

//pesquisa produtos pelo nome e filtra pela categoria
function filtrarProdutos() {
    if (!productGrid || !productSearch || !categoryFilter) {
        return;
    }

    //converte o texto para minsculas para facilitar a busca
    const pesquisa = productSearch.value.toLowerCase().trim();
    const categoriaSelecionada = categoryFilter.value;

    //cria uma lista contendo apenas os produtos correspondentes
    const produtosFiltrados = produtos.filter(function(produto) {
        const nomeCorresponde = produto.nome
            .toLowerCase()
            .includes(pesquisa);

        const categoriaCorresponde =
            categoriaSelecionada === "todos" ||
            produto.categoria === categoriaSelecionada;

        return nomeCorresponde && categoriaCorresponde;
    });

    //atualiza a interface com os resultados encontrados
    mostrarProdutos(produtosFiltrados);
}

if (productGrid) {
    mostrarProdutos(produtos);

    if (productSearch && categoryFilter) {
        //executa a pesquisa quando o usuário digita
        productSearch.addEventListener("input", filtrarProdutos);

        //atualiza os produtos quando a categoria muda
        categoryFilter.addEventListener("change", filtrarProdutos);
    }
}

