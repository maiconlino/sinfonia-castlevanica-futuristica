# SinfonIA Castlevânica Futurística, versão web

Projeto de Maicon Lino. Este é o repositório da versão para navegador, com interface de computador e celular. A adaptação para Super Nintendo permanece em outro repositório.

[Jogo publicado](https://sinfonia-castlevanica-futuristica.maiconheverton.chatgpt.site/) · [Código da versão web](public/) · [Demo original](https://sinfonia-castlevanica-futuristica.maiconheverton.chatgpt.site/demo/) · [Projeto SNES separado](https://github.com/maiconlino/sinfonia-castlevanica-snes)

## Código preservado

Os arquivos públicos foram recuperados da versão publicada e preservados neste repositório em 16/09/2026. Não são uma conversão da ROM de SNES.

| Local | Conteúdo |
|---|---|
| `public/campaign-data.mjs` | Dados da história, regiões, salas, chefes, itens e progressão |
| `public/campaign-engine.mjs` | Lógica da campanha e combate |
| `public/campaign-render.mjs` | Renderização da campanha |
| `public/campaign.js` e `public/campaign.css` | Interface e integração da campanha |
| `public/engine.mjs` e `public/render.mjs` | Módulos compartilhados do jogo |
| `public/touch.mjs` | Controles de toque |
| `public/audio.js` e `public/scores.js` | Reprodução sonora e partituras |
| `public/assets/` | Imagens e atlas de cenários |
| `public/demo/` | Cliente da demo original e suas dependências |

`BACKUP-MANIFEST.json`, `PUBLIC-BUILD-MANIFEST.json` e `ASSET-VERIFICATION.json` registram os arquivos recuperados, origens, tamanhos, hashes e limites das verificações. O jogo hospedado não foi alterado por esta cópia para o GitHub.

## Limite importante: servidor ainda não incluído

Este repositório preserva o **cliente web**, mas **não é um backup completo do sistema online**. O código original do servidor de cadastro, recuperação de conta, salvamento em nuvem e autenticação do ADM ainda precisa ser recuperado do projeto de hospedagem ou do pacote original `sinfonia-codigo-fonte.zip`.

As chamadas de conta e salvamento do cliente dependem das APIs do servidor. Copiar `public/` para outra hospedagem não recria essas APIs nem o acesso administrativo. Nenhuma implementação substituta foi apresentada como se fosse o servidor original.

O banco de jogadores, senhas, sessões e segredos de implantação não devem ser publicados neste repositório público. Ao recuperar o servidor, preserve somente seu código, migrações e instruções de implantação, com exemplos de configuração sem valores secretos.

## Inspeção local dos arquivos públicos

Com Python 3, na raiz do repositório:

```sh
python3 -m http.server 8080 --directory public
```

Abra `http://localhost:8080/` para inspecionar o cliente da campanha e `http://localhost:8080/demo/` para a demo. Esse servidor serve arquivos estáticos, não implementa cadastro, salvamento em conta ou ADM. Não há afirmação de que o sistema online completo funcione apenas com esse comando.

## Procedência

Projeto independente, sem afiliação com Nintendo ou Konami. O backup preserva os arquivos públicos do próprio projeto, não inclui ROMs comerciais nem dados privados de jogadores. Scripts de desafio da hospedagem e arquivos de fontes externos não fazem parte desta cópia.
