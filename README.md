# JUS API - Sistema de Gerenciamento de Publicações do DJE

A JUS API é um sistema de backend robusto e eficiente, construído com Node.js e TypeScript, projetado para gerenciar e automatizar o processamento de publicações do Diário de Justiça Eletrônico (DJE). Esta API serve como um orquestrador, permitindo a autenticação de usuários, o armazenamento detalhado de publicações processuais e o acompanhamento de seu fluxo de trabalho através de um sistema Kanban.

## Funcionalidades Principais:

* **Autenticação Segura:** Gerenciamento de usuários com registro e login, utilizando JWT (JSON Web Tokens) para autenticação segura e controle de acesso às rotas da API.
* **Gestão de Publicações:** Armazenamento e recuperação de publicações do DJE, incluindo dados como número do processo, data de disponibilização, autores, advogados, conteúdo completo e valores associados.
* **Filtros e Busca Avançada:** Capacidade de buscar publicações com base em diversos critérios, como status, número do processo, autores, advogados e período de data.
* **Fluxo de Trabalho Kanban:** Implementação de um sistema de status para publicações ('nova', 'lida', 'enviada_adv', 'concluida'), permitindo o gerenciamento e visualização do progresso das publicações através de transições controladas.
* **Estatísticas Detalhadas:** Fornecimento de dados estatísticos sobre as publicações, como total de publicações por status e valores financeiros agregados.
* **Conectividade com PostgreSQL:** Utilização de PostgreSQL como banco de dados, garantindo persistência e integridade dos dados, com configuração simplificada via Docker Compose para ambiente de desenvolvimento.

## Requisitos para Execução Local

Para rodar a JUS API em seu ambiente de desenvolvimento local, você precisará ter os seguintes softwares instalados:

* **Node.js:** Versão 20.x ou superior.
    * Verifique sua versão com: `node -v`
* **npm** (Node Package Manager) ou **Yarn**:
    * npm é instalado com o Node.js. Verifique com: `npm -v`
    * Yarn (opcional, mas comum em projetos Node.js). Verifique com: `yarn -v`
* **Docker** e **Docker Compose:** Essenciais para configurar e gerenciar o ambiente do banco de dados PostgreSQL.
    * Verifique suas versões com: `docker -v` e `docker compose version`

## Instruções de Instalação e Execução

Siga os passos abaixo para configurar e rodar a JUS API em seu ambiente local:

1.  **Clone o Repositório:**
    ```bash
    git clone [https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git](https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git)
    cd SEU_REPOSITORIO/jus-api # Navegue até o diretório da API
    ```
    (Substitua `SEU_USUARIO/SEU_REPOSITORIO.git` pelo caminho real do seu repositório no GitHub.)

2.  **Instale as Dependências:**
    Instale as dependências do projeto utilizando npm ou yarn:
    ```bash
    npm install
    # OU
    yarn install
    ```

3.  **Configuração do Ambiente (Arquivo `.env`):**
    Crie um arquivo `.env` na raiz do diretório `jus-api` para configurar as variáveis de ambiente. Este arquivo é crucial para a conexão com o banco de dados e para o segredo do JWT.

    **`.env` (exemplo para desenvolvimento local com Docker Compose):**
    ```
    # Configurações do Banco de Dados PostgreSQL (Docker Compose)
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=jus_scraper
    DB_USER=jus_user
    DB_PASSWORD=jus_password

    # Segredo JWT (JSON Web Token)
    # IMPORTANTE: Mude para um valor complexo e seguro em produção!
    JWT_SECRET=seu_jwt_secret_super_seguro_e_longo
    ```
    * **Importante:** Para o `JWT_SECRET`, use um valor forte e único. Em produção, este valor **não deve ser armazenado diretamente no código ou no `.env`**; ele deve ser gerenciado de forma segura pelo seu ambiente de deploy (ex: secrets manager).

4.  **Inicie o Banco de Dados com Docker Compose:**
    O `docker-compose.yml` configura o serviço PostgreSQL. Certifique-se de estar no diretório `jus-api` e execute:
    ```bash
    docker-compose up --build -d postgres
    ```
    Este comando irá construir (se necessário) e iniciar o container do PostgreSQL em segundo plano. Ele também executará o script `database.sql` para criar as tabelas necessárias.

5.  **Inicie a Aplicação da API:**
    Com o banco de dados rodando, você pode iniciar a API:

    * **Modo de Desenvolvimento (com hot-reloading):**
        ```bash
        npm run dev
        # OU
        yarn dev
        ```
        Este comando usa `ts-node-dev` para monitorar as alterações no código e reiniciar o servidor automaticamente.

    * **Modo de Produção (compila e inicia):**
        ```bash
        npm start
        # OU
        yarn start
        ```
        Este comando primeiro compila o TypeScript (`tsc`) e depois inicia a aplicação JavaScript compilada (`node dist/server.js`).

    A API estará acessível em `http://localhost:3000`.

## Exemplos de Requisições à API

A JUS API expõe diversos endpoints para gerenciamento de usuários e publicações. Todas as requisições, exceto as de registro e login, requerem um token de autenticação JWT no cabeçalho `Authorization` (formato `Bearer <token>`).

A URL base para a API é `http://localhost:3000/api`.

---

### Autenticação

#### 1. Registro de Usuário (`POST /api/auth/register`)

Cria uma nova conta de usuário.

**Requisição:**
```bash
curl -X POST \
  http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "nome": "Seu Nome",
    "email": "seu.email@example.com",
    "senha": "SuaSenha@123"
  }'
```
**Exemplo de Resposta (Sucesso - Status 201 Created):**
{
  "user": {
    "id": 1,
    "nome": "Seu Nome",
    "email": "seu.email@example.com",
    "created_at": "2024-07-02T18:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1Ni...",
  "message": "Usuário criado com sucesso"
}

**Requisição:**
```bash
curl -X GET \
  "http://localhost:3000/api/publicacoes?page=1&limit=20" \
  -H 'Authorization: Bearer <SEU_TOKEN_JWT>'
```
**Exemplo de Resposta (Sucesso - Status 201 Created):**
{
  "data": [
    {
      "id": 1,
      "numero_processo": "1234567-89.2023.8.26.0001",
      "data_disponibilizacao": "2024-01-15T03:00:00.000Z",
      "autores": "João da Silva",
      "advogados": "Maria Souza",
      "reu": "Instituto Nacional do Seguro Social - INSS",
      "conteudo_completo": "Conteúdo integral da publicação...",
      "valor_principal_bruto": "15000.00",
      "valor_juros_moratorios": "1500.00",
      "honorarios_advocaticios": "2000.00",
      "status": "nova",
      "data_extracao": "2024-01-15T10:00:00.000Z",
      "url_publicacao": "[http://www.exemplo.com/pub/1](http://www.exemplo.com/pub/1)",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}

## Fluxo de Trabalho Kanban das Publicações

As publicações no sistema JUS API seguem um fluxo de trabalho definido por seu `status`, simulando um quadro Kanban. Este controle de status é importante para o acompanhamento e a organização do processamento de cada publicação.

O campo `status` da publicação pode ter os seguintes valores:

* **`nova`**: Publicação recém-extraída e ainda não analisada.
* **`lida`**: Publicação que foi visualizada ou processada inicialmente.
* **`enviada_adv`**: Publicação que foi enviada para análise ou ação por um advogado.
* **`concluida`**: Publicação cujo ciclo de processamento foi finalizado.

As transições de status são controladas para garantir a integridade do fluxo de trabalho. A API impõe as seguintes regras de movimento:

* `nova` pode transitar para `lida`.
* `lida` pode transitar para `enviada_adv`.
* `enviada_adv` pode transitar para `concluida` ou voltar para `lida`.
* `concluida` é um status final e não pode transitar para nenhum outro status.

## Duvidas:
# Falar com Natan Reis - natangon10@gmail.com