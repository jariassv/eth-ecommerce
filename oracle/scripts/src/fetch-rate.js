import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Obtener el rate EUR/USD desde una API externa
 * Usa exchangerate-api.com (gratis, sin API key para EUR/USD)
 * @returns {Promise<number>} Rate como decimal (ej: 1.10)
 */
export async function fetchEURUSDRate() {
  try {
    // Usar exchangerate-api.com (gratis, sin API key para EUR/USD)
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/EUR', {
      timeout: 10000,
      validateStatus: (status) => status === 200
    });

    if (!response.data || !response.data.rates || !response.data.rates.USD) {
      throw new Error('Invalid response format from exchange rate API');
    }

    const rate = response.data.rates.USD;
    
    // Validar que el rate es razonable (0.8 - 1.5)
    if (rate < 0.8 || rate > 1.5) {
      throw new Error(`Rate ${rate} is out of reasonable range (0.8 - 1.5)`);
    }

    console.log(`✓ Fetched EUR/USD rate: ${rate}`);
    return rate;
  } catch (error) {
    if (error.response) {
      throw new Error(`API error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('No response from exchange rate API. Check your internet connection.');
    } else {
      throw new Error(`Failed to fetch rate: ${error.message}`);
    }
  }
}

/**
 * Convertir rate decimal a formato del contrato (6 decimales)
 * @param {number} rateDecimal - Rate como decimal (ej: 1.10)
 * @returns {bigint} Rate en 6 decimales (ej: 1,100,000)
 */
export function convertRateToContractFormat(rateDecimal) {
  return BigInt(Math.round(rateDecimal * 1e6));
}

// Si se ejecuta directamente, probar la función
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchEURUSDRate()
    .then((rate) => {
      const contractRate = convertRateToContractFormat(rate);
      console.log(`Rate in contract format: ${contractRate.toString()}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

