// ---------------------------------------------------------------------
// 1. CONFIGURAÇÕES GERAIS
// ---------------------------------------------------------------------
// nomes das "gavetas" do localStorage
const CHAVE_PRODUTOS = "lamour_produtos";
const CHAVE_CARRINHO = "lamour_carrinho";
const CHAVE_PEDIDOS = "lamour_pedidos";
const CHAVE_MENSAGENS = "lamour_mensagens";

// com esta quantidade (ou menos) o estoque é considerado baixo
const LIMITE_ESTOQUE_BAIXO = 5;

// status que um pedido pode ter, na ordem do fluxo
const STATUS_PEDIDO = ["Recebido", "Em preparo", "Pronto", "Entregue"];

// como cada categoria aparece na tela
const NOMES_CATEGORIAS = { bolos: "Bolos", cupcakes: "Cupcakes", doces: "Doces" };
const EMOJIS_CATEGORIAS = { bolos: "🎂", cupcakes: "🧁", doces: "🍫" };

// dados que ficam na memória enquanto a página está aberta
let produtos = [];                // lista de produtos (localStorage ou produtos.json)
let carrinho = [];                // itens do carrinho: { id, quantidade }
let produtoAbertoId = null;       // id do produto mostrado na janela de detalhes
let temporizadorMensagem = null;  // guarda o setTimeout da mensagem na tela


// ---------------------------------------------------------------------
// 2. ELEMENTOS DO HTML
// Se o elemento não existir na página atual, a variável vale null.
// ---------------------------------------------------------------------

// mensagem rápida (existe em todas as páginas)
const toast = document.getElementById("toast");

// index.html: lista de produtos
const productGrid = document.getElementById("productGrid");
const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");

// index.html e pedidos.html: janela de detalhes do produto
const productDialog = document.getElementById("productDialog");
const closeDialog = document.getElementById("closeDialog");
const dialogVisual = document.getElementById("dialogVisual");
const dialogCategory = document.getElementById("dialogCategory");
const dialogTitle = document.getElementById("dialogTitle");
const dialogDescription = document.getElementById("dialogDescription");
const dialogPrice = document.getElementById("dialogPrice");
const dialogAdd = document.getElementById("dialogAdd");

// pedidos.html: produtos disponíveis e carrinho
const menuList = document.getElementById("menuList");
const customerName = document.getElementById("customerName");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const clearCart = document.getElementById("clearCart");
const finishOrder = document.getElementById("finishOrder");

// estoque.html: cadastro e tabela de estoque
const productForm = document.getElementById("productForm");
const newProductName = document.getElementById("newProductName");
const newProductCategory = document.getElementById("newProductCategory");
const newProductPrice = document.getElementById("newProductPrice");
const newProductStock = document.getElementById("newProductStock");
const stockTable = document.getElementById("stockTable");

// relatorios.html: resumo e histórico de pedidos
const reportOrders = document.getElementById("reportOrders");
const reportRevenue = document.getElementById("reportRevenue");
const reportItems = document.getElementById("reportItems");
const reportTable = document.getElementById("reportTable");
const resetReports = document.getElementById("resetReports");

// contato.html: formulário de contato
const contactForm = document.getElementById("contactForm");


// ---------------------------------------------------------------------
// 3. FUNÇÕES AUXILIARES (usadas por várias páginas)
// ---------------------------------------------------------------------

// formata o preco para moeda brasileira
function formatarPreco(preco) {
    return preco.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// mostra um aviso no canto da tela e o apaga depois de 3,5 segundos
function mostrarMensagem(texto) {
    if (!toast) {
        console.warn("Esta página não tem o elemento #toast; mensagem não exibida:", texto);
        return;
    }

    toast.textContent = texto;

    // cancela o apagamento anterior, para um aviso novo não sumir cedo demais
    clearTimeout(temporizadorMensagem);

    temporizadorMensagem = setTimeout(function() {
        toast.textContent = "";
    }, 3500);
}

// lê uma lista do localStorage; se não existir ou estiver corrompida,
// devolve o valorPadrao
function lerLista(chave, valorPadrao) {
    try {
        const texto = localStorage.getItem(chave);

        if (texto === null) {
            return valorPadrao;
        }

        return JSON.parse(texto);
    } catch (erro) {
        console.error("Não foi possível ler '" + chave + "':", erro);
        return valorPadrao;
    }
}

// grava uma lista no localStorage; devolve true se deu certo
function salvarLista(chave, lista) {
    try {
        localStorage.setItem(chave, JSON.stringify(lista));
        return true;
    } catch (erro) {
        console.error("Não foi possível salvar '" + chave + "':", erro);
        mostrarMensagem("Não foi possível salvar os dados neste navegador.");
        return false;
    }
}

function salvarProdutos() {
    return salvarLista(CHAVE_PRODUTOS, produtos);
}

function salvarCarrinho() {
    return salvarLista(CHAVE_CARRINHO, carrinho);
}

// cria um elemento HTML com texto e (opcionalmente) uma classe CSS
function criarElemento(tag, texto, classe) {
    const elemento = document.createElement(tag);
    elemento.textContent = texto;

    if (classe) {
        elemento.setAttribute("class", classe);
    }

    return elemento;
}

// cria um botão que executa aoClicar quando for clicado
function criarBotao(texto, classe, aoClicar) {
    const botao = criarElemento("button", texto, classe);
    botao.type = "button";
    botao.addEventListener("click", aoClicar);
    return botao;
}

// procura um produto pelo id (devolve undefined se não achar)
function buscarProduto(id) {
    return produtos.find(function(produto) {
        return produto.id === id;
    });
}

function nomeDaCategoria(categoria) {
    return NOMES_CATEGORIAS[categoria] || categoria;
}

function emojiDaCategoria(categoria) {
    return EMOJIS_CATEGORIAS[categoria] || "🍰";
}

// texto "Em estoque: 8" ou "Esgotado" (tag pode ser "p" ou "span")
function criarTextoEstoque(produto, tag) {
    if (produto.estoque <= 0) {
        return criarElemento(tag, "Esgotado", "texto-estoque esgotado");
    }

    return criarElemento(tag, "Em estoque: " + produto.estoque, "texto-estoque");
}


// ---------------------------------------------------------------------
// 4. CARREGAMENTO DOS PRODUTOS (localStorage + produtos.json)
// ---------------------------------------------------------------------

// Na primeira visita busca o produtos.json e guarda uma cópia no
// localStorage. Nas visitas seguintes usa a cópia, que também guarda
// as alterações feitas no estoque.
async function carregarProdutos() {
    const salvos = lerLista(CHAVE_PRODUTOS, null);

    if (salvos !== null) {
        return salvos;
    }

    try {
        const resposta = await fetch("produtos.json");

        if (!resposta.ok) {
            throw new Error("Resposta HTTP " + resposta.status);
        }

        const dados = await resposta.json();
        salvarLista(CHAVE_PRODUTOS, dados);
        return dados;
    } catch (erro) {
        console.error("Não foi possível carregar o produtos.json:", erro);
        mostrarMensagem("Não foi possível carregar os produtos. Abra o site por um servidor (Live Server ou GitHub Pages).");
        return [];
    }
}


// ---------------------------------------------------------------------
// 5. PÁGINA INICIAL: lista, pesquisa e filtro de produtos
// ---------------------------------------------------------------------

// monta o cartão de um produto
function criarCartaoProduto(produto) {
    const cartao = criarElemento("article", "", "produto-card");

    const visual = criarElemento("div", emojiDaCategoria(produto.categoria), "produto-visual");
    visual.setAttribute("aria-hidden", "true");

    const nome = criarElemento("h3", produto.nome);
    const categoria = criarElemento("p", "Categoria: " + nomeDaCategoria(produto.categoria));
    const preco = criarElemento("p", formatarPreco(produto.preco), "preco-produto");
    const estoque = criarTextoEstoque(produto, "p");

    const botaoDetalhes = criarBotao("Ver detalhes", "botao-secundario", function() {
        abrirDetalhes(produto.id);
    });

    cartao.append(visual, nome, categoria, preco, estoque, botaoDetalhes);

    return cartao;
}

//funcao que mostrara os produtos na tela
function mostrarProdutos(lista) {
    if (!productGrid) {
        return;
    }

    // Limpa os produtos anteriores antes de atualizar a lista
    productGrid.innerHTML = "";

    //se a lista estiver vazia, exibe um aviso
    if (lista.length === 0) {
        productGrid.appendChild(criarElemento("p", "Nenhum produto encontrado.", "mensagem-vazia"));
        return;
    }

    // percorre a lista de produtos e insere um cartão para cada um
    lista.forEach(function(produto) {
        productGrid.appendChild(criarCartaoProduto(produto));
    });
}

//pesquisa produtos pelo nome e filtra pela categoria
function filtrarProdutos() {
    if (!productGrid || !productSearch || !categoryFilter) {
        return;
    }

    //converte o texto para minusculas para facilitar a busca
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

function iniciarPaginaInicial() {
    if (!productGrid) {
        return;
    }

    mostrarProdutos(produtos);

    if (productSearch && categoryFilter) {
        //executa a pesquisa quando o usuário digita
        productSearch.addEventListener("input", filtrarProdutos);

        //atualiza os produtos quando a categoria muda
        categoryFilter.addEventListener("change", filtrarProdutos);
    }
}


// ---------------------------------------------------------------------
// 6. JANELA DE DETALHES DO PRODUTO (index.html e pedidos.html)
// ---------------------------------------------------------------------

// preenche a janela com os dados do produto e a abre
function abrirDetalhes(id) {
    const produto = buscarProduto(id);

    if (!produto || !productDialog) {
        return;
    }

    produtoAbertoId = id;

    dialogVisual.textContent = emojiDaCategoria(produto.categoria);
    dialogCategory.textContent = nomeDaCategoria(produto.categoria);
    dialogTitle.textContent = produto.nome;
    dialogDescription.textContent = produto.descricao || "Este produto ainda não tem descrição.";
    dialogPrice.textContent = formatarPreco(produto.preco);

    // produto esgotado não pode ser adicionado ao pedido
    dialogAdd.disabled = produto.estoque <= 0;
    dialogAdd.textContent = produto.estoque <= 0 ? "Produto esgotado" : "Adicionar ao pedido";

    productDialog.showModal();
}

function iniciarJanelaDetalhes() {
    if (!productDialog) {
        return;
    }

    // reaproveita o estilo do quadrado visual dos cartões (centraliza o emoji)
    dialogVisual.classList.add("produto-visual");

    closeDialog.addEventListener("click", function() {
        productDialog.close();
    });

    dialogAdd.addEventListener("click", function() {
        adicionarAoCarrinho(produtoAbertoId);
        productDialog.close();
    });
}


// ---------------------------------------------------------------------
// 7. CARRINHO (usado nas duas páginas, mostrado em pedidos.html)
// ---------------------------------------------------------------------

function buscarItemDoCarrinho(id) {
    return carrinho.find(function(item) {
        return item.id === id;
    });
}

function adicionarAoCarrinho(id) {
    const produto = buscarProduto(id);

    if (!produto) {
        mostrarMensagem("Produto não encontrado.");
        return;
    }

    if (produto.estoque <= 0) {
        mostrarMensagem(produto.nome + " está esgotado.");
        return;
    }

    const item = buscarItemDoCarrinho(id);

    if (item) {
        // já está no carrinho: só aumenta a quantidade, respeitando o estoque
        if (item.quantidade >= produto.estoque) {
            mostrarMensagem("Só há " + produto.estoque + " unidade(s) de " + produto.nome + " em estoque.");
            return;
        }

        item.quantidade = item.quantidade + 1;
    } else {
        carrinho.push({ id: id, quantidade: 1 });
    }

    salvarCarrinho();
    mostrarMensagem(produto.nome + " adicionado ao pedido.");
    mostrarCarrinho();
}

// soma (diferenca = 1) ou subtrai (diferenca = -1) uma unidade
function alterarQuantidade(id, diferenca) {
    const item = buscarItemDoCarrinho(id);
    const produto = buscarProduto(id);

    if (!item || !produto) {
        return;
    }

    const novaQuantidade = item.quantidade + diferenca;

    if (novaQuantidade > produto.estoque) {
        mostrarMensagem("Só há " + produto.estoque + " unidade(s) de " + produto.nome + " em estoque.");
        return;
    }

    if (novaQuantidade <= 0) {
        removerDoCarrinho(id);
        return;
    }

    item.quantidade = novaQuantidade;
    salvarCarrinho();
    mostrarCarrinho();
}

function removerDoCarrinho(id) {
    // fica só com os itens que NÃO têm o id removido
    carrinho = carrinho.filter(function(item) {
        return item.id !== id;
    });

    salvarCarrinho();
    mostrarCarrinho();
}

// desenha o carrinho e o total na tela (só faz algo em pedidos.html)
function mostrarCarrinho() {
    if (!cartItems) {
        return;
    }

    cartItems.innerHTML = "";

    let total = 0;

    if (carrinho.length === 0) {
        cartItems.appendChild(criarElemento("p", "Seu carrinho está vazio."));
    }

    carrinho.forEach(function(item) {
        const produto = buscarProduto(item.id);

        // produto que não existe mais: pula este item
        if (!produto) {
            return;
        }

        const subtotal = produto.preco * item.quantidade;
        total = total + subtotal;

        const linha = criarElemento("div", "", "item-carrinho");

        const informacoes = document.createElement("div");
        informacoes.append(
            criarElemento("strong", produto.nome),
            criarElemento("span", formatarPreco(produto.preco) + " × " + item.quantidade + " = " + formatarPreco(subtotal))
        );

        const controles = criarElemento("div", "", "controles-quantidade");

        const botaoMenos = criarBotao("-", "botao-quantidade", function() {
            alterarQuantidade(item.id, -1);
        });
        botaoMenos.setAttribute("aria-label", "Diminuir a quantidade de " + produto.nome);

        const botaoMais = criarBotao("+", "botao-quantidade", function() {
            alterarQuantidade(item.id, 1);
        });
        botaoMais.setAttribute("aria-label", "Aumentar a quantidade de " + produto.nome);

        const botaoRemover = criarBotao("Remover", "botao-remover", function() {
            removerDoCarrinho(item.id);
        });
        botaoRemover.setAttribute("aria-label", "Remover " + produto.nome + " do carrinho");

        controles.append(botaoMenos, criarElemento("span", String(item.quantidade)), botaoMais, botaoRemover);
        linha.append(informacoes, controles);
        cartItems.appendChild(linha);
    });

    cartTotal.textContent = formatarPreco(total);
}


// ---------------------------------------------------------------------
// 8. PÁGINA DE PEDIDOS: produtos disponíveis e finalização do pedido
// ---------------------------------------------------------------------

// lista os produtos que podem ser adicionados ao pedido
function mostrarMenu() {
    if (!menuList) {
        return;
    }

    menuList.innerHTML = "";

    if (produtos.length === 0) {
        menuList.appendChild(criarElemento("p", "Nenhum produto cadastrado."));
        return;
    }

    produtos.forEach(function(produto) {
        const linha = criarElemento("div", "", "item-disponivel");

        const informacoes = document.createElement("div");
        informacoes.append(
            criarElemento("strong", produto.nome),
            criarElemento("span", nomeDaCategoria(produto.categoria) + " · " + formatarPreco(produto.preco)),
            criarTextoEstoque(produto, "span")
        );

        const acoes = criarElemento("div", "", "controles-quantidade");

        const botaoDetalhes = criarBotao("Detalhes", "botao-secundario", function() {
            abrirDetalhes(produto.id);
        });

        const botaoAdicionar = criarBotao("Adicionar", "botao", function() {
            adicionarAoCarrinho(produto.id);
        });
        botaoAdicionar.disabled = produto.estoque <= 0;

        acoes.append(botaoDetalhes, botaoAdicionar);
        linha.append(informacoes, acoes);
        menuList.appendChild(linha);
    });
}

function finalizarPedido() {
    const cliente = customerName.value.trim();

    if (carrinho.length === 0) {
        mostrarMensagem("Adicione pelo menos um produto ao carrinho.");
        return;
    }

    if (cliente === "") {
        mostrarMensagem("Informe o nome do cliente.");
        customerName.focus();
        return;
    }

    // 1º passo: conferir TUDO antes de mexer em qualquer dado
    const itensDoPedido = [];
    let total = 0;
    let quantidadeTotal = 0;

    for (let i = 0; i < carrinho.length; i++) {
        const item = carrinho[i];
        const produto = buscarProduto(item.id);

        if (!produto) {
            mostrarMensagem("Um produto do carrinho não existe mais. Remova-o e tente novamente.");
            return;
        }

        if (item.quantidade > produto.estoque) {
            mostrarMensagem("Estoque insuficiente de " + produto.nome + ": restam " + produto.estoque + ".");
            return;
        }

        // guarda uma "foto" do item (nome e preço de agora) no pedido
        itensDoPedido.push({
            nome: produto.nome,
            quantidade: item.quantidade,
            preco: produto.preco
        });

        total = total + produto.preco * item.quantidade;
        quantidadeTotal = quantidadeTotal + item.quantidade;
    }

    // 2º passo: registrar o pedido
    const pedidos = lerLista(CHAVE_PEDIDOS, []);

    const pedido = {
        numero: pedidos.length + 1,
        cliente: cliente,
        data: new Date().toLocaleString("pt-BR"),
        itens: itensDoPedido,
        quantidade: quantidadeTotal,
        total: Math.round(total * 100) / 100,
        status: STATUS_PEDIDO[0]
    };

    pedidos.push(pedido);

    if (!salvarLista(CHAVE_PEDIDOS, pedidos)) {
        return;
    }

    // 3º passo: dar baixa no estoque
    for (let i = 0; i < carrinho.length; i++) {
        const produto = buscarProduto(carrinho[i].id);
        produto.estoque = produto.estoque - carrinho[i].quantidade;
    }

    salvarProdutos();

    // 4º passo: limpar o carrinho e atualizar a tela
    carrinho = [];
    salvarCarrinho();
    customerName.value = "";

    mostrarCarrinho();
    mostrarMenu();
    mostrarMensagem("Pedido #" + pedido.numero + " registrado para " + cliente + ".");
}

function iniciarPaginaPedidos() {
    if (!menuList || !cartItems) {
        return;
    }

    mostrarMenu();
    mostrarCarrinho();

    clearCart.addEventListener("click", function() {
        carrinho = [];
        salvarCarrinho();
        mostrarCarrinho();
        mostrarMensagem("Carrinho limpo.");
    });

    finishOrder.addEventListener("click", finalizarPedido);
}


// ---------------------------------------------------------------------
// 9. PÁGINA DE ESTOQUE: cadastro, reposição e remoção de produtos
// ---------------------------------------------------------------------

// texto da quantidade (a cor do selo é só um reforço, o texto diz tudo)
function descreverEstoque(produto) {
    if (produto.estoque <= 0) {
        return "0 · esgotado";
    }

    if (produto.estoque <= LIMITE_ESTOQUE_BAIXO) {
        return produto.estoque + " · estoque baixo";
    }

    return String(produto.estoque);
}

function mostrarEstoque() {
    if (!stockTable) {
        return;
    }

    const corpo = stockTable.querySelector("tbody");
    corpo.innerHTML = "";

    if (produtos.length === 0) {
        const linhaVazia = document.createElement("tr");
        const celulaVazia = criarElemento("td", "Nenhum produto cadastrado.", "mensagem-vazia");
        celulaVazia.setAttribute("colspan", "5");
        linhaVazia.appendChild(celulaVazia);
        corpo.appendChild(linhaVazia);
        return;
    }

    produtos.forEach(function(produto) {
        const linha = document.createElement("tr");

        const celulaNome = criarElemento("td", produto.nome);
        const celulaCategoria = criarElemento("td", nomeDaCategoria(produto.categoria));
        const celulaPreco = criarElemento("td", formatarPreco(produto.preco));

        // selo da quantidade: laranja se estiver baixo, verde se estiver ok
        const baixo = produto.estoque <= LIMITE_ESTOQUE_BAIXO;
        const classeSelo = baixo
            ? "badge quantidade-estoque status-estoque-baixo"
            : "badge quantidade-estoque status-estoque-ok";

        const celulaQuantidade = document.createElement("td");
        celulaQuantidade.appendChild(criarElemento("span", descreverEstoque(produto), classeSelo));

        // ações: campo + botão para repor, e botão para remover
        const campoQuantidade = document.createElement("input");
        campoQuantidade.type = "number";
        campoQuantidade.min = "1";
        campoQuantidade.step = "1";
        campoQuantidade.value = "1";
        campoQuantidade.setAttribute("aria-label", "Quantidade a repor de " + produto.nome);

        const botaoRepor = criarBotao("Repor", "botao-secundario", function() {
            reporEstoque(produto.id, campoQuantidade.value);
        });

        const botaoRemover = criarBotao("Remover", "botao-remover", function() {
            removerProduto(produto.id);
        });
        botaoRemover.setAttribute("aria-label", "Remover " + produto.nome + " do estoque");

        const ajuste = criarElemento("div", "", "formulario-ajuste-estoque");
        ajuste.append(campoQuantidade, botaoRepor, botaoRemover);

        const celulaAcoes = document.createElement("td");
        celulaAcoes.appendChild(ajuste);

        linha.append(celulaNome, celulaCategoria, celulaPreco, celulaQuantidade, celulaAcoes);
        corpo.appendChild(linha);
    });
}

function cadastrarProduto(evento) {
    // impede o navegador de recarregar a página ao enviar o formulário
    evento.preventDefault();

    const nome = newProductName.value.trim();
    const categoria = newProductCategory.value;
    const preco = Number(newProductPrice.value);
    const estoque = Number(newProductStock.value);

    if (nome === "") {
        mostrarMensagem("Informe o nome do produto.");
        newProductName.focus();
        return;
    }

    if (!(preco > 0)) {
        mostrarMensagem("Informe um preço maior que zero.");
        newProductPrice.focus();
        return;
    }

    if (!Number.isInteger(estoque) || estoque < 0) {
        mostrarMensagem("A quantidade inicial deve ser um número inteiro, de zero para cima.");
        newProductStock.focus();
        return;
    }

    const repetido = produtos.find(function(produto) {
        return produto.nome.toLowerCase() === nome.toLowerCase();
    });

    if (repetido) {
        mostrarMensagem("Já existe um produto chamado " + repetido.nome + ".");
        newProductName.focus();
        return;
    }

    produtos.push({
        id: Date.now(),
        nome: nome,
        categoria: categoria,
        preco: preco,
        estoque: estoque,
        descricao: ""
    });

    salvarProdutos();
    productForm.reset();
    mostrarEstoque();
    mostrarMensagem(nome + " cadastrado no estoque.");
}

function reporEstoque(id, textoQuantidade) {
    const produto = buscarProduto(id);
    const quantidade = Number(textoQuantidade);

    if (!produto) {
        return;
    }

    if (!Number.isInteger(quantidade) || quantidade < 1) {
        mostrarMensagem("Informe uma quantidade inteira maior que zero.");
        return;
    }

    produto.estoque = produto.estoque + quantidade;
    salvarProdutos();
    mostrarEstoque();
    mostrarMensagem("Estoque de " + produto.nome + ": " + produto.estoque + " unidade(s).");
}

function removerProduto(id) {
    const produto = buscarProduto(id);

    if (!produto) {
        return;
    }

    if (!confirm("Remover " + produto.nome + " do estoque?")) {
        return;
    }

    produtos = produtos.filter(function(item) {
        return item.id !== id;
    });

    // o produto também sai do carrinho, se estiver lá
    carrinho = carrinho.filter(function(item) {
        return item.id !== id;
    });

    salvarProdutos();
    salvarCarrinho();
    mostrarEstoque();
    mostrarMensagem(produto.nome + " removido do estoque.");
}

function iniciarPaginaEstoque() {
    if (!stockTable) {
        return;
    }

    mostrarEstoque();

    if (productForm) {
        productForm.addEventListener("submit", cadastrarProduto);
    }
}


// ---------------------------------------------------------------------
// 10. PÁGINA DE RELATÓRIOS: resumo e histórico de pedidos
// ---------------------------------------------------------------------

function mostrarRelatorios() {
    if (!reportTable) {
        return;
    }

    const pedidos = lerLista(CHAVE_PEDIDOS, []);

    // resumo: soma dos valores e das quantidades
    let valorVendido = 0;
    let itensVendidos = 0;

    pedidos.forEach(function(pedido) {
        valorVendido = valorVendido + pedido.total;
        itensVendidos = itensVendidos + pedido.quantidade;
    });

    reportOrders.textContent = String(pedidos.length);
    reportRevenue.textContent = formatarPreco(valorVendido);
    reportItems.textContent = String(itensVendidos);

    // histórico
    const corpo = reportTable.querySelector("tbody");
    corpo.innerHTML = "";

    if (pedidos.length === 0) {
        const linhaVazia = document.createElement("tr");
        const celulaVazia = criarElemento("td", "Nenhum pedido registrado.", "mensagem-vazia");
        celulaVazia.setAttribute("colspan", "5");
        linhaVazia.appendChild(celulaVazia);
        corpo.appendChild(linhaVazia);
        return;
    }

    pedidos.forEach(function(pedido) {
        const linha = document.createElement("tr");

        const celulaNumero = document.createElement("td");
        celulaNumero.append(
            criarElemento("strong", "#" + pedido.numero + " · " + pedido.cliente),
            document.createElement("br"),
            criarElemento("small", pedido.data)
        );

        // "Bolo de chocolate x2, Brigadeiro x1"
        const textosDosItens = pedido.itens.map(function(item) {
            return item.nome + " x" + item.quantidade;
        });

        const celulaProdutos = criarElemento("td", textosDosItens.join(", "));
        const celulaQuantidade = criarElemento("td", String(pedido.quantidade));
        const celulaTotal = criarElemento("td", formatarPreco(pedido.total));

        // seletor de status: ao mudar, atualiza o pedido e salva a lista
        const seletor = criarElemento("select", "", "seletor-status");
        seletor.setAttribute("aria-label", "Status do pedido " + pedido.numero);

        STATUS_PEDIDO.forEach(function(status) {
            const opcao = criarElemento("option", status);
            opcao.value = status;
            seletor.appendChild(opcao);
        });

        seletor.value = pedido.status;

        seletor.addEventListener("change", function() {
            pedido.status = seletor.value;
            salvarLista(CHAVE_PEDIDOS, pedidos);
            mostrarMensagem("Pedido #" + pedido.numero + ": " + pedido.status + ".");
        });

        const celulaStatus = document.createElement("td");
        celulaStatus.appendChild(seletor);

        linha.append(celulaNumero, celulaProdutos, celulaQuantidade, celulaTotal, celulaStatus);
        corpo.appendChild(linha);
    });
}

function iniciarPaginaRelatorios() {
    if (!reportTable) {
        return;
    }

    mostrarRelatorios();

    resetReports.addEventListener("click", function() {
        const pedidos = lerLista(CHAVE_PEDIDOS, []);

        if (pedidos.length === 0) {
            mostrarMensagem("Não há pedidos para apagar.");
            return;
        }

        if (!confirm("Apagar todo o histórico de pedidos? O estoque não será devolvido.")) {
            return;
        }

        salvarLista(CHAVE_PEDIDOS, []);
        mostrarRelatorios();
        mostrarMensagem("Histórico de pedidos apagado.");
    });
}


// ---------------------------------------------------------------------
// 11. PÁGINA DE CONTATO: validação e registro da mensagem
// ---------------------------------------------------------------------

function iniciarPaginaContato() {
    if (!contactForm) {
        return;
    }

    const campoNome = document.getElementById("name");
    const campoEmail = document.getElementById("email");
    const campoMensagem = document.getElementById("message");

    contactForm.addEventListener("submit", function(evento) {
        evento.preventDefault();

        const nome = campoNome.value.trim();
        const email = campoEmail.value.trim();
        const mensagem = campoMensagem.value.trim();

        if (nome.length < 3) {
            mostrarMensagem("Informe seu nome completo.");
            campoNome.focus();
            return;
        }

        if (mensagem.length < 10) {
            mostrarMensagem("Escreva uma mensagem com pelo menos 10 caracteres.");
            campoMensagem.focus();
            return;
        }

        // não há servidor: a mensagem fica guardada neste navegador
        const mensagens = lerLista(CHAVE_MENSAGENS, []);

        mensagens.push({
            nome: nome,
            email: email,
            mensagem: mensagem,
            data: new Date().toLocaleString("pt-BR")
        });

        if (salvarLista(CHAVE_MENSAGENS, mensagens)) {
            contactForm.reset();
            mostrarMensagem("Mensagem enviada! Obrigado pelo contato, " + nome + ".");
        }
    });
}


// ---------------------------------------------------------------------
// 12. INÍCIO: o que acontece quando qualquer página carrega
// ---------------------------------------------------------------------

async function iniciar() {
    // 1) carrega os dados que todas as páginas usam
    produtos = await carregarProdutos();
    carrinho = lerLista(CHAVE_CARRINHO, []);

    // 2) liga cada parte; cada função ignora a página se ela não for a dela
    iniciarJanelaDetalhes();
    iniciarPaginaInicial();
    iniciarPaginaPedidos();
    iniciarPaginaEstoque();
    iniciarPaginaRelatorios();
    iniciarPaginaContato();
}

iniciar();