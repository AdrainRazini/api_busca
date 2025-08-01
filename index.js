import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const app = express();
app.use(cors());

const apiKey = 'ee951cec5f872915d77d6ae8722f57de';

app.get('/buscar', async (req, res) => {
    const nome = req.query.nome;
    if (!nome) return res.status(400).json({ erro: 'Nome da empresa é obrigatório' });

    try {
        const urlBusca = http://api.scraperapi.com?api_key=${apiKey}&url=https://cnpj.biz/procura/${encodeURIComponent(nome)};
        const { data: htmlBusca } = await axios.get(urlBusca, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(htmlBusca);
        const empresaDiv = $('.divide-y li').first();

        if (!empresaDiv.length) {
            return res.status(404).json({ erro: 'Empresa não encontrada' });
        }

        const nomeEmpresa = empresaDiv.find('p.text-lg').text().trim();
        const status = empresaDiv.find('.bg-green-100').text().trim() || empresaDiv.find('.bg-red-100').text().trim();
        const cnpj = empresaDiv.find('p').filter((i, el) => $(el).text().includes('/')).first().text().trim();
        const cidade = empresaDiv.find('p').eq(3).text().trim();
        const dataAbertura = empresaDiv.find('time').text().trim();
        const linkRelativo = empresaDiv.find('a').attr('href');

        // Agora acessa a página individual da empresa
        const urlPerfil = http://api.scraperapi.com?api_key=${apiKey}&url=https://cnpj.biz${linkRelativo};
        const { data: htmlPerfil } = await axios.get(urlPerfil, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $$ = cheerio.load(htmlPerfil);
        const telefone = $$('#extra > div:contains("Telefone")').find('p').text().trim();

        return res.json({
            nome: nomeEmpresa,
            cnpj,
            status,
            cidade,
            data_abertura: dataAbertura,
            telefone: telefone || null,
            link: https://cnpj.biz${linkRelativo}
        });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ erro: 'Erro na consulta', detalhes: err.message });
    }
});

app.listen(3000, () => {
    console.log('API rodando em http://localhost:3000');
});
