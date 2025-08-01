import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const app = express();
app.use(cors());

const apiKey = 'ee951cec5f872915d77d6ae8722f57de';
const cache = new Map();

// Função que tenta acesso direto, se falhar usa ScraperAPI
async function fetchWithFallback(url) {
    try {
        const resDireto = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 4000
        });
        return resDireto.data;
    } catch {
        const urlProxy = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
        const resProxy = await axios.get(urlProxy, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        return resProxy.data;
    }
}

app.get('/buscar', async (req, res) => {
    const nome = req.query.nome?.toLowerCase().trim();
    if (!nome) return res.status(400).json({ erro: 'Nome da empresa é obrigatório' });

    if (cache.has(nome)) return res.json({ ...cache.get(nome), cache: true });

    try {
        const htmlBusca = await fetchWithFallback(`https://cnpj.biz/procura/${encodeURIComponent(nome)}`);
        const $ = cheerio.load(htmlBusca);
        const empresaDiv = $('.divide-y li').first();

        if (!empresaDiv.length) return res.status(404).json({ erro: 'Empresa não encontrada' });

        const nomeEmpresa = empresaDiv.find('p.text-lg').text().trim();
        const status = empresaDiv.find('.bg-green-100').text().trim() || empresaDiv.find('.bg-red-100').text().trim();
        const cnpj = empresaDiv.find('p').filter((i, el) => $(el).text().includes('/')).first().text().trim();
        const cidade = empresaDiv.find('p').eq(3).text().trim();
        const dataAbertura = empresaDiv.find('time').text().trim();
        const linkRelativo = empresaDiv.find('a').attr('href');

        const htmlPerfil = await fetchWithFallback(`https://cnpj.biz${linkRelativo}`);
        const $$ = cheerio.load(htmlPerfil);
        const telefone = $$('#extra > div:contains("Telefone")').find('p').text().trim();

        const resultado = {
            nome: nomeEmpresa,
            cnpj,
            status,
            cidade,
            data_abertura: dataAbertura,
            telefone: telefone || null,
            link: `https://cnpj.biz${linkRelativo}`
        };

        cache.set(nome, resultado);
        return res.json(resultado);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ erro: 'Erro na consulta', detalhes: err.message });
    }
});

app.listen(3000, () => {
    console.log('API rodando em http://localhost:3000');
});
