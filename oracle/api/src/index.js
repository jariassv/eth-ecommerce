import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getExchangeRate, getRateInfo, convertAmount } from './services/oracleService.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/rate
 * Obtener el rate actual de conversión
 */
app.get('/api/rate', async (req, res, next) => {
  try {
    const rate = await getExchangeRate();
    res.json({
      success: true,
      rate: rate.toString(),
      rateDecimal: Number(rate) / 1e6,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rate/info
 * Obtener información completa del rate (rate, validez, última actualización)
 */
app.get('/api/rate/info', async (req, res, next) => {
  try {
    const info = await getRateInfo();
    res.json({
      success: true,
      rate: info.rate.toString(),
      rateDecimal: Number(info.rate) / 1e6,
      lastUpdate: info.lastUpdate.toString(),
      lastUpdateDate: new Date(Number(info.lastUpdate) * 1000).toISOString(),
      isValid: info.isValid,
      timeSinceUpdate: info.timeSinceUpdate.toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/convert
 * Convertir montos entre USDT y EURT
 * Body: { from: 'USDT' | 'EURT', to: 'USDT' | 'EURT', amount: string }
 */
app.post('/api/convert', async (req, res, next) => {
  try {
    const { from, to, amount } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: from, to, amount'
      });
    }

    if (from !== 'USDT' && from !== 'EURT') {
      return res.status(400).json({
        success: false,
        error: 'Invalid "from" currency. Must be USDT or EURT'
      });
    }

    if (to !== 'USDT' && to !== 'EURT') {
      return res.status(400).json({
        success: false,
        error: 'Invalid "to" currency. Must be USDT or EURT'
      });
    }

    if (from === to) {
      return res.status(400).json({
        success: false,
        error: 'From and to currencies must be different'
      });
    }

    const amountBigInt = BigInt(amount);
    if (amountBigInt <= 0n) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    const converted = await convertAmount(from, to, amountBigInt);

    res.json({
      success: true,
      from,
      to,
      amount: amount.toString(),
      converted: converted.toString(),
      rate: (await getExchangeRate()).toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Oracle API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Oracle contract: ${process.env.EXCHANGE_RATE_ORACLE_ADDRESS || 'NOT SET'}`);
});

