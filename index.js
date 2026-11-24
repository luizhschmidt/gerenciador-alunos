const { Sequelize, DataTypes } = require('sequelize');
const { createInterface } = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

// Conexão com o SQLite (banco em um arquivo só)
const banco = new Sequelize({
  dialect: 'sqlite',
  storage: 'escola.sqlite',
  logging: false // Troque por console.log para mostrar o SQL na apresentação.
});

// Tabela de turmas
const Turma = banco.define('Turma', {
  nome: { type: DataTypes.STRING, allowNull: false, unique: true }
}, {
  tableName: 'turmas',
  timestamps: false
});

// Tabela de alunos
const Aluno = banco.define('Aluno', {
  nomeCompleto: { type: DataTypes.STRING, allowNull: false },
  emailPessoal: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: { msg: 'Digite um e-mail válido.' } // valida o formato
    }
  },
  matricula: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // não repete
  },
  dataIngresso: { type: DataTypes.DATEONLY, allowNull: false } // só data, sem hora
}, {
  tableName: 'alunos',
  timestamps: false
});

// Relacionamento 1:N (uma turma tem vários alunos)
const chaveTurma = { name: 'turmaId', allowNull: false };
Turma.hasMany(Aluno, { foreignKey: chaveTurma });
Aluno.belongsTo(Turma, { foreignKey: chaveTurma, as: 'turma' });

// Entrada e saída pelo terminal
const terminal = createInterface({ input: stdin, output: stdout });

// Pergunta algo e recusa resposta vazia
async function lerCampo(pergunta) {
  const valor = (await terminal.question(pergunta)).trim();
  if (!valor) throw new Error('Preencha o campo solicitado.');
  return valor;
}

// CREATE: cadastra aluno (e cria a turma se não existir)
async function cadastrar() {
  const nomeCompleto = await lerCampo('Nome completo: ');
  const emailPessoal = await lerCampo('E-mail pessoal: ');
  const matricula = await lerCampo('Número da matrícula: ');
  const dataIngresso = await lerCampo('Data de ingresso (AAAA-MM-DD): ');

  // Valida a data: formato, data existente e sem "correção" do JS (ex.: 31/02)
  const data = new Date(`${dataIngresso}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataIngresso) ||
      Number.isNaN(data.getTime()) ||
      data.toISOString().slice(0, 10) !== dataIngresso) {
    throw new Error('Informe uma data válida no formato AAAA-MM-DD.');
  }

  const nomeTurma = await lerCampo('Nome da turma: ');

  // Transação: salva turma e aluno juntos, ou não salva nada
  await banco.transaction(async (transaction) => {
    const [turma] = await Turma.findOrCreate({ // busca ou cria a turma
      where: { nome: nomeTurma },
      transaction
    });

    await Aluno.create({
      nomeCompleto,
      emailPessoal,
      matricula,
      dataIngresso,
      turmaId: turma.id
    }, { transaction });
  });

  console.log('Aluno cadastrado!');
}

// Mostra alunos em tabela no terminal
function mostrarAlunos(alunos) {
  if (alunos.length === 0) {
    console.log('Nenhum aluno encontrado.');
    return;
  }

  console.table(alunos.map(aluno => ({
    Matrícula: aluno.matricula,
    Nome: aluno.nomeCompleto,
    Email: aluno.emailPessoal,
    Ingresso: aluno.dataIngresso,
    Turma: aluno.turma.nome
  })));
}

// READ: lista todos em ordem alfabética
async function listar() {
  const alunos = await Aluno.findAll({
    include: 'turma', // traz a turma junto (JOIN)
    order: [['nomeCompleto', 'ASC']]
  });
  mostrarAlunos(alunos);
}

// READ: busca um aluno pela matrícula (usada também por atualizar e excluir)
async function buscarPorMatricula() {
  const matricula = await lerCampo('Matrícula do aluno: ');
  const aluno = await Aluno.findOne({
    where: { matricula },
    include: 'turma'
  });

  if (!aluno) throw new Error('Matrícula não encontrada.');
  return aluno;
}

// UPDATE: troca o e-mail
async function atualizarEmail() {
  const aluno = await buscarPorMatricula();
  console.log(`Aluno: ${aluno.nomeCompleto} | E-mail atual: ${aluno.emailPessoal}`);
  const emailPessoal = await lerCampo('Novo e-mail pessoal: ');
  await aluno.update({ emailPessoal }); // valida e salva
  console.log('E-mail atualizado!');
}

// DELETE: exclui após confirmação
async function excluir() {
  const aluno = await buscarPorMatricula();
  const resposta = await terminal.question(`Excluir ${aluno.nomeCompleto}? (s/n): `);
  if (resposta.trim().toLowerCase() === 's') {
    await aluno.destroy();
    console.log('Aluno excluído.');
  }
}

// Menu principal
async function iniciar() {
  await banco.sync(); // cria as tabelas se não existirem

  while (true) {
    console.log(`
1 - Cadastrar aluno
2 - Listar alunos
3 - Buscar por matrícula
4 - Atualizar e-mail
5 - Excluir aluno
0 - Sair`);

    const opcao = (await terminal.question('Escolha uma opção: ')).trim();

    // Erros viram mensagens e o menu continua
    try {
      switch (opcao) {
        case '1': await cadastrar(); break;
        case '2': await listar(); break;
        case '3': mostrarAlunos([await buscarPorMatricula()]); break;
        case '4': await atualizarEmail(); break;
        case '5': await excluir(); break;
        case '0': return;
        default: console.log('Escolha uma opção de 0 a 5.');
      }
    } catch (erro) {
      if (erro.name === 'SequelizeUniqueConstraintError') {
        console.log('Essa matrícula já está cadastrada.');
      } else {
        console.log(erro.errors?.[0]?.message ?? erro.message);
      }
    }
  }
}

iniciar()
  .catch(erro => console.error('Erro ao iniciar:', erro.message))
  .finally(async () => { // sempre fecha terminal e banco ao final
    terminal.close();
    await banco.close();
  });