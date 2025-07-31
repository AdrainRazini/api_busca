import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';
import { createServerlessHandler } from 'vercel-express';

const app = express();
app.use(cors());

const apiKey = 'ee951cec5f872915d77d6ae8722f57de';

app.get('/api/buscar', async (req, res) => {
  const nome = req.query.nome;
  if (!nome) return res.status(400).json({ erro: 'Nome da empresa é obrigatório' });

  try {
    const url = `http://api.scraperapi.com?api_key=${apiKey}&url=https://cnpj.biz/procura/${encodeURIComponent(nome)}`;
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(data);
    const empresaDiv = $('.divide-y li').first();

    if (!empresaDiv.length) return res.status(404).json({ erro: 'Empresa não encontrada' });

    const nomeEmpresa = empresaDiv.find('p.text-lg').text().trim();
    const status = empresaDiv.find('.bg-green-100').text().trim() || empresaDiv.find('.bg-red-100').text().trim();
    const cnpj = empresaDiv.find('p').filter((i, el) => $(el).text().includes('/')).first().text().trim();
    const cidade = empresaDiv.find('p').eq(3).text().trim();
    const dataAbertura = empresaDiv.find('time').text().trim();
    const link = empresaDiv.find('a').attr('href');

    return res.json({ nome: nomeEmpresa, cnpj, status, cidade, data_abertura: dataAbertura, link });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ erro: 'Erro na consulta', detalhes: err.message });
  }
});

// Exporta para Vercel
export default createServerlessHandler(app);
