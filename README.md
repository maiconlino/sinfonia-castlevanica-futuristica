# SinfonIA Castlevânica Futurística, navegador

Cópia dos arquivos públicos do jogo existente, recuperados do endereço publicado pelo proprietário em 16/09/2026. A versão SNES fica no repositório separado `maiconlino/sinfonia-castlevanica-snes`.

## Conteúdo e limites deste backup

`public/` contém o cliente da campanha, a demo, suas dependências, arte pública e partituras. `BACKUP-MANIFEST.json` registra a origem, o tamanho, o SHA-256 e eventuais falhas de leitura. O endereço publicado não foi alterado.

Este backup NÃO inclui o código privado do servidor, banco de jogadores, senhas, sessões, segredos de implantação ou a autenticação do ADM. As rotas de conta e salvamento precisam do servidor original para funcionar fora do domínio publicado. Este repositório não afirma ser um backup completo do backend.

## Inspeção local

Na raiz, execute `python3 -m http.server 8080 --directory public` e abra `http://localhost:8080`. Isso serve o cliente e a demo, mas não implementa as APIs de contas. Para restauração completa, deve-se adicionar o pacote original do servidor e suas instruções de implantação, sem publicar segredos nem dados de jogadores.

## Procedência

Projeto independente de Maicon Lino. Assets de jogos comerciais e ROMs comerciais não foram adicionados. Scripts de desafio da hospedagem e arquivos de fontes externos não fazem parte deste backup. A trilha e os recursos públicos do próprio projeto foram preservados quando referenciados pelo cliente.
