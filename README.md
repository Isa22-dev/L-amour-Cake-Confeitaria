# L'amour Cake - Confeitaria

Projeto universitario de front-end que simula o site e o painel de gerenciamento de uma confeitaria. A aplicacao permite consultar produtos, montar um carrinho, registrar pedidos e administrar o estoque diretamente pelo navegador.

## Funcionalidades

- **Pagina inicial (`index.html`):** exibe os produtos, permite filtrar a lista e consultar detalhes.
- **Carrinho e pedidos (`pedidos.html`):** permite adicionar produtos, alterar quantidades e finalizar pedidos com o nome do cliente. Os pedidos podem ser consultados na pagina de pedidos.
- **Estoque (`estoque.html`):** permite cadastrar produtos, repor quantidades e remover produtos.
- **Relatorios (`relatorios.html`):** apresenta informacoes resumidas dos pedidos e produtos cadastrados.
- **Contato (`contato.html`):** apresenta o formulario de contato.
- **Sobre (`sobre.html`):** apresenta informacoes sobre a confeitaria.

## Arquivos do projeto

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura da pagina inicial e area de produtos. |
| `pedidos.html` | Estrutura da pagina de pedidos e carrinho. |
| `estoque.html` | Estrutura da pagina de gerenciamento do estoque. |
| `relatorios.html` | Estrutura da pagina de relatorios. |
| `contato.html` | Estrutura da pagina de contato. |
| `sobre.html` | Estrutura da pagina institucional. |
| `style.css` | Estilos, cores, organizacao visual e adaptacao das paginas. |
| `script.js` | Logica das paginas, interacoes, carrinho, pedidos, estoque e armazenamento local. |
| `produtos.json` | Dados iniciais dos produtos exibidos na loja. |

As paginas HTML compartilham o `style.css` e carregam o `script.js` com `defer`, para que a estrutura HTML seja lida antes da execucao do JavaScript.

## Como o codigo funciona

### 1. Carregamento dos produtos

Ao abrir a aplicacao, o JavaScript procura os produtos salvos no `localStorage` do navegador. Se ainda nao houver uma lista salva, carrega os dados iniciais de `produtos.json` usando `fetch()` e guarda essa lista no armazenamento local.

Cada produto possui campos como `id`, `nome`, `categoria`, `preco`, `estoque` e `descricao`. A pagina inicial usa esses dados para montar os cartoes de produto e aplicar filtros.

### 2. Inicializacao de cada pagina

O arquivo `script.js` identifica os elementos presentes na pagina atual e chama a rotina correspondente. Assim, o mesmo script atende varias paginas: inicializa a vitrine na pagina inicial e, nas demais, configura os recursos de pedidos, estoque, relatorios ou contato que estiverem disponiveis.

### 3. Carrinho e finalizacao de pedidos

O carrinho guarda os produtos escolhidos e suas quantidades. O cliente pode alterar essas quantidades ou remover itens. Ao finalizar, o sistema registra o pedido com os dados do cliente e os itens, atualiza os dados necessarios e limpa o carrinho.

### 4. Gerenciamento do estoque

Na pagina de estoque, e possivel cadastrar produtos e alterar ou remover itens. As mudancas sao salvas no navegador e refletidas nas paginas que utilizam a lista de produtos.

### 5. Persistencia dos dados

As funcoes auxiliares de leitura e gravacao do `script.js` usam `JSON.parse()` e `JSON.stringify()` para converter listas entre objetos JavaScript e texto armazenado. Os dados sao guardados no `localStorage` do navegador com estas chaves:

- `lamour_produtos`: produtos e quantidades em estoque;
- `lamour_carrinho`: itens atualmente no carrinho;
- `lamour_pedidos`: pedidos registrados;
- `lamour_mensagens`: mensagens do formulario de contato, quando aplicavel.

Como o projeto nao tem servidor ou banco de dados, essas informacoes ficam no navegador e no dispositivo em que foram registradas. Limpar os dados do navegador pode apagar os registros; outros dispositivos ou navegadores nao compartilham automaticamente os mesmos dados.

## Como executar

1. Abra a pasta do projeto no Visual Studio Code.
2. Inicie um servidor local para a pasta, por exemplo, com a extensao **Live Server**.
3. Abra `index.html` pelo endereco local fornecido pelo servidor.

O uso de um servidor local e recomendado porque os produtos iniciais sao carregados com `fetch()` de `produtos.json`; abrir o HTML diretamente como arquivo pode impedir esse carregamento em alguns navegadores.

## Tecnologias

- HTML5 para a estrutura das paginas;
- CSS3 para a apresentacao visual;
- JavaScript para as interacoes e regras da aplicacao;
- JSON para os dados iniciais dos produtos;
- `localStorage` para guardar os dados no navegador.
