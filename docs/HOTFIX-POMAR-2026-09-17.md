# Correção do Pomar da Lua Oca, 17/09/2026

## Estado da entrega

Correção aplicada ao código da branch `main`, commit `367a643fe5832920f74d0c441ccf3fdc47f80b1e`. Os testes do GitHub Actions passaram na execução `35231702161`.

**O deploy no endereço original do ChatGPT Sites não foi realizado nesta sessão.** A ferramenta de edição desse projeto não estava disponível; a conta AppDeploy acessível não continha este jogo. Atualizar este repositório, por si só, não publica a alteração no endereço original. Não foram alterados o site de produção, contas ou banco de jogadores, nem foi publicada uma cópia em outro domínio.

## Defeito reproduzido

O Pomar da Lua Oca (`G05`) possui uma única saída, de volta à Fonte da Lua Ferida (`G03`). A descoberta da entrada gravava somente `G03:G05`, enquanto a montagem da sala interna consultava `G05:G03`. Por isso a única saída era recriada como parede secreta. O mesmo ocorria ao importar um salvamento antigo dentro de G05.

## Alteração

Arquivo de execução alterado: `public/campaign-engine.mjs`.

A descoberta de uma passagem secreta de ida e volta agora registra ambos os sentidos. Ao montar a sala, a descoberta anterior, a passagem de chegada ou o único retorno de uma sala sem outras saídas restaura a visibilidade correta. Passagens de sentido único não são convertidas em passagens de ida e volta.

O formato de salvamento continua na versão 1. Não há migração de banco ou necessidade de começar uma partida nova. Exigências de relíquias, transformações e bloqueios de chefes permanecem. Não foram alterados cenários, música, balanceamento, itens ou dados da campanha.

## Verificação

18 testes automatizados em `tests/secret-passages.test.mjs`, executados localmente e no GitHub. Cobrem ida e volta, descoberta ainda desconhecida do lado externo, salvamento antigo, preservação de todos os campos do progresso exceto os indicadores de descoberta reparados, falta de éter, sentido único, bloqueio de chefe e os destinos/requisitos das 60 salas.

Também foi feita uma comparação visual em Chromium offline usando o motor, o renderizador e as imagens originais em memória: com a versão anterior, o retorno estava oculto e a interação permanecia em G05; com o código corrigido, a saída era visível e levava a G03. O salvamento utilizado era sintético, não o salvamento real do usuário. Nenhuma API de conta ou banco de produção foi acessada.

SHA-256 do motor anterior: `a95e1142162904feefe2672b497dc91eb3a803768714d76e39babac262cd5e2f`.
SHA-256 do motor corrigido: `746023678edc9360002f6d6eb1417c4a580e3eb6158090593b92740be81099c4`.

## Publicação pendente

No projeto original de hospedagem, substituir apenas `public/campaign-engine.mjs` pelo arquivo corrigido, preservando servidor, banco, configurações e autenticação. Publicar pelo mecanismo autorizado do projeto, verificar o arquivo servido e então testar a opção de continuar a aventura salva. Não substituir a hospedagem inteira por este backup do cliente, pois ele não contém o servidor privado de contas.

## Saída provisória na implementação anterior

Foi verificado no motor anterior: chegar à extremidade esquerda do Pomar, ficar voltado para a esquerda e manter J pressionado por cerca de dois segundos para quebrar a parede secreta. Perto da passagem revelada, assumir a forma de lobo com T e pressionar W. Se faltar éter, permanecer humano por alguns segundos para regenerá-lo antes de transformar. Isso permite voltar a G03 sem reiniciar a campanha, mas não substitui a publicação da correção.
