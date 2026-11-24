Cadastro de Alunos

Sistema de cadastro de alunos executado no terminal. Permite cadastrar, listar, buscar, atualizar e excluir alunos, que são organizados em turmas. Os dados ficam salvos em um banco SQLite.

Tecnologias:

- JavaScript, a linguagem do programa
- Node.js, que executa o JavaScript fora do navegador
- Sequelize, que transforma as tabelas em objetos e gera o SQL
- SQLite, o banco de dados, guardado em um único arquivo (escola.sqlite)

Requisitos:

- Node.js versão 18 ou superior
- npm, que já vem com o Node.js

Como executar:

Instale as dependências:

npm install sequelize sqlite3

Rode o programa:

node cadastro_alunos.js

O arquivo escola.sqlite é criado automaticamente na primeira execução.

Funcionalidades:

- Cadastrar aluno: cria o aluno e também a turma, se ela ainda não existir
- Listar alunos: mostra todos em ordem alfabética
- Buscar por matrícula: mostra os dados de um aluno
- Atualizar e-mail: troca o e-mail de um aluno
- Excluir aluno: remove o aluno depois de pedir confirmação

Banco de dados:

O banco tem duas tabelas.

Turmas guarda o id e o nome da turma. O nome é obrigatório e não pode se repetir.

Alunos guarda o id, o nome completo, o e-mail pessoal, a matrícula, a data de ingresso e o turmaId. Todos os campos são obrigatórios. O e-mail e a matrícula não podem se repetir, e o e-mail precisa ter um formato válido. A data é guardada no formato AAAA-MM-DD.

As tabelas se relacionam de um para muitos: uma turma tem vários alunos e cada aluno pertence a uma única turma. O campo turmaId, na tabela de alunos, é a chave estrangeira que aponta para o id da turma.

Validações e erros:

O programa avisa o usuário nos seguintes casos:

- Campo deixado em branco
- Data inexistente ou fora do formato AAAA-MM-DD, como 2024-02-31
- E-mail com formato inválido
- E-mail já cadastrado
- Matrícula já cadastrada
- Matrícula não encontrada
- Opção de menu inválida

Os erros do menu são tratados em um try/catch. O programa mostra a mensagem e volta ao menu, sem fechar.

Detalhes de implementação:

- No cadastro, a turma e o aluno são salvos em uma transação. Se o aluno falhar, a turma criada naquele cadastro também é desfeita.
- Se o nome da turma já existir, ela é reaproveitada em vez de criada de novo.
- Antes de excluir, o programa pede confirmação.
- Excluir um aluno não exclui a turma.
- Ao sair, o programa fecha o terminal e a conexão com o banco.

Dicas:

Para mostrar o SQL gerado pelo Sequelize, troque logging: false por logging: console.log na conexão com o banco. Também é possível abrir o arquivo escola.sqlite no DB Browser for SQLite para ver as tabelas e os registros.

Se a estrutura das tabelas mudar no código, apague o arquivo escola.sqlite antes de rodar de novo, porque o sync não altera tabelas que já existem. Isso apaga os dados cadastrados.
